'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * Safely renders content only on the client side
 * Use this for components that may contain dynamic data that differs between server and client
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient ? <>{children}</> : <>{fallback}</>;
}

/**
 * Creates a placeholder node with the exact same structure as the real component
 * but with empty or placeholder content
 */
export function createHydrationSafePlaceholder(Component: React.ComponentType<any>, props: any = {}) {
  return function HydrationSafePlaceholder(placeholderProps: any) {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
      setIsClient(true);
    }, []);
    
    // On the client, render the actual component
    if (isClient) {
      return <Component {...props} {...placeholderProps} />;
    }
    
    // On the server or during hydration, render an empty div with the same className
    // This maintains the layout but prevents hydration mismatches
    return (
      <div 
        className={props.className || 'hydration-placeholder'} 
        suppressHydrationWarning 
        id={`placeholder-${Math.random().toString(36).substring(2, 10)}`}
      />
    );
  };
}

/**
 * HOC that wraps a component to make it hydration-safe
 */
export function withHydrationSafety<P extends object>(
  Component: React.ComponentType<P>,
  options: { ssr?: boolean } = {}
) {
  return function SafeComponent(props: P) {
    // If SSR is disabled, only render on client
    if (options.ssr === false) {
      return <ClientOnly><Component {...props} /></ClientOnly>;
    }
    
    // With SSR enabled, we need more careful handling
    const [isHydrated, setIsHydrated] = useState(false);
    
    useEffect(() => {
      setIsHydrated(true);
    }, []);
    
    return (
      <>
        {/* This div will be rendered on both server and client but won't affect layout */}
        <div suppressHydrationWarning style={{ display: 'none' }} />
        
        {/* The actual component gets a key that changes after hydration to force a re-render */}
        <Component key={isHydrated ? 'hydrated' : 'server'} {...props} />
      </>
    );
  };
} 