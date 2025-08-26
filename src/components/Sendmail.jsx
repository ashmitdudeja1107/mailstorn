import React, { memo } from 'react';
import { Upload, CheckCircle, Send } from 'lucide-react';

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

export default SendMailPage;