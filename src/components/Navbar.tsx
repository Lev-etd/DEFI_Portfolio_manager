'use client';

import React from 'react';
import Link from 'next/link';
import SuiWalletConnect from './SuiWalletConnect';

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Sui Portfolio Manager
            </Link>
            <div className="hidden md:flex space-x-4 ml-8">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <Link href="/protocols" className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                Protocols
              </Link>
            </div>
          </div>
          
          <SuiWalletConnect />
        </div>
      </div>
    </nav>
  );
} 