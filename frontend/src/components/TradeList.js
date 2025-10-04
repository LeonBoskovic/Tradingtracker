import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Filter
} from 'lucide-react';

const TradeList = () => {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, searchTerm, filterType]);

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API}/trades`);
      setTrades(response.data);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = trades;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.comments?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      if (filterType === 'long') {
        filtered = filtered.filter(trade => trade.trade_type === 'Long');
      } else if (filterType === 'short') {
        filtered = filtered.filter(trade => trade.trade_type === 'Short');
      } else if (filterType === 'profitable') {
        filtered = filtered.filter(trade => trade.pnl > 0);
      } else if (filterType === 'losing') {
        filtered = filtered.filter(trade => trade.pnl < 0);
      }
    }

    setFilteredTrades(filtered);
  };

  const handleDelete = async () => {
    if (!tradeToDelete) return;

    try {
      await axios.delete(`${API}/trades/${tradeToDelete.id}`);
      setTrades(trades.filter(t => t.id !== tradeToDelete.id));
      toast.success('Trade deleted successfully');
    } catch (error) {
      toast.error('Failed to delete trade');
    } finally {
      setDeleteDialogOpen(false);
      setTradeToDelete(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in" data-testid="trade-list-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Trades</h1>
            <p className="text-gray-600">Manage and analyze your trading history</p>
          </div>
          <Link to="/add-trade">
            <Button className="btn-primary text-white flex items-center space-x-2" data-testid="add-trade-btn">
              <Plus className="w-4 h-4" />
              <span>Add Trade</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by pair or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-focus"
                  data-testid="search-input"
                />
              </div>

              {/* Filter */}
              <div className="md:w-48">
                <Select value={filterType} onValueChange={setFilterType} data-testid="filter-select">
                  <SelectTrigger className="input-focus">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="long">Long Trades</SelectItem>
                    <SelectItem value="short">Short Trades</SelectItem>
                    <SelectItem value="profitable">Profitable</SelectItem>
                    <SelectItem value="losing">Losing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trades List */}
        {filteredTrades.length === 0 ? (
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-12 text-center" data-testid="no-trades-found">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {trades.length === 0 ? 'No trades yet' : 'No trades found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {trades.length === 0 
                  ? 'Start your trading journey by adding your first trade' 
                  : 'Try adjusting your search or filters'}
              </p>
              {trades.length === 0 && (
                <Link to="/add-trade">
                  <Button className="btn-primary text-white">
                    Add Your First Trade
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="trades-grid">
            {filteredTrades.map((trade, index) => (
              <Card key={trade.id} className="glass-effect border-0 shadow-lg card-hover" data-testid={`trade-card-${index}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    {/* Trade Info */}
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        trade.trade_type === 'Long' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {trade.trade_type === 'Long' ? 
                          <TrendingUp className="w-5 h-5 text-emerald-600" /> : 
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        }
                      </div>

                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900" data-testid={`trade-pair-${index}`}>
                            {trade.pair}
                          </h3>
                          <Badge 
                            variant={trade.trade_type === 'Long' ? 'default' : 'secondary'}
                            className={trade.trade_type === 'Long' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                          >
                            {trade.trade_type}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(trade.date)}</span>
                          </span>
                          <span>Qty: {trade.quantity}</span>
                          <span>Entry: {trade.entry_price}</span>
                          {trade.exit_price && <span>Exit: {trade.exit_price}</span>}
                        </div>
                      </div>
                    </div>

                    {/* P&L and Actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>P&L</span>
                        </div>
                        <div className={`text-xl font-bold ${
                          trade.pnl > 0 ? 'text-emerald-600' : 
                          trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`} data-testid={`trade-pnl-${index}`}>
                          {formatCurrency(trade.pnl)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link to={`/edit-trade/${trade.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                            data-testid={`edit-trade-btn-${index}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => {
                            setTradeToDelete(trade);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-trade-btn-${index}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments Preview */}
                  {trade.comments && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <p className="text-sm text-gray-600 truncate">{trade.comments}</p>
                    </div>
                  )}

                  {/* Chart Image Preview */}
                  {trade.chart_image_url && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}${trade.chart_image_url}`}
                        alt="Trade chart"
                        className="max-w-full max-h-32 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trade</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trade for {tradeToDelete?.pair}? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-delete-btn">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="btn-danger text-white"
                data-testid="confirm-delete-btn"
              >
                Delete Trade
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TradeList;