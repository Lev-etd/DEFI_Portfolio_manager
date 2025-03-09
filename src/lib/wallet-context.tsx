import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAccountBalance, getAccountObjects, getTransactionHistory } from './sui-client';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: any | null;
  assets: any[] | null;
  transactions: any[] | null;
  connectWallet: (addr: string) => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<any | null>(null);
  const [assets, setAssets] = useState<any[] | null>(null);
  const [transactions, setTransactions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async (addr: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get account balance
      const accountBalance = await getAccountBalance(addr);
      setBalance(accountBalance);
      
      // Get owned objects (assets)
      const accountObjects = await getAccountObjects(addr);
      setAssets(accountObjects.data);
      
      // Get transaction history
      const txHistory = await getTransactionHistory(addr);
      setTransactions(txHistory.data);
      
      // Set connected address
      setAddress(addr);
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setAssets(null);
    setTransactions(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        balance,
        assets,
        transactions,
        connectWallet,
        disconnectWallet,
        loading,
        error
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 