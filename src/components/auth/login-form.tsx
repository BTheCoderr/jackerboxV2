"use client";

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type Fields = z.infer<typeof schema>;

const callbackUrl = () => {
  const candidate = new URLSearchParams(window.location.search).get('callbackUrl');
  return candidate?.startsWith('/') && !candidate.startsWith('//') ? candidate : '/routes/dashboard';
};

export function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({
    resolver: zodResolver(schema),
  });

  const submit = async ({ email, password }: Fields) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email, password, redirect: false, callbackUrl: callbackUrl(),
      });
      if (!result?.ok || result.error) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      window.location.assign(callbackUrl());
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signInGoogle = () => signIn('google', { callbackUrl: callbackUrl() });

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border bg-white p-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Log in to JackerBox</h1>
        <p className="text-sm text-gray-600">Access your listings, rentals and messages.</p>
      </header>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <label className="block text-sm">Email
          <input {...register('email')} type="email" autoComplete="email"
            disabled={submitting} className="mt-1 w-full rounded border p-3" />
          {errors.email && <span className="text-red-700">{errors.email.message}</span>}
        </label>
        <label className="block text-sm">Password
          <span className="mt-1 flex rounded border">
            <input {...register('password')} type={showPassword ? 'text' : 'password'}
              autoComplete="current-password" disabled={submitting}
              className="min-w-0 flex-1 p-3" />
            <button type="button" onClick={() => setShowPassword(x => !x)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="px-3 text-sm text-gray-600">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
          {errors.password && <span className="text-red-700">{errors.password.message}</span>}
        </label>
        <button type="submit" disabled={submitting}
          className="w-full rounded bg-jacker-blue p-3 font-medium text-white disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <div className="relative text-center text-sm text-gray-500">or</div>
      <button type="button" onClick={signInGoogle} disabled={submitting}
        className="w-full rounded border p-3 font-medium hover:bg-gray-50 disabled:opacity-50">
        Continue with Google
      </button>
      <p className="text-center text-sm">
        New to JackerBox? <Link href="/auth/register" className="text-jacker-blue underline">Create an account</Link>
      </p>
      <p className="text-center text-xs text-gray-500">
        Phone-only login is temporarily unavailable until verified one-time codes are integrated with sessions.
      </p>
    </div>
  );
}
