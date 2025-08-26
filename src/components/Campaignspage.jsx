import React, { memo, useState } from 'react';
import { Plus, Pause, Trash2 } from 'lucide-react';

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

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

export default CampaignsPage;