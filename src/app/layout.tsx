import React from 'react';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import ClientProvider from '../components/ClientProvider';

export const metadata = {
  title: 'Sui Portfolio Manager',
  description: 'Track and manage your Sui blockchain assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
        </ClientProvider>
      </body>
    </html>
  );
} 