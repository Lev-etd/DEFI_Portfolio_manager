'use client';

import React, { useEffect, useState } from 'react';
import { 
  getTransactions,
  ProcessedTransaction, 
  TransactionType, 
  TransactionStatus,
  formatSuiBalance,
  getTransactionHistoryWithBalanceChanges
} from '../lib/sui-client';

interface TransactionListProps {
  address: string | undefined | null;
  limit?: number;
}

export default function TransactionList({ address, limit = 10 }: TransactionListProps) {
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSampleData, setShowSampleData] = useState<boolean>(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    fetchTransactions();
  }, [address, limit]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching transactions for address: ${address}`);
      
      // Use the new getTransactions function
      const txHistory = await getTransactions(address || '', 'mainnet', limit);
      console.log(`Fetched ${txHistory.length} transactions for ${address}`);
      
      if (txHistory.length > 0) {
        setTransactions(txHistory);
      } else {
        // If no transactions found, show sample data in development
        console.log('No transactions found, using sample data for UI testing in development');
        if (process.env.NODE_ENV !== 'production') {
          setTransactions(getSampleTransactions());
        } else {
          setTransactions([]);
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(`Failed to fetch transactions: ${err instanceof Error ? err.message : String(err)}`);
      
      // In development, show sample transactions for UI testing
      if (process.env.NODE_ENV !== 'production') {
        setTransactions(getSampleTransactions());
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to get transaction type icon/indicator
  const getTransactionTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SEND:
        return <span className="text-red-500">↑</span>; // Upward arrow for outgoing
      case TransactionType.RECEIVE:
        return <span className="text-green-500">↓</span>; // Downward arrow for incoming
      case TransactionType.MIXED:
        return <span className="text-purple-500">⟷</span>; // Double arrow for mixed
      default:
        return <span className="text-gray-500">•</span>; // Default
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to truncate hash
  const truncateHash = (hash: string) => {
    if (hash.length <= 10) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Function to truncate address
  const truncateAddress = (addr: string) => {
    if (!addr || addr === 'Unknown') return 'Unknown';
    if (addr.length <= 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Function to get transaction status indicator
  const getStatusIndicator = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.SUCCESS:
        return <span className="text-green-500 text-xs">✓</span>;
      case TransactionStatus.FAILED:
        return <span className="text-red-500 text-xs">✗</span>;
      case TransactionStatus.PENDING:
        return <span className="text-yellow-500 text-xs">⌛</span>;
      default:
        return null;
    }
  };

  // Function to get transaction amount display
  const getTransactionAmount = (tx: ProcessedTransaction) => {
    // Calculate the total SUI change for this address
    let totalChange = 0;
    
    tx.balanceChanges.forEach(change => {
      if (change.coinType === '0x2::sui::SUI' && 
          change.owner === address) {
        totalChange += change.amount;
      }
    });
    
    // Format with proper sign
    const sign = totalChange > 0 ? '+' : '';
    return (
      <span className={totalChange > 0 ? 'text-green-500' : totalChange < 0 ? 'text-red-500' : 'text-gray-500'}>
        {sign}{totalChange.toFixed(4)} SUI
      </span>
    );
  };

  // Sample transaction data for demonstration
  const getSampleTransactions = (): ProcessedTransaction[] => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    return [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: now - 2 * day,
        status: TransactionStatus.SUCCESS,
        from: address || '0xSampleAddress',
        to: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        gasFee: '0.00032451',
        type: TransactionType.SEND,
        balanceChanges: [
          {
            owner: address || '0xSampleAddress',
            coinType: '0x2::sui::SUI',
            amount: -10.5
          },
          {
            owner: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
            coinType: '0x2::sui::SUI',
            amount: 10.5
          }
        ],
        rawTransaction: {}
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: now - 5 * day,
        status: TransactionStatus.SUCCESS,
        from: '0x8765432109fedcba8765432109fedcba8765432109fedcba8765432109fedcba',
        to: address || '0xSampleAddress',
        gasFee: '0.00028540',
        type: TransactionType.RECEIVE,
        balanceChanges: [
          {
            owner: address || '0xSampleAddress',
            coinType: '0x2::sui::SUI',
            amount: 5.2
          },
          {
            owner: '0x8765432109fedcba8765432109fedcba8765432109fedcba8765432109fedcba',
            coinType: '0x2::sui::SUI',
            amount: -5.2
          }
        ],
        rawTransaction: {}
      },
      {
        hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        timestamp: now - 7 * day,
        status: TransactionStatus.FAILED,
        from: address || '0xSampleAddress',
        to: '0x5432109876fedcba5432109876fedcba5432109876fedcba5432109876fedcba',
        gasFee: '0.00015320',
        type: TransactionType.SEND,
        balanceChanges: [],
        rawTransaction: {}
      }
    ];
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 text-center">
          {error}
          <button 
            onClick={fetchTransactions} 
            className="ml-2 text-blue-500 underline"
          >
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-500 text-center py-10">
          <p>No transactions found for this address</p>
          <p className="text-sm mt-2">Address: {address || 'Not connected'}</p>
          <button 
            onClick={fetchTransactions} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hash</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From/To</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.slice(0, limit).map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTransactionTypeIcon(tx.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href={`https://suiscan.xyz/mainnet/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {truncateHash(tx.hash)}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(tx.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tx.type === TransactionType.SEND ? (
                      <span>To: <a href={`https://suiscan.xyz/mainnet/address/${tx.to}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{truncateAddress(tx.to)}</a></span>
                    ) : (
                      <span>From: <a href={`https://suiscan.xyz/mainnet/address/${tx.from}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{truncateAddress(tx.from)}</a></span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTransactionAmount(tx)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusIndicator(tx.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 