'use client';

import { ConnectButton } from '@mysten/dapp-kit';

export default function SuiWalletConnect() {
  return (
    <ConnectButton 
      className="!bg-blue-500 hover:!bg-blue-600 !text-white !px-4 !py-2 !rounded-md !text-sm !font-medium"
      connectText="Connect Wallet"
    />
  );
} 