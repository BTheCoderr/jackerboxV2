"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

export default function SocketDebugPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketStatus, setSocketStatus] = useState<string>("disconnected");
  const [serverInfo, setServerInfo] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Session status: ${status}`);
    if (session) {
      addLog(`User authenticated: ${session.user?.name}`);
    }

    // Fetch socket server status
    fetchSocketStatus();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [session, status]);

  const fetchSocketStatus = async () => {
    try {
      addLog("Fetching socket server status...");
      const response = await fetch("/api/socket-status");
      if (!response.ok) {
        throw new Error(`Failed to fetch socket status: ${response.status}`);
      }
      const data = await response.json();
      setServerInfo(data);
      addLog(`Socket server status: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`Error fetching socket status: ${error}`);
    }
  };

  const connectSocket = (method: "direct" | "proxy") => {
    if (socket) {
      addLog("Disconnecting existing socket...");
      socket.disconnect();
      setSocket(null);
    }

    try {
      addLog(`Connecting to socket server using ${method}...`);
      
      let socketInstance: Socket;
      
      if (method === "direct" && serverInfo?.port) {
        // Connect directly to the socket server
        const url = `http://${window.location.hostname}:${serverInfo.port}`;
        addLog(`Connecting directly to ${url}`);
        socketInstance = io(url, {
          transports: ["websocket", "polling"],
        });
      } else {
        // Connect through the proxy
        addLog("Connecting through proxy at /api/socket");
        socketInstance = io({
          path: "/api/socket",
          transports: ["websocket", "polling"],
        });
      }
      
      socketInstance.on("connect", () => {
        addLog(`Socket connected: ${socketInstance.id}`);
        setSocketStatus("connected");
      });
      
      socketInstance.on("connect_error", (err) => {
        addLog(`Socket connection error: ${err.message}`);
        setSocketStatus("error");
      });
      
      socketInstance.on("disconnect", (reason) => {
        addLog(`Socket disconnected: ${reason}`);
        setSocketStatus("disconnected");
      });
      
      socketInstance.on("error", (err) => {
        addLog(`Socket error: ${err}`);
        setSocketStatus("error");
      });
      
      setSocket(socketInstance);
    } catch (error) {
      addLog(`Error creating socket: ${error}`);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      addLog("Disconnecting socket...");
      socket.disconnect();
      setSocket(null);
      setSocketStatus("disconnected");
    } else {
      addLog("No socket to disconnect");
    }
  };

  const sendTestMessage = () => {
    if (!socket || socket.disconnected) {
      addLog("Cannot send message: Socket not connected");
      return;
    }
    
    const testMessage = {
      type: "test",
      content: "Test message",
      timestamp: new Date().toISOString(),
    };
    
    addLog(`Sending test message: ${JSON.stringify(testMessage)}`);
    socket.emit("test-message", testMessage);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Socket Server Debug Page</h1>
      
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
        <h2 className="text-xl font-semibold mb-4">Socket Server Status</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          {serverInfo ? (
            <div>
              <p>Initialized: <span className="font-medium">{serverInfo.initialized ? "Yes" : "No"}</span></p>
              <p>Port: <span className="font-medium">{serverInfo.port || "N/A"}</span></p>
              <p>Error: <span className="font-medium">{serverInfo.error || "None"}</span></p>
              <p>Socket Server URL: <span className="font-medium">{serverInfo.socketServerUrl || "N/A"}</span></p>
              <p>Proxy URL: <span className="font-medium">{serverInfo.proxyUrl || "N/A"}</span></p>
            </div>
          ) : (
            <p>Loading server info...</p>
          )}
          <button
            onClick={fetchSocketStatus}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Refresh Status
          </button>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Socket Connection</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <p>
            Connection Status: 
            <span className={`font-medium ml-2 ${
              socketStatus === "connected" ? "text-green-600" :
              socketStatus === "error" ? "text-red-600" :
              "text-gray-600"
            }`}>
              {socketStatus}
            </span>
          </p>
          <p>Socket ID: <span className="font-medium">{socket?.id || "N/A"}</span></p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => connectSocket("proxy")}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              disabled={!session}
            >
              Connect via Proxy
            </button>
            <button
              onClick={() => connectSocket("direct")}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={!session || !serverInfo?.port}
            >
              Connect Directly
            </button>
            <button
              onClick={disconnectSocket}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              disabled={!socket}
            >
              Disconnect
            </button>
            <button
              onClick={sendTestMessage}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              disabled={!socket || socket.disconnected}
            >
              Send Test Message
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Socket Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet.</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
} 