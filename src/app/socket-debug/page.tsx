"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SocketDebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to add a log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Function to check socket server status
  const checkStatus = async () => {
    try {
      addLog('Checking socket server status...');
      const response = await fetch('/api/socket-debug/status');
      const data = await response.json();
      setStatus(data);
      addLog(`Status received: ${JSON.stringify(data)}`);
    } catch (error: any) {
      addLog(`Error checking status: ${error.message}`);
    }
  };

  // Function to initialize the socket server
  const initializeServer = async () => {
    try {
      setIsLoading(true);
      addLog('Initializing socket server...');
      const response = await fetch('/api/socket-debug/initialize', { method: 'POST' });
      const data = await response.json();
      addLog(`Initialization result: ${JSON.stringify(data)}`);
      await checkStatus();
    } catch (error: any) {
      addLog(`Error initializing server: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to restart the socket server
  const restartServer = async () => {
    try {
      setIsLoading(true);
      addLog('Restarting socket server...');
      const response = await fetch('/api/socket-debug/restart', { method: 'POST' });
      const data = await response.json();
      addLog(`Restart result: ${JSON.stringify(data)}`);
      await checkStatus();
    } catch (error: any) {
      addLog(`Error restarting server: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Check status on initial load
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Socket Server Debug</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Server Status</h2>
        <div className="bg-gray-100 p-4 rounded">
          {status ? (
            <div>
              <div className="flex items-center mb-2">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${
                    status.initialized ? 'bg-green-500' : 
                    status.initializing ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                />
                <span className="font-medium">
                  {status.initialized ? 'Initialized' : 
                   status.initializing ? 'Initializing' : 
                   'Not Initialized'}
                </span>
              </div>
              <p><span className="font-medium">Port:</span> {status.port || 'Not set'}</p>
              {status.error && (
                <p className="text-red-600 mt-2"><span className="font-medium">Error:</span> {status.error}</p>
              )}
            </div>
          ) : (
            <p>Loading status...</p>
          )}
        </div>
      </div>
      
      <div className="mb-6 flex space-x-4">
        <button
          onClick={checkStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh Status
        </button>
        
        <button
          onClick={initializeServer}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? 'Working...' : 'Initialize Server'}
        </button>
        
        <button
          onClick={restartServer}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded disabled:bg-gray-300"
        >
          {isLoading ? 'Working...' : 'Restart Server'}
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Debug Log</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4">
        <Link href="/socket-test" className="text-blue-500 hover:underline">
          Go to Socket Test
        </Link>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 