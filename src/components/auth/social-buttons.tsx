import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useState } from 'react';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  className?: string;
}

export function SocialButton({ provider, className }: SocialButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn(provider, { callbackUrl: '/routes/dashboard' });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = provider === 'google' ? Icons.google : Icons.apple;
  const label = provider === 'google' ? 'Google' : 'Apple';

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={handleSignIn}
      className={className}
    >
      {isLoading ? (
        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" data-testid="social-button-loading" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      Continue with {label}
    </Button>
  );
}

export function SocialButtons() {
  return (
    <div className="grid gap-4">
      <SocialButton provider="google" />
      <SocialButton provider="apple" />
    </div>
  );
} 