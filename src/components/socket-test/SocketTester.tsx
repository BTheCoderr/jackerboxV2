"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useSocket, SocketStatus } from '@/hooks/use-socket';

export function SocketTester() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    socket,
    status,
    connect,
    disconnect,
    sendMessage,
    isConnected,
    subscribe
  } = useSocket({
    autoConnect: false,
    events: ['test_response']
  });
  
  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    // Subscribe to test_response events
    if (socket) {
      const unsubscribe = subscribe('test_response', (data: any) => {
        addMessage(`Response from server: ${JSON.stringify(data)}`);
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [socket, subscribe]);
  
  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, msg]);
  };
  
  const handleConnect = () => {
    addMessage('Connecting to socket server...');
    connect();
  };
  
  const handleDisconnect = () => {
    disconnect();
    addMessage('Disconnected from socket server');
  };
  
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && isConnected) {
      addMessage(`Sending: ${message}`);
      
      sendMessage('test', {
        message,
        timestamp: new Date().toISOString()
      });
      
      setMessage('');
    }
  };
  
  const getStatusColor = (status: SocketStatus) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'reconnecting':
        return 'text-yellow-500';
      case 'disconnected':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status)}`}></div>
        <p className="text-sm">
          Status: <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
        </p>
      </div>
      
      <div className="mb-4 flex space-x-2">
        <button
          onClick={handleConnect}
          disabled={isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Connect
        </button>
        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Disconnect
        </button>
      </div>
      
      <div className="border rounded-md h-64 mb-4 overflow-y-auto p-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="mb-2 text-sm">
              {msg}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          disabled={!isConnected}
          placeholder="Type a message to send..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          type="submit"
          disabled={!isConnected || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
} 