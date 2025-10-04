#!/usr/bin/env python3
"""
Trading Journal Backend API Testing Suite
Tests all endpoints including authentication, trades CRUD, file upload, and dashboard stats
"""

import requests
import sys
import json
from datetime import datetime, date
import uuid
import os

class TradingJournalAPITester:
    def __init__(self, base_url="https://tradeflow-36.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })
        return success

    def make_request(self, method, endpoint, data=None, files=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.make_request('GET', '')
        if success and response.get('message') == 'Trading Journal API':
            return self.log_test("Root endpoint", True, "API is running")
        else:
            return self.log_test("Root endpoint", False, f"Response: {response}")

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@trader.com"
        user_data = {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test Trader"
        }
        
        success, response = self.make_request('POST', 'auth/register', user_data, expected_status=200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return self.log_test("User registration", True, f"User created: {test_email}")
        else:
            return self.log_test("User registration", False, f"Response: {response}")

    def test_user_login(self):
        """Test user login with existing user"""
        # Try to login with test@trader.com (mentioned in context)
        login_data = {
            "email": "test@trader.com",
            "password": "password123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return self.log_test("User login (existing)", True, f"Logged in as: {response['user']['email']}")
        else:
            # If existing user doesn't work, that's okay - we have registered user
            return self.log_test("User login (existing)", False, "Existing user not found - using registered user")

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.token:
            return self.log_test("Get current user", False, "No token available")
        
        success, response = self.make_request('GET', 'auth/me')
        
        if success and 'email' in response:
            return self.log_test("Get current user", True, f"User: {response['email']}")
        else:
            return self.log_test("Get current user", False, f"Response: {response}")

    def test_create_trade(self):
        """Test creating a new trade"""
        if not self.token:
            return self.log_test("Create trade", False, "No token available")
        
        trade_data = {
            "date": date.today().isoformat(),
            "pair": "EUR/USD",
            "trade_type": "Long",
            "entry_price": 1.0850,
            "exit_price": 1.0920,
            "quantity": 10000,
            "stop_loss": 1.0800,
            "take_profit": 1.0950,
            "risk_amount": 500,
            "pnl": 700,
            "comments": "Test trade - good setup with clear trend"
        }
        
        success, response = self.make_request('POST', 'trades', trade_data, expected_status=200)
        
        if success and 'id' in response:
            self.test_trade_id = response['id']
            return self.log_test("Create trade", True, f"Trade created: {response['pair']}")
        else:
            return self.log_test("Create trade", False, f"Response: {response}")

    def test_get_trades(self):
        """Test getting all trades for user"""
        if not self.token:
            return self.log_test("Get trades", False, "No token available")
        
        success, response = self.make_request('GET', 'trades')
        
        if success and isinstance(response, list):
            return self.log_test("Get trades", True, f"Found {len(response)} trades")
        else:
            return self.log_test("Get trades", False, f"Response: {response}")

    def test_get_single_trade(self):
        """Test getting a single trade by ID"""
        if not self.token or not hasattr(self, 'test_trade_id'):
            return self.log_test("Get single trade", False, "No token or trade ID available")
        
        success, response = self.make_request('GET', f'trades/{self.test_trade_id}')
        
        if success and 'id' in response:
            return self.log_test("Get single trade", True, f"Trade: {response['pair']}")
        else:
            return self.log_test("Get single trade", False, f"Response: {response}")

    def test_update_trade(self):
        """Test updating a trade"""
        if not self.token or not hasattr(self, 'test_trade_id'):
            return self.log_test("Update trade", False, "No token or trade ID available")
        
        update_data = {
            "pnl": 850,
            "comments": "Updated test trade - even better than expected"
        }
        
        success, response = self.make_request('PUT', f'trades/{self.test_trade_id}', update_data)
        
        if success and response.get('pnl') == 850:
            return self.log_test("Update trade", True, f"Trade updated: P&L = ${response['pnl']}")
        else:
            return self.log_test("Update trade", False, f"Response: {response}")

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        if not self.token:
            return self.log_test("Dashboard stats", False, "No token available")
        
        success, response = self.make_request('GET', 'dashboard/stats')
        
        expected_fields = ['total_trades', 'total_pnl', 'win_rate', 'winning_trades', 'losing_trades']
        
        if success and all(field in response for field in expected_fields):
            return self.log_test("Dashboard stats", True, 
                f"Stats: {response['total_trades']} trades, ${response['total_pnl']} P&L, {response['win_rate']}% win rate")
        else:
            return self.log_test("Dashboard stats", False, f"Response: {response}")

    def test_file_upload(self):
        """Test file upload endpoint"""
        if not self.token:
            return self.log_test("File upload", False, "No token available")
        
        # Create a simple test image file
        test_content = b"fake image content for testing"
        files = {'file': ('test_chart.jpg', test_content, 'image/jpeg')}
        
        success, response = self.make_request('POST', 'upload', files=files)
        
        if success and 'url' in response:
            self.test_file_url = response['url']
            return self.log_test("File upload", True, f"File uploaded: {response['url']}")
        else:
            return self.log_test("File upload", False, f"Response: {response}")

    def test_delete_trade(self):
        """Test deleting a trade"""
        if not self.token or not hasattr(self, 'test_trade_id'):
            return self.log_test("Delete trade", False, "No token or trade ID available")
        
        success, response = self.make_request('DELETE', f'trades/{self.test_trade_id}', expected_status=200)
        
        if success and response.get('message') == 'Trade deleted successfully':
            return self.log_test("Delete trade", True, "Trade deleted successfully")
        else:
            return self.log_test("Delete trade", False, f"Response: {response}")

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test 404 for non-existent trade
        success, response = self.make_request('GET', 'trades/invalid-id', expected_status=404)
        if success:
            self.log_test("404 handling", True, "Correctly returns 404 for invalid trade ID")
        else:
            self.log_test("404 handling", False, "Should return 404 for invalid trade ID")

        # Test unauthorized access
        old_token = self.token
        self.token = "invalid-token"
        success, response = self.make_request('GET', 'trades', expected_status=401)
        self.token = old_token
        
        if success:
            self.log_test("401 handling", True, "Correctly returns 401 for invalid token")
        else:
            self.log_test("401 handling", False, "Should return 401 for invalid token")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Trading Journal API Tests")
        print("=" * 50)
        
        # Test sequence
        self.test_root_endpoint()
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_create_trade()
        self.test_get_trades()
        self.test_get_single_trade()
        self.test_update_trade()
        self.test_dashboard_stats()
        self.test_file_upload()
        self.test_invalid_endpoints()
        self.test_delete_trade()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            failed_tests = [t for t in self.test_results if not t['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
            return 1

def main():
    """Main test runner"""
    tester = TradingJournalAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())