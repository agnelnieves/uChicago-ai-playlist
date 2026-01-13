import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Explore AI-generated music from the community. Find new tracks and playlists created with Hyde\'s advanced AI music generation.',
  openGraph: {
    title: 'Discover AI Music - Hyde',
    description: 'Explore AI-generated music from the community. Find new tracks and playlists created with advanced AI technology.',
  },
  twitter: {
    title: 'Discover AI Music - Hyde',
    description: 'Explore AI-generated music from the community. Find new tracks and playlists created with advanced AI technology.',
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
