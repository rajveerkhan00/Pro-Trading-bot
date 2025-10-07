'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TradingStrategies } from '@/types/index';

interface PriceData {
  current: number;
  change: number;
  high: number;
  low: number;
}

interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}

interface ConsensusSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  duration: string;
  leverage: number;
  reason: string;
  stopLoss?: number;
  takeProfit?: number;
}

export default function CoinPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [consensus, setConsensus] = useState<ConsensusSignal | null>(null);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`
        );
        const klines: string[][] = await res.json();

        const prices = klines.map(k => parseFloat(k[4]));
        const high = klines.map(k => parseFloat(k[2]));
        const low = klines.map(k => parseFloat(k[3]));

        const currentPrice = prices[prices.length - 1];
        const priceChange = ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;

        setPriceData({
          current: currentPrice,
          change: priceChange,
          high: Math.max(...high),
          low: Math.min(...low)
        });

        const allSignals = TradingStrategies.getAllSignals(prices, high, low, symbol);
        const consensusSignal = TradingStrategies.getConsensusSignal(prices, high, low, symbol);

        setSignals(allSignals);
        setConsensus(consensusSignal);
      } catch (err) {
        console.error('Failed to load coin ', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      init();
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading {symbol} analysis...</div>
      </div>
    );
  }

  const buyStrategies = signals.filter(s => s.action === 'BUY');
  const sellStrategies = signals.filter(s => s.action === 'SELL');
  const holdStrategies = signals.filter(s => s.action === 'HOLD');

  // ✅ Removed unused `holdCount`
  const getActionLevel = (buyCount: number, sellCount: number) => {
    const totalActive = buyCount + sellCount;
    if (totalActive === 0) return 'HOLD';
    const buyRatio = buyCount / totalActive;
    const sellRatio = sellCount / totalActive;
    if (buyRatio >= 0.7) return 'STRONG BUY';
    if (buyRatio >= 0.6) return 'BUY';
    if (sellRatio >= 0.7) return 'STRONG SELL';
    if (sellRatio >= 0.6) return 'SELL';
    return 'HOLD';
  };

  const actionLevel = getActionLevel(buyStrategies.length, sellStrategies.length);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-400 hover:text-blue-300">
                ← Back to All Coins
              </Link>
              <h1 className="text-2xl font-bold">{symbol} Analysis</h1>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold ${
              actionLevel === 'STRONG BUY' ? 'bg-green-500 text-white' :
              actionLevel === 'BUY' ? 'bg-blue-500 text-white' :
              actionLevel === 'HOLD' ? 'bg-yellow-500 text-black' :
              actionLevel === 'SELL' ? 'bg-orange-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {actionLevel}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {priceData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">${priceData.current.toFixed(4)}</div>
              <div className={`text-sm ${priceData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold">High</div>
              <div className="text-green-400">${priceData.high.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold">Low</div>
              <div className="text-red-400">${priceData.low.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold">Strategies</div>
              <div className="text-white">{signals.length}/58</div>
            </div>
          </div>
        )}

        {consensus && (
          <div className={`p-6 rounded-lg mb-6 ${
            consensus.action === 'BUY' ? 'bg-green-900/30 border-l-4 border-green-500' :
            consensus.action === 'SELL' ? 'bg-red-900/30 border-l-4 border-red-500' :
            'bg-yellow-900/30 border-l-4 border-yellow-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Consensus Signal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <strong>Action:</strong>
                <div className={`mt-1 px-3 py-1 rounded text-sm font-bold inline-block ${
                  consensus.action === 'BUY' ? 'bg-green-500 text-white' :
                  consensus.action === 'SELL' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-black'
                }`}>
                  {consensus.action}
                </div>
              </div>
              <div>
                <strong>Confidence:</strong>
                <div className="mt-1 text-lg font-bold">{(consensus.confidence * 100).toFixed(1)}%</div>
              </div>
              <div>
                <strong>Duration:</strong>
                <div className="mt-1">{consensus.duration}</div>
              </div>
              <div>
                <strong>Leverage:</strong>
                <div className="mt-1">{consensus.leverage}x</div>
              </div>
            </div>
            <div className="mt-4">
              <strong>Reason:</strong>
              <p className="mt-1 text-gray-300">{consensus.reason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">BUY Signals</h3>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                {buyStrategies.length}
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {buyStrategies.map((signal, idx) => (
                <div key={idx} className="bg-green-900/30 p-2 rounded text-sm">
                  <div className="font-medium">{TradingStrategies.getAllStrategyNames()[signals.indexOf(signal)]}</div>
                  <div className="text-green-300 text-xs">
                    Confidence: {(signal.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-400">SELL Signals</h3>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                {sellStrategies.length}
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sellStrategies.map((signal, idx) => (
                <div key={idx} className="bg-red-900/30 p-2 rounded text-sm">
                  <div className="font-medium">{TradingStrategies.getAllStrategyNames()[signals.indexOf(signal)]}</div>
                  <div className="text-red-300 text-xs">
                    Confidence: {(signal.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-400">HOLD Signals</h3>
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
                {holdStrategies.length}
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {holdStrategies.map((signal, idx) => (
                <div key={idx} className="bg-yellow-900/30 p-2 rounded text-sm">
                  <div className="font-medium">{TradingStrategies.getAllStrategyNames()[signals.indexOf(signal)]}</div>
                  <div className="text-yellow-300 text-xs">
                    Confidence: {(signal.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Trading Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Position Sizing</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Recommended Leverage:</span>
                  <span className="font-bold">{consensus?.leverage || 1}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Stop Loss:</span>
                  <span className="text-red-400">${consensus?.stopLoss?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Take Profit:</span>
                  <span className="text-green-400">${consensus?.takeProfit?.toFixed(4) || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Risk Management</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Risk/Reward Ratio:</span>
                  <span className="font-bold">1:2</span>
                </div>
                <div className="flex justify-between">
                  <span>Recommended Duration:</span>
                  <span>{consensus?.duration || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signal Strength:</span>
                  <span className="font-bold">{buyStrategies.length + sellStrategies.length}/58 active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}