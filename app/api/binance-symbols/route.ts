import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // ✅ NO TRAILING SPACE in the URL
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) {
      throw new Error('Failed to fetch exchange info');
    }
    const data = await res.json();
    // Filter active USDT pairs
    const usdtSymbols = data.symbols
      .filter((s: any) => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_') // exclude leveraged tokens
      )
      .map((s: any) => s.symbol)
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