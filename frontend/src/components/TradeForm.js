import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API } from '../App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from 'axios';
import { ArrowLeft, Upload, X, Image } from 'lucide-react';

const TradeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: '',
    trade_type: '',
    entry_price: '',
    exit_price: '',
    quantity: '',
    stop_loss: '',
    take_profit: '',
    risk_amount: '',
    pnl: '',
    comments: '',
    chart_image_url: ''
  });

  useEffect(() => {
    if (isEditing) {
      fetchTrade();
    }
  }, [id, isEditing]);

  const fetchTrade = async () => {
    try {
      const response = await axios.get(`${API}/trades/${id}`);
      const trade = response.data;
      setFormData({
        date: trade.date,
        pair: trade.pair,
        trade_type: trade.trade_type,
        entry_price: trade.entry_price?.toString() || '',
        exit_price: trade.exit_price?.toString() || '',
        quantity: trade.quantity?.toString() || '',
        stop_loss: trade.stop_loss?.toString() || '',
        take_profit: trade.take_profit?.toString() || '',
        risk_amount: trade.risk_amount?.toString() || '',
        pnl: trade.pnl?.toString() || '',
        comments: trade.comments || '',
        chart_image_url: trade.chart_image_url || ''
      });
    } catch (error) {
      toast.error('Failed to fetch trade details');
      navigate('/trades');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      handleInputChange('chart_image_url', response.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingFile(false);
    }
  };

  const removeImage = () => {
    handleInputChange('chart_image_url', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert string values to numbers
      const submitData = {
        ...formData,
        entry_price: parseFloat(formData.entry_price) || 0,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        quantity: parseFloat(formData.quantity) || 0,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        risk_amount: formData.risk_amount ? parseFloat(formData.risk_amount) : null,
        pnl: formData.pnl ? parseFloat(formData.pnl) : null,
      };

      if (isEditing) {
        await axios.put(`${API}/trades/${id}`, submitData);
        toast.success('Trade updated successfully');
      } else {
        await axios.post(`${API}/trades`, submitData);
        toast.success('Trade added successfully');
      }
      
      navigate('/trades');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save trade');
    } finally {
      setLoading(false);
    }
  };

  const popularPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'GOLD', 'SILVER', 'BTC/USD', 'ETH/USD'
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/trades')}
            className="flex items-center space-x-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Trade' : 'Add New Trade'}
          </h1>
        </div>

        <Card className="glass-effect border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Trade Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="trade-form">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="input-focus"
                    data-testid="trade-date-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pair">Trading Pair *</Label>
                  <div className="relative">
                    <Input
                      id="pair"
                      type="text"
                      placeholder="e.g. EUR/USD"
                      value={formData.pair}
                      onChange={(e) => handleInputChange('pair', e.target.value.toUpperCase())}
                      required
                      className="input-focus"
                      data-testid="trade-pair-input"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Popular: {popularPairs.slice(0, 5).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_type">Trade Type *</Label>
                  <Select 
                    value={formData.trade_type} 
                    onValueChange={(value) => handleInputChange('trade_type', value)}
                    data-testid="trade-type-select"
                  >
                    <SelectTrigger className="input-focus">
                      <SelectValue placeholder="Select trade type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long">Long (Buy)</SelectItem>
                      <SelectItem value="Short">Short (Sell)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entry_price">Entry Price *</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.00001"
                    placeholder="0.00000"
                    value={formData.entry_price}
                    onChange={(e) => handleInputChange('entry_price', e.target.value)}
                    required
                    className="input-focus"
                    data-testid="entry-price-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exit_price">Exit Price</Label>
                  <Input
                    id="exit_price"
                    type="number"
                    step="0.00001"
                    placeholder="0.00000"
                    value={formData.exit_price}
                    onChange={(e) => handleInputChange('exit_price', e.target.value)}
                    className="input-focus"
                    data-testid="exit-price-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    required
                    className="input-focus"
                    data-testid="quantity-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pnl">P&L ($)</Label>
                  <Input
                    id="pnl"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.pnl}
                    onChange={(e) => handleInputChange('pnl', e.target.value)}
                    className="input-focus"
                    data-testid="pnl-input"
                  />
                </div>
              </div>

              {/* Risk Management */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stop_loss">Stop Loss</Label>
                  <Input
                    id="stop_loss"
                    type="number"
                    step="0.00001"
                    placeholder="0.00000"
                    value={formData.stop_loss}
                    onChange={(e) => handleInputChange('stop_loss', e.target.value)}
                    className="input-focus"
                    data-testid="stop-loss-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="take_profit">Take Profit</Label>
                  <Input
                    id="take_profit"
                    type="number"
                    step="0.00001"
                    placeholder="0.00000"
                    value={formData.take_profit}
                    onChange={(e) => handleInputChange('take_profit', e.target.value)}
                    className="input-focus"
                    data-testid="take-profit-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk_amount">Risk Amount ($)</Label>
                  <Input
                    id="risk_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.risk_amount}
                    onChange={(e) => handleInputChange('risk_amount', e.target.value)}
                    className="input-focus"
                    data-testid="risk-amount-input"
                  />
                </div>
              </div>

              {/* Chart Upload */}
              <div className="space-y-4">
                <Label>Chart Screenshot</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50">
                  {formData.chart_image_url ? (
                    <div className="relative" data-testid="uploaded-image-preview">
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}${formData.chart_image_url}`}
                        alt="Trade chart"
                        className="max-w-full max-h-64 rounded-lg mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        data-testid="remove-image-btn"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <label htmlFor="chart-upload" className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </span>
                        <input
                          id="chart-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          data-testid="chart-upload-input"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG up to 5MB
                      </p>
                      {uploadingFile && (
                        <div className="mt-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-1">Uploading...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Trade Notes</Label>
                <Textarea
                  id="comments"
                  placeholder="Add your trade analysis, lessons learned, market conditions, etc."
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  rows={4}
                  className="input-focus resize-none"
                  data-testid="comments-input"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/trades')}
                  data-testid="cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary text-white px-8"
                  disabled={loading}
                  data-testid="submit-trade-btn"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditing ? 'Update Trade' : 'Add Trade'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TradeForm;