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
import { getHistoricalPrices } from '../lib/navi-client';

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

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  symbol?: string;
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

export default function PriceChart({
  symbol = 'SUI',
  timeframe: initialTimeframe = 'month'
}: PriceChartProps) {
  // Use local state for timeframe instead of URL parameters
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>(initialTimeframe);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        const data = await getHistoricalPrices(symbol, timeframe);
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [symbol, timeframe]); // This effect will run when timeframe changes

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const chartData = {
    labels: priceData.map(data => formatDate(data.timestamp)),
    datasets: [
      {
        label: `${symbol} Price`,
        data: priceData.map(data => data.price),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${symbol} Price History`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => `$${value.toFixed(2)}`
        }
      },
    },
  };

  if (loading) {
    return <div className="p-4 text-center">Loading price data...</div>;
  }

  // Handle timeframe change through local state
  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month' | 'year') => {
    setTimeframe(newTimeframe);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Price Chart</h2>
        <div className="flex space-x-2">
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
      </div>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 