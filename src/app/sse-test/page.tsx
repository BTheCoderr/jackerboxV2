'use client';

import { useState, useEffect } from 'react';
import { useSSE } from '@/hooks/use-sse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Plus, Trash } from 'lucide-react';

export default function SSETestPage() {
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('test');
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  
  // Initialize SSE connection
  const {
    status,
    clientId,
    error,
    subscribedTopics,
    subscribe,
    unsubscribe,
  } = useSSE({
    onConnect: (id) => {
      console.log('Connected to SSE with client ID:', id);
      // Auto-subscribe to default topic
      subscribe('test');
    },
    onMessage: (data) => {
      console.log('Received message:', data);
      setReceivedMessages((prev) => [data, ...prev].slice(0, 50));
    },
    onSubscribed: (topic) => {
      console.log('Subscribed to topic:', topic);
    },
    onUnsubscribed: (topic) => {
      console.log('Unsubscribed from topic:', topic);
    },
    onError: (err) => {
      console.error('SSE error:', err);
    },
  });
  
  // Send a message
  const sendMessage = async () => {
    if (!message.trim() || !topic.trim()) return;
    
    try {
      const response = await fetch('/api/sse/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          data: {
            text: message,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      
      const result = await response.json();
      console.log('Message sent:', result);
      
      // Clear the message input
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Add a custom topic
  const addCustomTopic = () => {
    if (!newTopic.trim() || customTopics.includes(newTopic)) return;
    setCustomTopics([...customTopics, newTopic]);
    setNewTopic('');
  };
  
  // Subscribe to a topic
  const handleSubscribe = (topicName: string) => {
    subscribe(topicName);
  };
  
  // Unsubscribe from a topic
  const handleUnsubscribe = (topicName: string) => {
    unsubscribe(topicName);
  };
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Server-Sent Events (SSE) Test</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Current status of your SSE connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Status:</span>
                <Badge 
                  variant={status === 'connected' ? 'default' : status === 'connecting' || status === 'reconnecting' ? 'outline' : 'destructive'}
                >
                  {status === 'connecting' || status === 'reconnecting' ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  {status}
                </Badge>
              </div>
              
              {clientId && (
                <div>
                  <span className="font-semibold">Client ID:</span>
                  <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">{clientId}</code>
                </div>
              )}
              
              {error && (
                <div className="text-red-500">
                  <span className="font-semibold">Error:</span> {error.message}
                </div>
              )}
              
              <div>
                <span className="font-semibold">Subscribed Topics:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {subscribedTopics.length > 0 ? (
                    subscribedTopics.map((topic) => (
                      <Badge key={topic} variant="outline" className="flex items-center gap-1">
                        {topic}
                        <button 
                          onClick={() => handleUnsubscribe(topic)}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No topics subscribed</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>
              Send a message to a specific topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <div className="flex space-x-2">
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={sendMessage} 
              disabled={!message.trim() || !topic.trim() || status !== 'connected'}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Topic Management</CardTitle>
            <CardDescription>
              Subscribe to or unsubscribe from topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="default">
              <TabsList className="mb-4">
                <TabsTrigger value="default">Default Topics</TabsTrigger>
                <TabsTrigger value="custom">Custom Topics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="default">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['test', 'notifications', 'chat', 'updates'].map((topicName) => (
                    <Card key={topicName}>
                      <CardContent className="p-4">
                        <div className="font-medium">{topicName}</div>
                        <div className="mt-2">
                          {subscribedTopics.includes(topicName) ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUnsubscribe(topicName)}
                              className="w-full"
                            >
                              Unsubscribe
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSubscribe(topicName)}
                              className="w-full"
                              disabled={status !== 'connected'}
                            >
                              Subscribe
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="custom">
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Enter new topic name"
                    />
                    <Button onClick={addCustomTopic} disabled={!newTopic.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {customTopics.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {customTopics.map((topicName) => (
                        <Card key={topicName}>
                          <CardContent className="p-4">
                            <div className="font-medium">{topicName}</div>
                            <div className="mt-2">
                              {subscribedTopics.includes(topicName) ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleUnsubscribe(topicName)}
                                  className="w-full"
                                >
                                  Unsubscribe
                                </Button>
                              ) : (
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleSubscribe(topicName)}
                                  className="w-full"
                                  disabled={status !== 'connected'}
                                >
                                  Subscribe
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No custom topics added yet
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Received Messages</CardTitle>
            <CardDescription>
              Messages received from subscribed topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receivedMessages.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {receivedMessages.map((msg, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{msg.topic || 'unknown'}</Badge>
                      <span className="text-xs text-gray-500">
                        {msg._meta?.timestamp ? formatTime(msg._meta.timestamp) : 'No timestamp'}
                      </span>
                    </div>
                    <div className="mt-2">
                      {msg.data?.text || JSON.stringify(msg.data || msg)}
                    </div>
                    {msg._meta?.senderId && (
                      <div className="mt-1 text-xs text-gray-500">
                        From: {msg._meta.senderId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No messages received yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 