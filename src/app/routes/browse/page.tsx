import { redirect } from 'next/navigation';

// Use live marketplace inventory instead of outdated sample listings.
export default function BrowsePage() {
  redirect('/routes/equipment');
}
