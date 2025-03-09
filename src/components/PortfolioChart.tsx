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
import { formatSuiBalance, buildPortfolioHistoryFromTransactions, buildDetailedPortfolioHistory } from '../lib/sui-client';

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
  // Use local state for timeframe
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>(initialTimeframe);
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [useTransactionBased, setUseTransactionBased] = useState(true);

  // Debug balance prop
  console.log('PortfolioChart received balance:', balance);
  console.log('PortfolioChart balance type:', typeof balance);
  
  // Convert balance to number with better error handling
  const numericBalance = (() => {
    // Handle undefined or null
    if (balance === undefined || balance === null) {
      console.log('Balance is undefined or null, returning 0');
      return 0;
    }
    
    // Handle Sui balance object (most common case)
    if (typeof balance === 'object' && balance !== null) {
      console.log('Balance is an object with keys:', Object.keys(balance));
      // Check if it has totalBalance property (from Sui client)
      if ('totalBalance' in balance) {
        const balanceObj = balance as { totalBalance: string | number };
        const totalBalanceStr = String(balanceObj.totalBalance);
        const parsed = parseFloat(totalBalanceStr);
        console.log('Extracted totalBalance from object:', parsed);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
    
    // Handle string balance
    if (typeof balance === 'string') {
      // Handle empty strings
      if (!balance.trim()) {
        console.log('Balance is empty string, returning 0');
        return 0;
      }
      const parsed = parseFloat(balance);
      console.log('Parsed string balance to number:', parsed);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // Handle number balance
    if (typeof balance === 'number' && !isNaN(balance)) {
      console.log('Balance is already a number:', balance);
      return balance;
    }
    
    console.log('Balance is in unexpected format, returning 0');
    return 0;
  })();
  
  console.log('Numeric balance after conversion:', numericBalance);
  
  // Convert from MIST to SUI - SUI has 9 decimal places
  const balanceInSui = numericBalance / 1_000_000_000;
  console.log('Balance in SUI after division:', balanceInSui);
  
  // Format for display
  const formattedBalance = formatSuiBalance(balance || 0);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        console.log('Fetching portfolio data with balance:', balanceInSui);
        
        // Ensure we're passing a valid number
        const validBalance = isNaN(balanceInSui) ? 0 : balanceInSui;
        
        let data;
        
        if (useTransactionBased && address) {
          // Use transaction-based portfolio history if we have an address
          console.log('Using transaction-based portfolio history');
          
          // Use the new detailed portfolio history builder
          data = await buildDetailedPortfolioHistory(address, validBalance, 'mainnet', timeframe);
          console.log('Transaction-based portfolio data:', data);
        } else {
          // Fallback to price-based portfolio history
          console.log('Using price-based portfolio history');
          data = await getPortfolioHistory(validBalance, 'SUI', timeframe);
        }
        
        setPortfolioData(data);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, [balanceInSui, timeframe, address, useTransactionBased]);

  // Format date based on timeframe
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    
    // Format differently based on timeframe
    if (timeframe === 'day') {
      // For day view, use shorter time format that works better on the chart
      // Only show hour without minutes for cleaner display
      const hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12; // Convert to 12-hour format
      
      // Return just the hour and AM/PM for cleaner display
      return `${hour12} ${ampm}`;
    } else if (timeframe === 'week') {
      return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    } else if (timeframe === 'month') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // For year view, just show month and year
      return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }
  };

  // Filter data points for display based on timeframe to avoid crowding the chart
  const filteredDataForDisplay = () => {
    // For very large datasets, sample the data to avoid overcrowding the chart
    if (portfolioData.length <= 50) return portfolioData;
    
    let interval = 1;
    if (timeframe === 'year' && portfolioData.length > 100) {
      interval = Math.ceil(portfolioData.length / 50); // Show ~50 points for a year
    } else if (timeframe === 'month' && portfolioData.length > 60) {
      interval = Math.ceil(portfolioData.length / 30); // Show ~30 points for a month
    } else if (timeframe === 'week' && portfolioData.length > 30) {
      interval = Math.ceil(portfolioData.length / 15); // Show ~15 points for a week
    } else if (timeframe === 'day' && portfolioData.length > 24) {
      interval = Math.ceil(portfolioData.length / 24); // Show ~24 points for a day (hourly)
    }
    
    return portfolioData.filter((_, index) => index % interval === 0 || index === portfolioData.length - 1);
  };

  // Calculate current portfolio value and change
  const currentValue = portfolioData.length > 0 
    ? portfolioData[portfolioData.length - 1].value 
    : 0;
  
  // Find an appropriate comparison point based on timeframe
  const getComparisonValue = () => {
    if (portfolioData.length <= 1) return currentValue;
    
    // For day, compare to 24h ago
    // For week, compare to 7d ago
    // For month, compare to 30d ago
    // For year, compare to 365d ago
    let targetTimestamp = Date.now();
    
    if (timeframe === 'day') {
      targetTimestamp = Date.now() - 24 * 60 * 60 * 1000;
    } else if (timeframe === 'week') {
      targetTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'month') {
      targetTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'year') {
      targetTimestamp = Date.now() - 365 * 24 * 60 * 60 * 1000;
    }
    
    // Find closest data point to the target timestamp
    let closestPoint = portfolioData[0];
    let minDiff = Math.abs(portfolioData[0].timestamp - targetTimestamp);
    
    for (let i = 1; i < portfolioData.length; i++) {
      const diff = Math.abs(portfolioData[i].timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = portfolioData[i];
      }
    }
    
    return closestPoint.value;
  };
  
  const previousValue = getComparisonValue();
  const valueChange = isNaN(currentValue - previousValue) ? 0 : currentValue - previousValue;
  const percentChange = previousValue && !isNaN(previousValue) ? 
    (valueChange / Math.max(0.01, previousValue)) * 100 : 0;
  const isPositive = valueChange >= 0;

  // Ensure we don't display NaN values in the UI
  const displayCurrentValue = isNaN(currentValue) ? 0 : currentValue;
  const displayValueChange = isNaN(valueChange) ? 0 : valueChange;
  const displayPercentChange = isNaN(percentChange) ? 0 : percentChange;

  // Prepare chart data using filtered data points
  const displayData = filteredDataForDisplay();
  
  const chartData = {
    labels: displayData.map(data => formatDate(data.timestamp)),
    datasets: [
      {
        label: 'Portfolio Value in USD',
        data: displayData.map(data => data.value),
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
        fill: true,
        pointRadius: 3, // Make points bigger
        pointHoverRadius: 8, // Make hover points even bigger
        pointBackgroundColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };
  
  // Log portfolio data for debugging
  console.log('Current value:', currentValue);
  console.log('Previous value:', previousValue);
  console.log('Value change:', valueChange);
  console.log('Percent change:', percentChange);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Value History',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Value: $${context.raw.toFixed(2)}`;
          },
          title: function(tooltipItems: any) {
            const date = new Date(displayData[tooltipItems[0].dataIndex].timestamp);
            // Format tooltip date/time more clearly
            if (timeframe === 'day') {
              // For day view, show full date and time in the tooltip
              return date.toLocaleString([], { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric', 
                minute: 'numeric',
                hour12: true 
              });
            } else {
              return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
            }
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => `$${value.toFixed(2)}`
        }
      },
      x: {
        // For day view, limit the number of labels shown to prevent crowding
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: timeframe === 'day' ? 12 : 
                         timeframe === 'week' ? 7 : 
                         timeframe === 'month' ? 15 : 12,
        }
      }
    },
    // For day view, ensure hover is very responsive
    hover: {
      mode: 'index' as const,
      intersect: false
    },
    // Make the animation faster for day view
    animation: {
      duration: timeframe === 'day' ? 400 : 1000
    },
  };

  if (loading) {
    return <div className="p-4 text-center">Loading portfolio data...</div>;
  }

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month' | 'year') => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Portfolio Value</h2>
          <div className="flex flex-col mt-1">
            <p className="text-3xl font-bold">${displayCurrentValue.toFixed(2)}</p>
            <div className="flex items-center">
              <p className={`${isPositive ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                {isPositive ? '+' : ''}{displayValueChange.toFixed(2)} ({isPositive ? '+' : ''}{displayPercentChange.toFixed(2)}%)
              </p>
              <span className="text-gray-500 ml-2 text-sm">
                from {timeframe === 'day' ? 'yesterday' : 
                       timeframe === 'week' ? 'last week' : 
                       timeframe === 'month' ? 'last month' : 'last year'}
              </span>
            </div>
            <p className="text-gray-500 mt-2 text-sm">
              Current Balance: {formattedBalance} SUI
            </p>
          </div>
        </div>
        <div>
          <div className="flex space-x-2 mb-2">
            <button 
              className={`px-2 py-1 text-sm rounded ${timeframe === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleTimeframeChange('day')}
            >
              1D
            </button>
            <button 
              className={`px-2 py-1 text-sm rounded ${timeframe === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleTimeframeChange('week')}
            >
              1W
            </button>
            <button 
              className={`px-2 py-1 text-sm rounded ${timeframe === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleTimeframeChange('month')}
            >
              1M
            </button>
            <button 
              className={`px-2 py-1 text-sm rounded ${timeframe === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => handleTimeframeChange('year')}
            >
              1Y
            </button>
          </div>
          
          {/* Data Source Toggle */}
          <div className="flex items-center justify-end text-sm">
            <span className="mr-2 text-gray-600">Source:</span>
            <button 
              className={`px-2 py-1 text-xs rounded mr-1 ${useTransactionBased ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUseTransactionBased(true)}
              disabled={!address}
              title={!address ? "Wallet address required" : "Based on your transactions"}
            >
              Transactions
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${!useTransactionBased ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUseTransactionBased(false)}
              title="Based on SUI price"
            >
              Price
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 