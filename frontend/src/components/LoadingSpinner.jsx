import React from 'react';

export default function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 fade-in-up">
      <div className={`relative ${sizeClasses[size]} spinner-enhanced`}>
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Inner ring */}
        <div className={`absolute top-1 left-1 ${sizeClasses[size]} border-4 border-gray-100 rounded-full`}>
          <div className="w-full h-full border-4 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full pulse-glow"></div>
      </div>
      
      <p className="mt-4 text-gray-600 font-medium animate-pulse loading-dots">{text}</p>
    </div>
  );
}
