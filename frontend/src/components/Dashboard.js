import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext, API } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Plus,
  BarChart3,
  Calendar,
  Trophy
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tradesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trades`)
      ]);
      
      setStats(statsRes.data);
      setRecentTrades(tradesRes.data.slice(0, 5)); // Get last 5 trades
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen p-4 md:p-8" data-testid="dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-emerald-600">{user?.full_name}</span>
            </h1>
            <p className="text-gray-600">Track your trading performance and improve your strategy</p>
          </div>
          <Link to="/add-trade">
            <Button className="btn-primary text-white px-6 py-3 flex items-center space-x-2" data-testid="add-trade-btn">
              <Plus className="w-5 h-5" />
              <span>Add New Trade</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in">
          <Card className="card-hover glass-effect border-0 shadow-lg" data-testid="total-trades-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900" data-testid="total-trades-value">
                {stats?.total_trades || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Lifetime trades executed</p>
            </CardContent>
          </Card>

          <Card className={`card-hover glass-effect border-0 shadow-lg ${stats?.total_pnl >= 0 ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500'}`} data-testid="total-pnl-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total P&L</CardTitle>
              <DollarSign className={`h-4 w-4 ${stats?.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats?.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`} data-testid="total-pnl-value">
                {formatCurrency(stats?.total_pnl)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </CardContent>
          </Card>

          <Card className="card-hover glass-effect border-0 shadow-lg" data-testid="win-rate-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600" data-testid="win-rate-value">
                {stats?.win_rate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Success percentage</p>
            </CardContent>
          </Card>

          <Card className="card-hover glass-effect border-0 shadow-lg" data-testid="winning-trades-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Win/Loss</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600" data-testid="win-loss-value">
                {stats?.winning_trades || 0}/{stats?.losing_trades || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Winning vs losing trades</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        <div className="animate-scale-in">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Recent Trades</CardTitle>
                <CardDescription>Your latest trading activity</CardDescription>
              </div>
              <Link to="/trades">
                <Button variant="outline" size="sm" data-testid="view-all-trades-btn">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTrades.length === 0 ? (
                <div className="text-center py-12" data-testid="no-trades-message">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trades yet</h3>
                  <p className="text-gray-500 mb-6">Start your trading journey by adding your first trade</p>
                  <Link to="/add-trade">
                    <Button className="btn-primary text-white">
                      Add Your First Trade
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4" data-testid="recent-trades-list">
                  {recentTrades.map((trade, index) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors duration-200"
                      data-testid={`recent-trade-${index}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${trade.trade_type === 'Long' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {trade.trade_type === 'Long' ? 
                            <TrendingUp className="w-4 h-4 text-emerald-600" /> : 
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{trade.pair}</p>
                          <p className="text-sm text-gray-500 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(trade.date)}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">P&L</p>
                        <p className={`font-semibold ${
                          trade.pnl > 0 ? 'text-emerald-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;