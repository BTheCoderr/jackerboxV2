import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Equipment | Jackerbox',
  description: 'Browse and rent equipment from local owners in your area.',
  openGraph: {
    title: 'Browse Equipment | Jackerbox',
    description: 'Browse and rent equipment from local owners in your area.',
    images: [
      {
        url: '/og-equipment.jpg',
        width: 1200,
        height: 630,
        alt: 'Jackerbox Equipment Rental'
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Equipment | Jackerbox',
    description: 'Browse and rent equipment from local owners in your area.',
    images: ['/og-equipment.jpg'],
  },
  alternates: {
    canonical: '/routes/equipment',
  },
}; 