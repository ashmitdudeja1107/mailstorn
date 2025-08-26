import React, { memo } from 'react';
import { Mail, BarChart3, Send, Target, Search, User, LogOut } from 'lucide-react';

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

export default Sidebar;