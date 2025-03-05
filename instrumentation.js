export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    require('@vercel/speed-insights');
  }
} 