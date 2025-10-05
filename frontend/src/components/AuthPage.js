import React, { useState, useContext } from 'react';
import { AuthContext, API } from '../App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from 'axios';
import { TrendingUp, BarChart3, Shield, Users } from 'lucide-react';

const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', full_name: '', balance '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      login(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, {
      full_name: registerData.full_name,
      email: registerData.email,
      password: registerData.password,
      balance: registerData.balance,
      });

      login(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Hero Section */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              Master Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600"> Trading Journey</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Track, analyze, and improve your trading performance with our comprehensive journal platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-full bg-emerald-100">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Track P&L</h3>
                <p className="text-sm text-gray-600">Monitor your profits and losses</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-full bg-blue-100">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">Detailed trading statistics</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-full bg-purple-100">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure</h3>
                <p className="text-sm text-gray-600">Your data is protected</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20">
              <div className="p-3 rounded-full bg-orange-100">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Personal</h3>
                <p className="text-sm text-gray-600">Individual trading journals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full max-w-md mx-auto animate-scale-in">
          <Card className="glass-effect shadow-2xl border-0">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900">Welcome</CardTitle>
              <CardDescription className="text-gray-600">
                Access your trading journal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        className="input-focus"
                        data-testid="login-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        className="input-focus"
                        data-testid="login-password-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-primary text-white font-medium py-3"
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={registerData.full_name}
                        onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                        required
                        className="input-focus"
                        data-testid="register-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        className="input-focus"
                        data-testid="register-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        className="input-focus"
                        data-testid="register-password-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-balance">Starting Balance</Label>
                      <Input
                        id="register-balance"
                        type="number"
                        placeholder="Enter your starting balance"
                        value={registerData.balance}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, balance: e.target.value })
                        }
                        required
                        className="input-focus"
                        data-testid="register-balance-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-primary text-white font-medium py-3"
                      disabled={loading}
                      data-testid="register-submit-btn"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
