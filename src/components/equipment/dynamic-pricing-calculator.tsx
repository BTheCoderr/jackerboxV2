"use client";

import { useState, useEffect } from "react";
import { Calendar, DollarSign, TrendingUp, Info } from "lucide-react";

interface DynamicPricingCalculatorProps {
  baseHourlyRate: number;
  baseDailyRate: number;
  baseWeeklyRate: number;
  equipmentId: string;
  onPriceChange?: (prices: {
    hourlyRate: number;
    dailyRate: number;
    weeklyRate: number;
    demandFactor: number;
  }) => void;
}

export function DynamicPricingCalculator({
  baseHourlyRate,
  baseDailyRate,
  baseWeeklyRate,
  equipmentId,
  onPriceChange,
}: DynamicPricingCalculatorProps) {
  const [demandFactor, setDemandFactor] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Calculate dynamic prices
  const hourlyRate = Math.round(baseHourlyRate * demandFactor * 100) / 100;
  const dailyRate = Math.round(baseDailyRate * demandFactor * 100) / 100;
  const weeklyRate = Math.round(baseWeeklyRate * demandFactor * 100) / 100;
  
  useEffect(() => {
    fetchDemandData();
  }, [equipmentId]);
  
  useEffect(() => {
    if (onPriceChange) {
      onPriceChange({
        hourlyRate,
        dailyRate,
        weeklyRate,
        demandFactor,
      });
    }
  }, [demandFactor, hourlyRate, dailyRate, weeklyRate, onPriceChange]);
  
  const fetchDemandData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch actual demand data
      // For now, we'll simulate it with a random factor between 0.8 and 1.5
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate demand factor based on:
      // 1. Current season (higher in summer for outdoor equipment)
      // 2. Day of week (higher on weekends)
      // 3. Recent rental history
      // 4. Similar equipment availability
      
      const currentDate = new Date();
      const month = currentDate.getMonth(); // 0-11
      const dayOfWeek = currentDate.getDay(); // 0-6, 0 is Sunday
      
      // Seasonal factor (higher in summer months 5-8)
      const seasonalFactor = month >= 5 && month <= 8 ? 1.2 : 1.0;
      
      // Weekend factor (higher on Friday, Saturday, Sunday)
      const weekendFactor = dayOfWeek >= 5 || dayOfWeek === 0 ? 1.15 : 1.0;
      
      // Random factor to simulate other variables (0.9 to 1.1)
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      // Combine factors
      const calculatedFactor = seasonalFactor * weekendFactor * randomFactor;
      
      // Limit the range to 0.8 - 1.5
      const limitedFactor = Math.max(0.8, Math.min(1.5, calculatedFactor));
      
      // Round to 2 decimal places
      const roundedFactor = Math.round(limitedFactor * 100) / 100;
      
      setDemandFactor(roundedFactor);
    } catch (error) {
      console.error("Error fetching demand data:", error);
      setError("Failed to calculate dynamic pricing. Using base rates.");
      setDemandFactor(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-900">Dynamic Pricing</h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Information about dynamic pricing"
        >
          <Info size={18} />
        </button>
      </div>
      
      {showInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md">
          <p>
            <strong>Dynamic pricing</strong> adjusts rates based on current demand, 
            seasonality, and availability. Prices may be higher during peak times 
            and lower during off-peak periods.
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <TrendingUp className="text-blue-500 mr-2" size={20} />
        <div>
          <span className="text-sm text-gray-600">Demand Factor:</span>
          <span className="ml-2 font-medium">
            {isLoading ? (
              <span className="inline-block w-12 h-4 bg-gray-200 animate-pulse rounded"></span>
            ) : (
              <span className={`${demandFactor > 1.1 ? 'text-red-600' : demandFactor < 0.9 ? 'text-green-600' : 'text-gray-900'}`}>
                {demandFactor.toFixed(2)}x
              </span>
            )}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <DollarSign className="text-gray-400 mr-1" size={16} />
            <span className="text-sm text-gray-600">Hourly Rate</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 line-through text-sm mr-2">
              ${baseHourlyRate.toFixed(2)}
            </span>
            <span className="font-medium">
              ${hourlyRate.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="text-gray-400 mr-1" size={16} />
            <span className="text-sm text-gray-600">Daily Rate</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 line-through text-sm mr-2">
              ${baseDailyRate.toFixed(2)}
            </span>
            <span className="font-medium">
              ${dailyRate.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="text-gray-400 mr-1" size={16} />
            <span className="text-sm text-gray-600">Weekly Rate</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 line-through text-sm mr-2">
              ${baseWeeklyRate.toFixed(2)}
            </span>
            <span className="font-medium">
              ${weeklyRate.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={fetchDemandData}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "Calculating..." : "Refresh Pricing"}
        </button>
      </div>
    </div>
  );
} 