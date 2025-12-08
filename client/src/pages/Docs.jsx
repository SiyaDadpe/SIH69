import React from 'react';
import floatingChatbot from '../components/FloatingChatbot';

export default function Docs() {
  return (
    <div className="min-h-screen bg-[#F3F2EC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-lg text-gray-600">
            Welcome to the documentation page
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            This is the Docs Page
          </h2>
          <p className="text-gray-600">
            Documentation content will be added here.
          </p>
        </div>
      </div>
      <FloatingChatbot />
    </div>
  );
}
