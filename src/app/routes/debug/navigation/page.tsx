"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NavigationDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Session status: ${status}`);
    if (session) {
      addLog(`User authenticated: ${session.user?.name}`);
    }
  }, [session, status]);

  const testNavigation = (path: string, method: "router" | "link" | "direct") => {
    addLog(`Testing navigation to ${path} using ${method}`);
    
    try {
      if (method === "router") {
        router.push(path);
      } else if (method === "direct") {
        window.location.href = path;
      } else {
        // Link method is simulated by creating and clicking a link
        const link = document.createElement("a");
        link.href = path;
        link.click();
      }
      addLog(`Navigation initiated to ${path}`);
    } catch (error) {
      addLog(`Error navigating to ${path}: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Navigation Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <p>Status: <span className="font-medium">{status}</span></p>
          {session && (
            <div className="mt-2">
              <p>User: {session.user?.name}</p>
              <p>Email: {session.user?.email}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Messages</h3>
            <div className="space-y-2">
              <button
                onClick={() => testNavigation("/routes/messages", "router")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Router Push
              </button>
              <button
                onClick={() => testNavigation("/routes/messages", "direct")}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Direct (window.location)
              </button>
              <button
                onClick={() => testNavigation("/routes/messages", "link")}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Link Click
              </button>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Notifications</h3>
            <div className="space-y-2">
              <button
                onClick={() => testNavigation("/routes/dashboard/notifications", "router")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Router Push
              </button>
              <button
                onClick={() => testNavigation("/routes/dashboard/notifications", "direct")}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Direct (window.location)
              </button>
              <button
                onClick={() => testNavigation("/routes/dashboard/notifications", "link")}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Link Click
              </button>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Profile</h3>
            <div className="space-y-2">
              <button
                onClick={() => testNavigation("/routes/profile", "router")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Router Push
              </button>
              <button
                onClick={() => testNavigation("/routes/profile", "direct")}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Direct (window.location)
              </button>
              <button
                onClick={() => testNavigation("/routes/profile", "link")}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Link Click
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Navigation Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Test navigation to see logs.</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
} 