import { NextResponse } from 'next/server';

interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbol[];
}

export async function GET() {
  try {
    // Public Binance endpoint — no API key needed
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error('Failed to fetch exchange info');
    }

    const data: BinanceExchangeInfo = await res.json();

    // Filter active USDT pairs
    const usdtSymbols = data.symbols
      .filter((s: BinanceSymbol) => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_') // exclude leveraged tokens like BTCUSD_PERP
      )
      .map((s: BinanceSymbol) => s.symbol)
      .sort()
      .slice(0, 850);

    return NextResponse.json(usdtSymbols);
  } catch (error) {
    console.error('Binance symbols error:', error);
    return NextResponse.json(
      { error: 'Failed to load symbols' },
      { status: 500 }
    );
  }
}