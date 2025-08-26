import React, { memo } from 'react';
import { TrendingUp } from 'lucide-react';

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

export default StatsCard;