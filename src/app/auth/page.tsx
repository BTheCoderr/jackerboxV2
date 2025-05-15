import { redirect } from 'next/navigation';

export default function AuthPage() {
  // Redirect to the login page
  redirect('/auth/login');
} 