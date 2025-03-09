'use client';

import React from 'react';
import { WalletProvider } from '../lib/wallet-context';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletProvider>{children}</WalletProvider>;
} 