"use client";

import { User, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardTabsProps {
  initialRenterTab: boolean;
  initialOwnerTab: boolean;
}

export function DashboardTabs({ initialRenterTab, initialOwnerTab }: DashboardTabsProps) {
  const [showRenter, setShowRenter] = useState(initialRenterTab);
  const [showOwner, setShowOwner] = useState(initialOwnerTab && !initialRenterTab);

  useEffect(() => {
    // Update the visibility of sections based on state
    const renterSection = document.getElementById('renter-section');
    const ownerSection = document.getElementById('owner-section');
    
    if (renterSection) {
      renterSection.classList.toggle('hidden', !showRenter);
    }
    
    if (ownerSection) {
      ownerSection.classList.toggle('hidden', !showOwner);
    }
  }, [showRenter, showOwner]);

  const handleRenterClick = () => {
    setShowRenter(true);
    setShowOwner(false);
  };

  const handleOwnerClick = () => {
    setShowRenter(false);
    setShowOwner(true);
  };

  return (
    <div className="mb-8 border-b border-gray-200">
      <div className="flex space-x-8">
        <button 
          className={`py-4 px-1 border-b-2 font-medium focus:outline-none ${showRenter ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={handleRenterClick}
          id="renter-tab"
        >
          <div className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            <span>Renter Dashboard</span>
          </div>
        </button>
        <button 
          className={`py-4 px-1 border-b-2 font-medium focus:outline-none ${showOwner ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={handleOwnerClick}
          id="owner-tab"
        >
          <div className="flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            <span>Owner Dashboard</span>
          </div>
        </button>
      </div>
    </div>
  );
} 