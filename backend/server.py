from fastapi import FastAPI, HTTPException, Depends, APIRouter, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone, date, time
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import uuid
import logging
import aiofiles
import shutil
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and password settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Trading Journal API")
api_router = APIRouter(prefix="/api")

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TradeCreate(BaseModel):
    date: date
    pair: str
    trade_type: str  # "Long" or "Short"
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_amount: Optional[float] = None
    pnl: Optional[float] = None
    comments: Optional[str] = None
    chart_image_url: Optional[str] = None

class TradeUpdate(BaseModel):
    date: Optional[date] = None
    pair: Optional[str] = None
    trade_type: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_amount: Optional[float] = None
    pnl: Optional[float] = None
    comments: Optional[str] = None
    chart_image_url: Optional[str] = None

class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: date
    pair: str
    trade_type: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_amount: Optional[float] = None
    pnl: Optional[float] = None
    comments: Optional[str] = None
    chart_image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

def prepare_for_mongo(data):
    if isinstance(data.get('date'), date):
        data['date'] = data['date'].isoformat()
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('date'), str):
        item['date'] = datetime.fromisoformat(item['date']).date()
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name
    )
    
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict = prepare_for_mongo(user_dict)
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**parse_from_mongo(user))
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# File upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the file URL
        file_url = f"/uploads/{unique_filename}"
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# Trade endpoints
@api_router.post("/trades", response_model=Trade)
async def create_trade(trade_data: TradeCreate, current_user: User = Depends(get_current_user)):
    trade = Trade(**trade_data.dict(), user_id=current_user.id)
    
    trade_dict = prepare_for_mongo(trade.dict())
    await db.trades.insert_one(trade_dict)
    
    return trade

@api_router.get("/trades", response_model=List[Trade])
async def get_trades(current_user: User = Depends(get_current_user)):
    trades = await db.trades.find({"user_id": current_user.id}).sort("date", -1).to_list(1000)
    return [Trade(**parse_from_mongo(trade)) for trade in trades]

@api_router.get("/trades/{trade_id}", response_model=Trade)
async def get_trade(trade_id: str, current_user: User = Depends(get_current_user)):
    trade = await db.trades.find_one({"id": trade_id, "user_id": current_user.id})
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    return Trade(**parse_from_mongo(trade))

@api_router.put("/trades/{trade_id}", response_model=Trade)
async def update_trade(trade_id: str, trade_data: TradeUpdate, current_user: User = Depends(get_current_user)):
    trade = await db.trades.find_one({"id": trade_id, "user_id": current_user.id})
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    update_data = {k: v for k, v in trade_data.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data = prepare_for_mongo(update_data)
    
    await db.trades.update_one({"id": trade_id}, {"$set": update_data})
    
    updated_trade = await db.trades.find_one({"id": trade_id})
    return Trade(**parse_from_mongo(updated_trade))

@api_router.delete("/trades/{trade_id}")
async def delete_trade(trade_id: str, current_user: User = Depends(get_current_user)):
    result = await db.trades.delete_one({"id": trade_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    return {"message": "Trade deleted successfully"}

# Dashboard stats endpoint
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    trades = await db.trades.find({"user_id": current_user.id}).to_list(1000)
    
    if not trades:
        return {
            "total_trades": 0,
            "total_pnl": 0,
            "win_rate": 0,
            "winning_trades": 0,
            "losing_trades": 0
        }
    
    total_trades = len(trades)
    total_pnl = sum(trade.get("pnl", 0) for trade in trades if trade.get("pnl"))
    winning_trades = len([t for t in trades if t.get("pnl", 0) > 0])
    losing_trades = len([t for t in trades if t.get("pnl", 0) < 0])
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    return {
        "total_trades": total_trades,
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2),
        "winning_trades": winning_trades,
        "losing_trades": losing_trades
    }

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()