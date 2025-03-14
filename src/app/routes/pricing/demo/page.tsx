'use client';

import { useState } from 'react';
import { DynamicPricingCalculator } from '@/components/equipment/dynamic-pricing-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DynamicPricingDemoPage() {
  const [baseHourlyRate, setBaseHourlyRate] = useState(25);
  const [baseDailyRate, setBaseDailyRate] = useState(150);
  const [baseWeeklyRate, setBaseWeeklyRate] = useState(750);
  const [dynamicPrices, setDynamicPrices] = useState({
    hourlyRate: baseHourlyRate,
    dailyRate: baseDailyRate,
    weeklyRate: baseWeeklyRate,
    demandFactor: 1
  });

  const handlePriceChange = (prices: {
    hourlyRate: number;
    dailyRate: number;
    weeklyRate: number;
    demandFactor: number;
  }) => {
    setDynamicPrices(prices);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dynamic Pricing System Demo</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Pricing Features</CardTitle>
              <CardDescription>
                Automatically adjust rental rates based on market demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Seasonal demand adjustments (higher in summer for outdoor equipment)</li>
                <li>Day-of-week pricing (higher on weekends)</li>
                <li>Real-time market demand analysis</li>
                <li>Transparent pricing display for renters</li>
                <li>Maximize revenue during peak periods</li>
                <li>Increase bookings during off-peak times with competitive rates</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Base Rate Configuration</CardTitle>
              <CardDescription>
                Adjust the base rates to see how dynamic pricing affects them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hourly-rate">Hourly Rate (${baseHourlyRate})</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="hourly-rate"
                      min={5}
                      max={100}
                      step={1}
                      value={[baseHourlyRate]}
                      onValueChange={(value) => setBaseHourlyRate(value[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={baseHourlyRate}
                      onChange={(e) => setBaseHourlyRate(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="daily-rate">Daily Rate (${baseDailyRate})</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="daily-rate"
                      min={50}
                      max={500}
                      step={5}
                      value={[baseDailyRate]}
                      onValueChange={(value) => setBaseDailyRate(value[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={baseDailyRate}
                      onChange={(e) => setBaseDailyRate(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="weekly-rate">Weekly Rate (${baseWeeklyRate})</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="weekly-rate"
                      min={200}
                      max={2000}
                      step={50}
                      value={[baseWeeklyRate]}
                      onValueChange={(value) => setBaseWeeklyRate(value[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={baseWeeklyRate}
                      onChange={(e) => setBaseWeeklyRate(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Current Dynamic Prices</CardTitle>
              <CardDescription>
                Calculated prices based on demand factor: {dynamicPrices.demandFactor.toFixed(2)}x
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hourly Rate:</span>
                  <span className="font-medium">${dynamicPrices.hourlyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Rate:</span>
                  <span className="font-medium">${dynamicPrices.dailyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Rate:</span>
                  <span className="font-medium">${dynamicPrices.weeklyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price Adjustment:</span>
                  <span className={`font-medium ${
                    dynamicPrices.demandFactor > 1 
                      ? 'text-red-600' 
                      : dynamicPrices.demandFactor < 1 
                        ? 'text-green-600' 
                        : ''
                  }`}>
                    {((dynamicPrices.demandFactor - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Dynamic Pricing Calculator</h2>
          <p className="text-gray-600 mb-6">
            This calculator simulates how our dynamic pricing system adjusts rates based on 
            current demand, seasonality, and day of the week. Click "Refresh Pricing" to 
            generate a new demand factor.
          </p>
          
          <DynamicPricingCalculator
            baseHourlyRate={baseHourlyRate}
            baseDailyRate={baseDailyRate}
            baseWeeklyRate={baseWeeklyRate}
            equipmentId="demo-equipment-123"
            onPriceChange={handlePriceChange}
          />
          
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">How It Works</h3>
            <p className="text-sm text-yellow-700">
              Our dynamic pricing algorithm analyzes multiple factors to determine the optimal 
              rental rate at any given time:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-yellow-700">
              <li>Seasonal trends (summer vs. winter)</li>
              <li>Day of week patterns (weekday vs. weekend)</li>
              <li>Local events and holidays</li>
              <li>Current inventory availability</li>
              <li>Historical rental data</li>
            </ul>
            <p className="text-sm text-yellow-700 mt-2">
              This helps equipment owners maximize revenue while offering competitive rates 
              during periods of lower demand.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 