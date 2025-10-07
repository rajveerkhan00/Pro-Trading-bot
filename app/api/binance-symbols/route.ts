import { NextResponse } from 'next/server';

// ✅ Define the expected shape of a Binance symbol
interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

export async function GET() {
  try {
    // ✅ Remove trailing space in URL (critical fix!)
    const res = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) {
      throw new Error('Failed to fetch exchange info');
    }
    const data = await res.json();

    // ✅ Use proper type instead of `any`
    const usdtSymbols = (data.symbols as BinanceSymbol[])
      .filter(s => 
        s.status === 'TRADING' && 
        s.quoteAsset === 'USDT' &&
        !s.symbol.includes('_') // exclude leveraged tokens
      )
      .map(s => s.symbol)
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