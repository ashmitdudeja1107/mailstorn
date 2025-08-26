import React, { memo, useState, useCallback, useEffect } from 'react';
import { Mail, CheckCircle, Eye, Plus } from 'lucide-react';
import StatsCard from './Statscard';

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

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
              {campaigns && campaigns.length > 0 ? (
                campaigns.slice(0, 5).map(campaign => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500">{campaign.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No campaigns yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create your first campaign to get started
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Total Campaigns</span>
                </div>
                <span className="font-medium text-gray-900">{campaigns ? campaigns.length : 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Active Campaigns</span>
                </div>
                <span className="font-medium text-gray-900">
                  {campaigns ? campaigns.filter(c => c.status === 'active' || c.status === 'sending').length : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Completed Campaigns</span>
                </div>
                <span className="font-medium text-gray-900">
                  {campaigns ? campaigns.filter(c => c.status === 'completed').length : 0}
                </span>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Performance</span>
                  <span className="text-sm font-medium text-gray-900">{stats.avgOpenRate}% avg open rate</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(stats.avgOpenRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DashboardPage;