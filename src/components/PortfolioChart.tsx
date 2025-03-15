'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getPortfolioHistory } from '../lib/navi-client';
import { buildDetailedPortfolioHistory } from '../lib/sui-client';
import { getCurrentPrice } from '../lib/navi-client';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PortfolioData {
  timestamp: number;
  value: number;
}

interface PortfolioChartProps {
  balance: number | string | undefined;
  address: string | undefined | null;
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

export default function PortfolioChart({
  balance,
  address,
  timeframe: initialTimeframe = 'month'
}: PortfolioChartProps) {
  // State declarations
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>(initialTimeframe);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioStats, setPortfolioStats] = useState({
    latestValue: 0,
    valueChange: 0,
    percentChange: 0,
    suiBalance: 0,
    suiPrice: 0
  });
  
  // Convert balance to number if it's a string
  const balanceInSui = typeof balance === 'string' ? parseFloat(balance) : Number(balance) || 0;
  
  // Format dates based on timeframe
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    switch (timeframe) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case 'year':
        return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };
  
  // Fetch portfolio data based on balance, address, and timeframe
  useEffect(() => {
    const fetchPortfolioData = async () => {
      // Reset state
      setLoading(true);
      setError(null);
      
      // Extensive debugging of inputs
      console.log('PortfolioChart inputs:', { 
        rawBalance: balance, 
        balanceType: typeof balance, 
        parsedBalance: balanceInSui,
        address,
        timeframe
      });
      
      // Check for required data
      if (!balanceInSui || balanceInSui <= 0) {
        setError("Valid balance is required to display portfolio history");
        setLoading(false);
        return;
      }

      if (!address) {
        setError("Wallet address is required to display portfolio history");
        setLoading(false);
        return;
      }
      
      try {
        // Get current SUI price
        let currentPriceData;
        try {
          currentPriceData = await getCurrentPrice();
          console.log(`Current SUI price: $${currentPriceData.price}`);
        } catch (priceError) {
          console.error('Error fetching current price:', priceError);
          setError("Unable to fetch current SUI price");
          setLoading(false);
          return;
        }
        
        const currentPrice = currentPriceData.price;
        
        console.log(`Fetching portfolio history for balance: ${balanceInSui}, address: ${address || 'none'}`);
        
        // Try to build transaction-based history
        try {
          console.log('Building portfolio history from transactions');
          const data = await buildDetailedPortfolioHistory(
            address,
            balanceInSui,
            'mainnet',
            timeframe
          );
          console.log(`Retrieved ${data.length} portfolio data points from transaction history`);
          
          // Process the data for the chart
          if (data && data.length > 0) {
            console.log(`Success! Got ${data.length} portfolio data points`);
            setPortfolioData(data);
            
            // Calculate statistics
            const latestValue = data[data.length - 1]?.value || 0;
            const earliestValue = data[0]?.value || 0;
            const valueChange = latestValue - earliestValue;
            const percentChange = earliestValue > 0 
              ? (valueChange / earliestValue) * 100 
              : 0;
              
            console.log('Portfolio stats calculated:', {
              latestValue: `$${latestValue.toFixed(2)}`,
              earliestValue: `$${earliestValue.toFixed(2)}`,
              valueChange: `$${valueChange.toFixed(2)}`,
              percentChange: `${percentChange.toFixed(2)}%`,
              suiBalance: balanceInSui,
              suiPrice: currentPrice
            });
            
            setPortfolioStats({
              latestValue,
              valueChange,
              percentChange,
              suiBalance: balanceInSui,
              suiPrice: currentPrice
            });
          } else {
            setError("No portfolio data available for selected timeframe");
          }
        } catch (txError) {
          console.error('Transaction-based history error:', txError);
          setError(txError instanceof Error ? txError.message : "Failed to build transaction-based portfolio history");
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setError(`Failed to load portfolio data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [balanceInSui, timeframe, address]);
  
  // Prepare chart data
  const chartData = {
    labels: portfolioData.map(data => formatDate(data.timestamp)),
    datasets: [
      {
        label: 'Portfolio Value',
        data: portfolioData.map(data => data.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 5,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.raw.toFixed(2)} USD`,
          title: (tooltipItems: any) => {
            const date = new Date(portfolioData[tooltipItems[0].dataIndex].timestamp);
            return date.toLocaleString();
          }
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };
  
  // Render component
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Portfolio Value (USD)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Based on your SUI balance and historical prices
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={() => setTimeframe('day')}
            className={`px-3 py-1 rounded ${
              timeframe === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            24H
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 rounded ${
              timeframe === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1W
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 rounded ${
              timeframe === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1M
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1 rounded ${
              timeframe === 'year'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            1Y
          </button>
        </div>
      </div>
      
      {portfolioData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end mb-4">
          <div className="mr-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Value</p>
            <p className="text-2xl font-bold">${portfolioStats.latestValue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              {portfolioStats.suiBalance.toFixed(2)} SUI @ ${portfolioStats.suiPrice.toFixed(2)}
            </p>
          </div>
          <div 
            className={`flex items-center ${
              portfolioStats.valueChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <span className="text-lg font-semibold">
              {portfolioStats.valueChange >= 0 ? '+' : ''}
              ${Math.abs(portfolioStats.valueChange).toFixed(2)} 
            </span>
            <span className="ml-1">
              ({portfolioStats.valueChange >= 0 ? '+' : ''}
              {portfolioStats.percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-sm">
            {!address ? 'Connect your wallet to view your portfolio history' : 
             !balanceInSui ? 'Your wallet needs SUI tokens to display portfolio history' : 
             'Please try a different timeframe or try again later'}
          </p>
        </div>
      ) : portfolioData.length > 0 ? (
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No portfolio data available for this timeframe
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          {address ? 'Based on real transaction history and historical SUI price data' : 'Connect your wallet to view portfolio history'}
        </p>
      </div>
    </div>
  );
} 