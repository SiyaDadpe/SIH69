import React, { useState } from 'react';
import { Search, Settings, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const Header = () => {
  const { sidebarOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 z-40 h-16 bg-white border-b border-gray-200 transition-all duration-300 ease-out flex items-center justify-between px-4 sm:px-6",
        sidebarOpen ? "left-[260px]" : "left-16"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 bg-[#BA7967] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CR</span>
          </div>
          {/* Logo Text - Hide on small screens */}
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-[#BA7967]">CircularityRP</h1>
            <p className="text-xs text-gray-500 -mt-1">Resource Platform</p>
          </div>
        </div>
      </div>

      {/* Search Bar and Actions */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end max-w-2xl">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BA7967]/20 focus:border-[#BA7967] transition-colors text-sm"
            />
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-[#BA7967]/10 text-gray-600 hover:text-[#BA7967]"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-[#BA7967]/10 text-gray-600 hover:text-[#BA7967]"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* Profile/User */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-[#BA7967]/10 text-gray-600 hover:text-[#BA7967]"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;