// api.js or similar service file
import axios from 'axios';

export const sendCampaign = async (formData) => {
  const { campaignName, subject, body, csvFile } = formData;
  
  const data = new FormData();
  data.append('name', campaignName);
  data.append('subject', subject);
  data.append('body', body);
  data.append('recipients', csvFile); // This will be the CSV file

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('token')}` // or your auth token
    }
  };

  return await axios.post('/api/send-campaign', data, config);
};