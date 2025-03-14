"use client";

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

export default function SocketTestPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');

  // Function to add a log message
  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Function to connect to the socket server
  const connectSocket = () => {
    try {
      addMessage('Attempting to connect to socket server...');
      setStatus('connecting');
      setError(null);

      // Get the hostname from the window location
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      
      // Try connecting to the Next.js server directly
      const socketUrl = `http://${hostname}:3000`;
      addMessage(`Connecting to Next.js server: ${socketUrl}`);
      
      const socketInstance = io(socketUrl, {
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true,
        withCredentials: false, // Important for CORS
      });

      // Set up event handlers
      socketInstance.on('connect', () => {
        addMessage(`Connected successfully! Socket ID: ${socketInstance.id}`);
        setStatus('connected');
        
        if (socketInstance.io.engine) {
          const currentTransport = socketInstance.io.engine.transport.name;
          setTransport(currentTransport);
          addMessage(`Using transport: ${currentTransport}`);
        }
      });

      socketInstance.on('connect_error', (err) => {
        const errorMessage = `Connection error: ${err.message}`;
        addMessage(errorMessage);
        
        // If direct connection fails, try connecting through the API route
        if (!socketInstance.connected) {
          addMessage('Direct connection failed, trying through API route...');
          
          // Disconnect the current socket
          socketInstance.disconnect();
          
          // Try connecting through the API route
          const apiSocketUrl = `http://${hostname}:3000`;
          addMessage(`Connecting via API route: ${apiSocketUrl}`);
          
          const apiSocketInstance = io(apiSocketUrl, {
            path: '/api/socket',
            transports: ['polling', 'websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true,
            withCredentials: false,
          });
          
          // Transfer event handlers
          apiSocketInstance.on('connect', () => {
            addMessage(`Connected successfully via API route! Socket ID: ${apiSocketInstance.id}`);
            setStatus('connected');
            
            if (apiSocketInstance.io.engine) {
              const currentTransport = apiSocketInstance.io.engine.transport.name;
              setTransport(currentTransport);
              addMessage(`Using transport: ${currentTransport}`);
            }
          });
          
          apiSocketInstance.on('connect_error', (apiErr) => {
            const apiErrorMessage = `API route connection error: ${apiErr.message}`;
            addMessage(apiErrorMessage);
            setError(apiErrorMessage);
            setStatus('error');
          });
          
          apiSocketInstance.on('disconnect', (reason) => {
            addMessage(`Disconnected from API route: ${reason}`);
            setStatus('disconnected');
          });
          
          apiSocketInstance.on('welcome', (data) => {
            addMessage(`Received welcome message via API route: ${data.message}`);
          });
          
          apiSocketInstance.on('test_response', (data) => {
            addMessage(`Received response via API route: ${data.message} (at ${data.timestamp.split('T')[1].split('.')[0]})`);
          });
          
          // Store the socket instance
          setSocket(apiSocketInstance);
          return;
        }
        
        setError(errorMessage);
        setStatus('error');
      });

      socketInstance.on('disconnect', (reason) => {
        addMessage(`Disconnected: ${reason}`);
        setStatus('disconnected');
      });

      socketInstance.on('welcome', (data) => {
        addMessage(`Received welcome message: ${data.message}`);
      });

      // Handle test responses
      socketInstance.on('test_response', (data) => {
        addMessage(`Received response: ${data.message} (at ${data.timestamp.split('T')[1].split('.')[0]})`);
      });

      // Store the socket instance
      setSocket(socketInstance);
      
      return socketInstance;
    } catch (err: any) {
      const errorMessage = `Error creating socket: ${err.message}`;
      addMessage(errorMessage);
      setError(errorMessage);
      setStatus('error');
      return null;
    }
  };

  // Function to disconnect from the socket server
  const disconnectSocket = () => {
    if (socket) {
      addMessage('Disconnecting from socket server...');
      socket.disconnect();
      setSocket(null);
      setStatus('disconnected');
    }
  };

  // Function to send a test message
  const sendTestMessage = () => {
    if (socket && status === 'connected' && testMessage) {
      addMessage(`Sending test message: ${testMessage}`);
      socket.emit('test_message', { text: testMessage });
      setTestMessage('');
    } else {
      addMessage('Cannot send message: socket not connected');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Socket.IO Connection Test</h1>
      
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div 
            className={`w-4 h-4 rounded-full mr-2 ${
              status === 'connected' ? 'bg-green-500' : 
              status === 'connecting' ? 'bg-yellow-500' : 
              status === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}
          />
          <span className="font-medium">Status: {status}</span>
          {transport && <span className="ml-4 text-sm text-gray-600">Transport: {transport}</span>}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={connectSocket}
            disabled={status === 'connecting' || status === 'connected'}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Connect
          </button>
          
          <button
            onClick={disconnectSocket}
            disabled={status !== 'connected'}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
          >
            Disconnect
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Send Test Message</h2>
        <div className="flex">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l"
            disabled={status !== 'connected'}
          />
          <button
            onClick={sendTestMessage}
            disabled={status !== 'connected' || !testMessage}
            className="px-4 py-2 bg-green-500 text-white rounded-r disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Connection Log</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet. Click "Connect" to start.</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="mb-1">{message}</div>
            ))
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded mb-6">
          <h3 className="font-semibold text-red-700 mb-1">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 