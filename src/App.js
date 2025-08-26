import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

// Import components
import AuthPage from './components/Authpage';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/Dashboardpage';
import SendMailPage from './components/Sendmail';
import CampaignsPage from './components/Campaignspage';
import EmailStatusPage from './components/Emailstatuspage';

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

const API_BASE_URL = 'https://mailstorm-backend-1.onrender.com';

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
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        currentUser={currentUser} 
        handleLogout={handleLogout} 
      />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

export default MailStormApp;