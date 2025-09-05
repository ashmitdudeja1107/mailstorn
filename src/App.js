import React, { useState, useEffect, useCallback, memo } from 'react';
import { Mail, Send, BarChart3, Search, Upload, TrendingUp, CheckCircle, AlertCircle, Plus, Eye, Edit, Trash2, Filter, Target, Activity, User, LogOut, EyeOff,XCircle,Clock,RefreshCw,Pause } from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBa93VJg0nCsbl-jciLGgL8TrKyBdc3S5c",
  authDomain: "intern1-ebc8e.firebaseapp.com",
  projectId: "intern1-ebc8e",
  storageBucket: "intern1-ebc8e.appspot.com",
  messagingSenderId: "1018536934697",
  appId: "1:1018536934697:web:147ebe1c7d8d7113238b38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

const AuthPage = ({ onLoginSuccess }) => {
  const [signInLoading, setSignInLoading] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);


  const callSignInAPI = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Sign-in failed');
    }
    
    return data;
  };

  const callSignUpAPI = async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/google-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Sign-up failed');
    }
    
    return data;
  };

  const storeTokenAndSetupAPI = (token) => {
    localStorage.setItem('token', token);
    console.log('✅ Token stored in localStorage:', token);

    const storedToken = localStorage.getItem('token');
    console.log('🔍 Retrieved token from localStorage:', storedToken);

    window.apiClient = {
      get: async (url) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return handleResponse(response);
      },
      post: async (url, data) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      put: async (url, data) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      delete: async (url) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return handleResponse(response);
      }
    };
  };

  const handleResponse = async (response) => {
    const text = await response.text();
    try {
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      console.error('API Error:', text);
      throw new Error(text || 'API request failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const apiResponse = await callSignInAPI(idToken);
      
      if (!apiResponse.token) {
        throw new Error('No token received from backend');
      }
      
      localStorage.setItem('token', apiResponse.token);
      storeTokenAndSetupAPI(apiResponse.token);
      
      const storedToken = localStorage.getItem('token');
      if (!storedToken || storedToken !== apiResponse.token) {
        throw new Error('Failed to store authentication token');
      }
      
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        backendUser: apiResponse.user,
        token: apiResponse.token
      });
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      try {
        await signOut(auth);
        localStorage.removeItem('token');
        window.apiClient = null;
      } catch (signOutError) {
        console.error('Error cleaning up after failed auth:', signOutError);
      }
      
      handleAuthError(error);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSignUpLoading(true);
    setError(null);
    setSuccessMessage(null); 
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const apiResponse = await callSignUpAPI(idToken);
      
      if (!apiResponse?.token || typeof apiResponse.token !== 'string') {
        throw new Error(`Invalid token response: ${JSON.stringify(apiResponse)}`);
      }
      
      if (apiResponse.token) {
        storeTokenAndSetupAPI(apiResponse.token);
      }
      setSuccessMessage('Account created successfully!  now logg in.');
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        backendUser: apiResponse.user,
        token: apiResponse.token
      });
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Error signing out after failed backend auth:', signOutError);
      }
      
      handleAuthError(error);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleAuthError = (error) => {
    let errorMessage = 'Authentication failed';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled by user';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup blocked. Please allow popups for this site';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with this email';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MailStorm
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome! Choose your preferred way to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={signInLoading || signUpLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {signInLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
              onClick={handleGoogleSignUp}
              disabled={signUpLoading || signInLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {signUpLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing up...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = memo(({ currentPage, setCurrentPage, currentUser, handleLogout }) => (
  <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 z-10">
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          MailStorm
        </h1>
      </div>
      <nav className="space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'send', label: 'Send Mail', icon: Send },
          { id: 'campaigns', label: 'Campaigns', icon: Target },
          { id: 'status', label: 'Email Status', icon: Search }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentPage === item.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg' 
                : 'hover:bg-slate-800 hover:translate-x-1'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser?.displayName || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  </div>
));

const StatsCard = memo(({ icon: Icon, title, value, subtitle, color, trend }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {trend && (
        <div className="text-right">
          <div className="flex items-center space-x-1 text-green-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{trend}</span>
          </div>
        </div>
      )}
    </div>
  </div>
));

const DashboardPage = memo(({ currentUser, campaigns, campaignsLoading, onNewCampaign }) => {
  const [stats, setStats] = useState({
    totalRecipients: 0,
    totalDelivered: 0,
    totalOpened: 0,
    avgOpenRate: 0,
    avgDeliveryRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeadersFromUser = useCallback(() => {
    const token = currentUser?.accessToken || localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, [currentUser]);

  // Calculate stats from campaigns data
  const calculateStats = useCallback((campaignsData) => {
    console.log('Calculating stats from campaigns:', campaignsData);
    
    if (!campaignsData || campaignsData.length === 0) {
      return {
        totalRecipients: 0,
        totalDelivered: 0,
        totalOpened: 0,
        avgOpenRate: 0,
        avgDeliveryRate: 0
      };
    }
    
    const totals = campaignsData.reduce((acc, campaign) => {
      const analytics = campaign.analytics || {};
      console.log(`Campaign "${campaign.name}" analytics:`, analytics);
      
      // Try different possible field names for analytics data and convert to numbers
      const recipients = parseInt(analytics.total_recipients || analytics.recipients || analytics.sent_to || 0, 10);
      const delivered = parseInt(analytics.delivered || analytics.sent_count || analytics.delivered_count || 0, 10);
      const opened = parseInt(analytics.opened || analytics.unique_opens || analytics.opens || analytics.open_count || 0, 10);
      
      console.log(`  Recipients: ${recipients}, Delivered: ${delivered}, Opened: ${opened}`);
      
      acc.totalRecipients += recipients;
      acc.totalDelivered += delivered;
      acc.totalOpened += opened;
      
      return acc;
    }, {
      totalRecipients: 0,
      totalDelivered: 0,
      totalOpened: 0
    });

    console.log('Raw totals:', totals);

    // Calculate average rates
    const avgOpenRate = totals.totalDelivered > 0 
      ? Math.round((totals.totalOpened / totals.totalDelivered) * 100) 
      : 0;
    
    const avgDeliveryRate = totals.totalRecipients > 0 
      ? Math.round((totals.totalDelivered / totals.totalRecipients) * 100) 
      : 0;

    const finalStats = {
      totalRecipients: totals.totalRecipients,
      totalDelivered: totals.totalDelivered,
      totalOpened: totals.totalOpened,
      avgOpenRate,
      avgDeliveryRate
    };

    console.log('Final calculated stats:', finalStats);
    return finalStats;
  }, []);

  // Fetch stats from your campaigns API
  const fetchStats = useCallback(async () => {
    // Don't fetch if user is not authenticated
    if (!currentUser) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/`, {
        method: 'GET',
        headers: getAuthHeadersFromUser(),
        credentials: 'include'
      });
      
      console.log('API Response Status:', response.status);
      
      if (response.status === 401) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('API Response Data:', result);
        
        if (result.success && result.data) {
          console.log('Campaigns data:', result.data);
          
          // Use the improved stats calculation
          const calculatedStats = calculateStats(result.data);
          setStats(calculatedStats);
        } else {
          console.log('API response structure issue:', result);
          setError('Invalid response format from server');
        }
      } else {
        console.log('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        setError(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Network error: Unable to fetch campaign statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser, getAuthHeadersFromUser, calculateStats]);

  // Main effect to handle stats calculation/fetching
  useEffect(() => {
    if (!currentUser) {
      setStats({
        totalRecipients: 0,
        totalDelivered: 0,
        totalOpened: 0,
        avgOpenRate: 0,
        avgDeliveryRate: 0
      });
      setStatsLoading(false);
      return;
    }

    // If campaigns are still loading, show loading state
    if (campaignsLoading) {
      setStatsLoading(true);
      return;
    }

    // If we have campaigns data, calculate stats from it
    if (campaigns && campaigns.length > 0) {
      console.log('Using campaigns prop for stats calculation');
      const calculatedStats = calculateStats(campaigns);
      setStats(calculatedStats);
      setStatsLoading(false);
    } 
    // If no campaigns data available, fetch from API
    else if (campaigns && campaigns.length === 0) {
      // We have campaigns data but it's empty, so stats should be 0
      setStats({
        totalRecipients: 0,
        totalDelivered: 0,
        totalOpened: 0,
        avgOpenRate: 0,
        avgDeliveryRate: 0
      });
      setStatsLoading(false);
    }
    // If campaigns is null/undefined, fetch from API
    else {
      fetchStats();
    }
  }, [currentUser, campaigns, campaignsLoading, calculateStats, fetchStats]);

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Welcome back, {currentUser?.displayName || 'User'}!</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={fetchStats}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome back, {currentUser?.displayName || 'User'}! Here's your email campaign overview.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onNewCampaign}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            New Campaign
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          // Loading skeleton for stats cards
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))
        ) : (
          <>
            <StatsCard
              icon={Mail}
              title="Total Recipients"
              value={stats.totalRecipients.toLocaleString()}
              subtitle="Across all campaigns"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
             
            />
            <StatsCard
              icon={CheckCircle}
              title="Delivered"
              value={stats.totalDelivered.toLocaleString()}
              subtitle={`${stats.avgDeliveryRate}% delivery rate`}
              color="bg-gradient-to-br from-green-500 to-green-600"
             
            />
            <StatsCard
              icon={Eye}
              title="Opened"
              value={stats.totalOpened.toLocaleString()}
              subtitle={`${stats.avgOpenRate}% open rate`}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
             
            />
          </>
        )}
      </div>
      
      {campaignsLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
            <div className="space-y-3">
              {campaigns.slice(0, 5).map(campaign => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                   
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
const SendMailPage = memo(({ emailData, setEmailData, csvFile, handleCSVUpload, handleSendMail }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Send Mail</h2>
      <p className="text-gray-600 mt-1">Create and send your email campaign to multiple recipients.</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
              <input
                key="campaignName"
                type="text"
                value={emailData.campaignName}
                onChange={(e) => setEmailData(prev => ({ ...prev, campaignName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter campaign name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
              <input
                key="subject"
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter email subject..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
              <textarea
                key="body"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Write your email content here..."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Recipients</h3>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors duration-200">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drop your CSV file here or</p>
              <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                Browse Files
                <input
                  key="csvUpload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>
            {csvFile && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">{csvFile.name}</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  {emailData.recipients.length} recipients loaded
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Campaign:</span>
              <span className="font-medium text-right">
                {emailData.campaignName ? emailData.campaignName.substring(0, 20) + (emailData.campaignName.length > 20 ? '...' : '') : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recipients:</span>
              <span className="font-medium">{emailData.recipients.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subject:</span>
              <span className="font-medium text-right">
                {emailData.subject ? emailData.subject.substring(0, 20) + '...' : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-yellow-600">Draft</span>
            </div>
          </div>
          <button
            onClick={handleSendMail}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Send Campaign</span>
          </button>
        </div>
      </div>
    </div>
  </div>
));

const CampaignsPage = memo(({ campaigns, campaignsLoading, onCampaignUpdate, onNewCampaign }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const handlePauseCampaign = async (campaignId) => {
    setLoadingStates(prev => ({ ...prev, [`pause_${campaignId}`]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the campaign status in the parent component
        onCampaignUpdate && onCampaignUpdate(campaignId, 'paused');
        alert('Campaign paused successfully');
      } else {
        alert(data.message || 'Failed to pause campaign');
      }
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert('Failed to pause campaign');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`pause_${campaignId}`]: false }));
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`delete_${campaignId}`]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the campaign from the parent component
        onCampaignUpdate && onCampaignUpdate(campaignId, 'deleted');
        alert('Campaign deleted successfully');
      } else {
        alert(data.message || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete_${campaignId}`]: false }));
    }
  };

  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Campaigns</h2>
        <p className="text-gray-600 mt-1">Manage and track all your email campaigns.</p>
      </div>
      <div className="flex items-center space-x-3">
        
        <button 
          onClick={onNewCampaign}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          New Campaign
        </button>
      </div>
    </div>
    
    {campaignsLoading ? (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map(campaign => (
                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.subject}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{campaign.recipients.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{campaign.sent.toLocaleString()} sent</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{campaign.openRate}%</div>
                        <div className="text-xs text-gray-500">Open</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{campaign.clickRate}%</div>
                        <div className="text-xs text-gray-500">Click</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(campaign.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePauseCampaign(campaign.id)}
                        disabled={loadingStates[`pause_${campaign.id}`] || campaign.status === 'paused'}
                        className={`transition-colors duration-200 ${
                          campaign.status === 'paused' 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-orange-600 hover:text-orange-800'
                        }`}
                      >
                        {loadingStates[`pause_${campaign.id}`] ? (
                          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        disabled={loadingStates[`delete_${campaign.id}`]}
                        className="text-red-600 hover:text-red-800 transition-colors duration-200 disabled:text-gray-400"
                      >
                        {loadingStates[`delete_${campaign.id}`] ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
  );
});

const EmailStatusPage = memo(({ searchQuery, setSearchQuery }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEmails, setFilteredEmails] = useState([]);

  // Fetch campaigns data (including drafts)
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/campaigns/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const result = await response.json();
        if (result.success) {
          setCampaigns(result.data);
          processEmailsForDisplay(result.data);
        } else {
          setError(result.message || 'Failed to fetch campaigns');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Process campaigns data to create a flat list of emails with their individual statuses
  const processEmailsForDisplay = (campaignsData) => {
    const emailList = [];
    
    campaignsData.forEach(campaign => {
      // Handle campaigns with participants
      if (campaign.participants && campaign.participants.length > 0) {
        campaign.participants.forEach(participant => {
          emailList.push({
            email: participant.email,
            campaign: campaign.name,
            status: participant.status,
            campaignId: campaign.id,
            recipientId: participant.recipient_id,
            created_at: campaign.created_at,
            campaignStatus: campaign.status,
            // Use recipient-level analytics instead of campaign-level
            totalOpens: participant.opens || 0,  // Individual recipient opens
            hasOpened: participant.has_opened || false,
            lastOpenedAt: participant.last_opened_at,
            // Keep campaign-level analytics for reference
            campaignTotalOpens: campaign.analytics?.total_opens || 0,
            campaignUniqueOpens: campaign.analytics?.unique_opens || 0,
            campaignOpenRate: campaign.analytics?.open_rate || 0,
            isDraft: campaign.status === 'draft'
          });
        });
      } else {
        // Handle draft campaigns without participants (show campaign itself)
        if (campaign.status === 'draft') {
          emailList.push({
            email: 'No participants yet',
            campaign: campaign.name,
            status: 'draft',
            campaignId: campaign.id,
            recipientId: null,
            created_at: campaign.created_at,
            campaignStatus: campaign.status,
            totalOpens: 0,
            hasOpened: false,
            lastOpenedAt: null,
            campaignTotalOpens: 0,
            campaignUniqueOpens: 0,
            campaignOpenRate: 0,
            isDraft: true,
            isEmptyDraft: true
          });
        }
      }
    });

    // Sort by most recent first
    emailList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredEmails(emailList);
  };

  // Filter emails based on search query (including drafts)
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, show all emails from all campaigns including drafts
      processEmailsForDisplay(campaigns);
      return;
    }

    const filtered = [];
    campaigns.forEach(campaign => {
      // Handle campaigns with participants
      if (campaign.participants && campaign.participants.length > 0) {
        campaign.participants.forEach(participant => {
          const matchesEmail = participant.email.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCampaign = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = participant.status.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCampaignStatus = campaign.status.toLowerCase().includes(searchQuery.toLowerCase());
          
          if (matchesEmail || matchesCampaign || matchesStatus || matchesCampaignStatus) {
            filtered.push({
              email: participant.email,
              campaign: campaign.name,
              status: participant.status,
              campaignId: campaign.id,
              recipientId: participant.recipient_id,
              created_at: campaign.created_at,
              campaignStatus: campaign.status,
              // Use recipient-level analytics
              totalOpens: participant.opens || 0,
              hasOpened: participant.has_opened || false,
              lastOpenedAt: participant.last_opened_at,
              campaignTotalOpens: campaign.analytics?.total_opens || 0,
              campaignUniqueOpens: campaign.analytics?.unique_opens || 0,
              campaignOpenRate: campaign.analytics?.open_rate || 0,
              isDraft: campaign.status === 'draft'
            });
          }
        });
      } else {
        // Handle draft campaigns without participants
        if (campaign.status === 'draft') {
          const matchesCampaign = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = 'draft'.includes(searchQuery.toLowerCase());
          
          if (matchesCampaign || matchesStatus) {
            filtered.push({
              email: 'No participants yet',
              campaign: campaign.name,
              status: 'draft',
              campaignId: campaign.id,
              recipientId: null,
              created_at: campaign.created_at,
              campaignStatus: campaign.status,
              totalOpens: 0,
              hasOpened: false,
              lastOpenedAt: null,
              campaignTotalOpens: 0,
              campaignUniqueOpens: 0,
              campaignOpenRate: 0,
              isDraft: true,
              isEmptyDraft: true
            });
          }
        }
      }
    });

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredEmails(filtered);
  }, [searchQuery, campaigns]);

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'delivered':
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: CheckCircle
        };
      case 'opened':
        return {
          color: 'bg-blue-500',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: Eye
        };
      case 'clicked':
        return {
          color: 'bg-purple-500',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          icon: Eye
        };
      case 'draft':
        return {
          color: 'bg-orange-500',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          icon: Edit
        };
      case 'failed':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: XCircle
        };
      case 'pending':
        return {
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: Clock
        };
      default:
        return {
          color: 'bg-gray-500',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: AlertCircle
        };
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Less than 1 hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  // Handle search
  const handleSearch = () => {
    // Search is handled by useEffect, but you can add additional logic here if needed
    console.log('Searching for:', searchQuery);
  };

  // Refresh data
  const handleRefresh = () => {
    window.location.reload(); // Simple refresh, you can make this more sophisticated
  };

  // Calculate statistics including drafts
  const getStatistics = () => {
    const totalCampaigns = campaigns.length;
    const draftCampaigns = campaigns.filter(campaign => campaign.status === 'draft').length;
    const activeCampaigns = totalCampaigns - draftCampaigns;
    
    const totalRecipients = campaigns.reduce((sum, campaign) => {
      const participantCount = campaign.participants && Array.isArray(campaign.participants) 
        ? campaign.participants.length 
        : 0;
      return sum + participantCount;
    }, 0);
    
    // Use campaign-level total opens for overall statistics
    const totalOpens = campaigns.reduce((sum, campaign) => sum + (campaign.analytics?.total_opens || 0), 0);
    
    return {
      totalCampaigns,
      draftCampaigns,
      activeCampaigns,
      totalRecipients,
      totalOpens
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Email Status</h2>
          <p className="text-gray-600 mt-1">Search and track individual email delivery status including drafts.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-gray-600">Loading email status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Email Status</h2>
          <p className="text-gray-600 mt-1">Search and track individual email delivery status including drafts.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-center py-8">
            <XCircle className="w-6 h-6 text-red-500 mr-2" />
            <span className="text-red-600">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Email Status</h2>
        <p className="text-gray-600 mt-1">Search and track individual email delivery status including drafts.</p>
      </div>
      
      {/* Search Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                key="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Search by email address, campaign name, or status (including drafts)..."
              />
            </div>
          </div>
          <button 
            onClick={handleSearch}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Search
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Campaign Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-600 font-medium">Total Campaigns</p>
            <p className="text-2xl font-bold text-blue-900">{stats.totalCampaigns}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl">
            <p className="text-sm text-orange-600 font-medium">Draft Campaigns</p>
            <p className="text-2xl font-bold text-orange-900">{stats.draftCampaigns}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <p className="text-sm text-green-600 font-medium">Active Campaigns</p>
            <p className="text-2xl font-bold text-green-900">{stats.activeCampaigns}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <p className="text-sm text-purple-600 font-medium">Total Recipients</p>
            <p className="text-2xl font-bold text-purple-900">{stats.totalRecipients}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm text-indigo-600 font-medium">Total Opens</p>
            <p className="text-2xl font-bold text-indigo-900">{stats.totalOpens}</p>
          </div>
        </div>
      </div>

      {/* Recent Email Activity (Including Drafts) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Email Activity</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {filteredEmails.length} result{filteredEmails.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Individual Tracking
            </span>
          </div>
        </div>
        
        {filteredEmails.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No email activity found</p>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmails.map((item, index) => {
              const statusInfo = getStatusInfo(item.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={index} className={`flex items-center justify-between p-4 rounded-xl transition-colors duration-200 ${
                  item.isDraft ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium ${item.isEmptyDraft ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                          {item.email}
                        </p>
                        {item.isDraft && (
                          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                            DRAFT
                          </span>
                        )}
                        {item.hasOpened && !item.isDraft && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            OPENED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{item.campaign}</p>
                      {item.isEmptyDraft && (
                        <p className="text-xs text-gray-400">No participants added yet</p>
                      )}
                      {item.lastOpenedAt && (
                        <p className="text-xs text-blue-600">Last opened: {formatTimeAgo(item.lastOpenedAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {item.status}
                      </span>
                      {item.totalOpens > 0 && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-600">{item.totalOpens}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{formatTimeAgo(item.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
const MailStormApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [csvFile, setCsvFile] = useState(null);
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    recipients: [],
    campaignName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [isNewCampaignCreated, setIsNewCampaignCreated] = useState(false);
  const [newCampaignId, setNewCampaignId] = useState(null);

  // REMOVED: Static stats object - let DashboardPage calculate its own stats

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If token exists, assume user is authenticated
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          accessToken: user.accessToken // Add access token if available
        });
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token'); // Clean up token if user is not authenticated
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/api/campaigns/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        // If token is expired or invalid, logout user
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const formattedCampaigns = data.data.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        recipients: parseInt(campaign.analytics?.total_recipients || '0'),
        sent: parseInt(campaign.analytics?.sent_count || '0'),
        opened: parseInt(campaign.analytics?.unique_opens || '0'),
        clicked: parseInt(campaign.analytics?.click_count || '0'),
        status: campaign.status,
        date: new Date(campaign.created_at).toISOString().split('T')[0],
        openRate: parseFloat(campaign.analytics?.open_rate || '0'),
        clickRate: parseFloat(campaign.analytics?.click_rate || '0'),
        participants: campaign.participants || [],
        // Include the full analytics object for stats calculation
        analytics: campaign.analytics
      }));

      setCampaigns(formattedCampaigns);
      
      if (newCampaignId) {
        const newCampaign = data.data.find(c => c.id === newCampaignId);
        if (newCampaign && parseInt(newCampaign.analytics?.sent_count || '0') > 0) {
          setIsNewCampaignCreated(false);
          setNewCampaignId(null);
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      if (error.message !== 'No authentication token found') {
        alert('Failed to load campaigns: ' + error.message);
      }
    } finally {
      setCampaignsLoading(false);
    }
  }, [newCampaignId]);

  // Fetch campaigns when authentication is established
  useEffect(() => {
    if (isAuthenticated && authInitialized) {
      fetchCampaigns();
    }
  }, [isAuthenticated, authInitialized, fetchCampaigns]);

  const handleLoginSuccess = useCallback((userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const handleCSVUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target.result;
        const recipients = [];
        
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        if (!headers.includes('email')) {
          throw new Error('CSV file must contain an "email" column');
        }

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',');
          const emailIndex = headers.indexOf('email');
          const nameIndex = headers.includes('name') ? headers.indexOf('name') : -1;
          
          const email = values[emailIndex]?.trim();
          if (email) {
            recipients.push({
              email,
              name: nameIndex >= 0 ? values[nameIndex]?.trim() : ''
            });
          }
        }

        if (recipients.length === 0) {
          throw new Error('No valid recipients found in CSV file');
        }

        setEmailData(prev => ({ ...prev, recipients }));
        setCsvFile(file);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert(error.message);
        e.target.value = '';
      }
    };

    reader.readAsText(file);
  }, []);

  useEffect(() => {
    if (isNewCampaignCreated) {
      fetchCampaigns();
      
      const interval = setInterval(fetchCampaigns, 2000);
      
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsNewCampaignCreated(false);
        setNewCampaignId(null);
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isNewCampaignCreated, fetchCampaigns]);

  const handleSendMail = useCallback(async () => {
    if (!emailData.campaignName || !emailData.subject || !emailData.body || emailData.recipients.length === 0) {
      alert('Please fill in all fields and upload recipients');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', emailData.campaignName);
      formData.append('subject', emailData.subject);
      formData.append('body', emailData.body);
      
      if (csvFile) {
        formData.append('recipients', csvFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/campaigns/send-campaign`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // If token is expired or invalid, logout user
        if (response.status === 401) {
          handleLogout();
          return;
        }
        
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to send campaign');
        } catch {
          throw new Error(errorText || 'Failed to send campaign');
        }
      }

      const data = await response.json();

      setNewCampaignId(data.data.campaignId);
      setIsNewCampaignCreated(true);

      setEmailData({ subject: '', body: '', recipients: [], campaignName: '' });
      setCsvFile(null);
      
      alert('Campaign started successfully!');
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert(error.message || 'Failed to send campaign');
    }
  }, [emailData, campaigns, csvFile, handleLogout]);

  // New handler for navigation to Send Mail page
  const handleNewCampaign = useCallback(() => {
    setCurrentPage('send');
    // Reset form when navigating to send page
    setEmailData({
      subject: '',
      body: '',
      recipients: [],
      campaignName: ''
    });
    setCsvFile(null);
  }, []);

  const renderCurrentPage = useCallback(() => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage 
                 currentUser={currentUser} 
                 campaigns={campaigns} 
                 campaignsLoading={campaignsLoading} 
                 onNewCampaign={handleNewCampaign}
               />;
      case 'send':
        return <SendMailPage 
                 emailData={emailData} 
                 setEmailData={setEmailData} 
                 csvFile={csvFile} 
                 handleCSVUpload={handleCSVUpload} 
                 handleSendMail={handleSendMail} 
               />;
      case 'campaigns':
        return <CampaignsPage 
                 campaigns={campaigns} 
                 campaignsLoading={campaignsLoading} 
                 onNewCampaign={handleNewCampaign}
               />;
      case 'status':
        return <EmailStatusPage 
                 searchQuery={searchQuery} 
                 setSearchQuery={setSearchQuery} 
               />;
      default:
        return <DashboardPage 
                 currentUser={currentUser} 
                 campaigns={campaigns} 
                 campaignsLoading={campaignsLoading} 
                 onNewCampaign={handleNewCampaign}
               />;
    }
  }, [currentPage, currentUser, campaigns, campaignsLoading, emailData, csvFile, handleCSVUpload, handleSendMail, searchQuery, handleNewCampaign]);

  // Show loading until auth is initialized
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show auth page if user is definitely not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} handleLogout={handleLogout} />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

export default MailStormApp;