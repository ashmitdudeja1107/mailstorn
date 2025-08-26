import React, { memo, useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, Eye, Edit, XCircle, Clock, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

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

export default EmailStatusPage;