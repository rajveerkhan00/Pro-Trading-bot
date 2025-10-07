

import { NextResponse } from 'next/server';

// ✅ Define type to avoid `any`
interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

export async function GET() {
  try {
    // ✅ NO TRAILING SPACE after 'exchangeInfo'
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Binance API responded with status ${res.status}`);
    }

    const data = await res.json();

    const usdtSymbols = (data.symbols as BinanceSymbol[])
      .filter(s => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_')
      )
      .map(s => s.symbol)
      .sort()
      .slice(0, 850);

    return NextResponse.json(usdtSymbols);
  } catch (error) {
    console.error('Binance symbols fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load trading pairs' },
      { status: 500 }
    );
  }
}