'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CoinSignal {
  symbol: string;
  action: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL';
  confidence: number;
  price: number;
  change24h: number;
}

export default function Home() {
  const [coins, setCoins] = useState<CoinSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        // Mock data - replace with actual API call
        const mockCoins: CoinSignal[] = [
          { symbol: 'BTCUSDT', action: 'STRONG BUY', confidence: 85, price: 45231.25, change24h: 2.34 },
          { symbol: 'ETHUSDT', action: 'BUY', confidence: 72, price: 2387.56, change24h: 1.23 },
          { symbol: 'ADAUSDT', action: 'HOLD', confidence: 45, price: 0.5123, change24h: -0.45 },
          { symbol: 'DOTUSDT', action: 'SELL', confidence: 68, price: 7.89, change24h: -3.21 },
          { symbol: 'LINKUSDT', action: 'STRONG SELL', confidence: 78, price: 15.67, change24h: -5.43 },
          { symbol: 'BNBUSDT', action: 'STRONG BUY', confidence: 82, price: 312.45, change24h: 3.12 },
          { symbol: 'XRPUSDT', action: 'BUY', confidence: 65, price: 0.6234, change24h: 0.89 },
          { symbol: 'SOLUSDT', action: 'HOLD', confidence: 52, price: 98.76, change24h: -1.23 },
        ];
        
        setCoins(mockCoins);
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoins();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading PerfectBot...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">PerfectBot</h1>
          <p className="text-gray-400 text-center mt-2">
            800+ coins - 58 strategies - Real-time signals
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Advanced Crypto Trading Signals
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Leverage 58 sophisticated trading strategies with real-time market analysis, 
            AI-powered signals, and automated portfolio management.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/coins"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-white font-semibold transition-colors"
            >
              View All Coins
            </Link>
            <button className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg text-gray-300 font-semibold transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">58</div>
            <div className="text-gray-400">Trading Strategies</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">800+</div>
            <div className="text-gray-400">Coins Analyzed</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">24/7</div>
            <div className="text-gray-400">Real-time Monitoring</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">99.9%</div>
            <div className="text-gray-400">Uptime</div>
          </div>
        </div>

        {/* Featured Coins */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Featured Coins</h3>
            <Link 
              href="/coins"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coins.map((coin) => (
              <Link
                key={coin.symbol}
                href="/coins"  // Navigate to coins page
                className={`block border rounded-lg p-4 hover:scale-105 transition-transform ${
                  coin.action === 'STRONG BUY' ? 'border-green-500 bg-green-900/20' :
                  coin.action === 'BUY' ? 'border-blue-500 bg-blue-900/20' :
                  coin.action === 'HOLD' ? 'border-yellow-500 bg-yellow-900/20' :
                  'border-red-500 bg-red-900/20'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">{coin.symbol}</span>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    coin.action === 'STRONG BUY' ? 'bg-green-500 text-white' :
                    coin.action === 'BUY' ? 'bg-blue-500 text-white' :
                    coin.action === 'HOLD' ? 'bg-yellow-500 text-black' :
                    'bg-red-500 text-white'
                  }`}>
                    {coin.action}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-mono">${coin.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Change:</span>
                    <span className={coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="font-semibold">{coin.confidence}%</span>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-400 text-center">
                  Click for detailed 58-strategy analysis
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="text-blue-500 mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">58 Trading Strategies</h3>
            <p className="text-gray-400 text-sm">Comprehensive strategy library including technical, on-chain, and AI-based approaches</p>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="text-green-500 mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Real-time Analysis</h3>
            <p className="text-gray-400 text-sm">Live market data processing and signal generation across multiple timeframes</p>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="text-purple-500 mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Portfolio Management</h3>
            <p className="text-gray-400 text-sm">Advanced risk management and portfolio optimization tools</p>
          </div>
          
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="text-yellow-500 mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Customizable</h3>
            <p className="text-gray-400 text-sm">Fully configurable strategies and trading parameters</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 PerfectBot - Advanced Crypto Trading Signals</p>
          <p className="text-sm mt-2">Powered by 58 sophisticated trading algorithms</p>
        </div>
      </footer>
    </div>
  );
}