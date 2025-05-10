"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface CSRFContextType {
  csrfToken: string;
  refreshToken: () => void;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export const useCSRFToken = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRFToken must be used within a CSRFTokenProvider');
  }
  return context;
};

export const CSRFTokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  const refreshToken = () => {
    const newToken = uuidv4();
    setCsrfToken(newToken);
    
    // Store token in session storage for persistence across page refreshes
    sessionStorage.setItem('csrfToken', newToken);
  };

  useEffect(() => {
    // Try to get token from session storage first
    const storedToken = sessionStorage.getItem('csrfToken');
    
    if (storedToken) {
      setCsrfToken(storedToken);
    } else {
      refreshToken();
    }
  }, []);

  return (
    <CSRFContext.Provider value={{ csrfToken, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  );
};

export const CSRFTokenInput: React.FC = () => {
  const { csrfToken } = useCSRFToken();
  
  return (
    <input 
      type="hidden" 
      name="csrfToken" 
      value={csrfToken} 
    />
  );
};

export default CSRFTokenProvider;
