// Dip-reversion BTC bot for make.fun btc-race-24h-20261123-0511.
//
// Strategy, tuned on this competition's dev window (1,440 one-minute bars
// of CBBTC, which rose about 364 bps overall with several sharp intraday
// dips): buy a dip of at least 100 bps below the trailing 60-bar high, then
// exit on a +300 bps take-profit, a -250 bps stop, or a 720-bar stale exit.
// One full-size round trip costs about 26 bps in fees, slippage and impact,
// so the entry needs a dip deep enough and the exit a gain wide enough to
// clear that cost with room to spare. Fewer, higher-quality trades beat
// many marginal ones, so the bot holds at most one position and never
// re-enters while flat bars suggest the feed has stalled.
//
// All decisions use only bar closes and fills from the replay protocol.
// No randomness, no wall clock, no network: fully deterministic.

import { runBars, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const MAX_SLIPPAGE_BPS = 300;
const HIGH_WINDOW = 60;
const DIP_BPS = 100;
const TAKE_PROFIT_BPS = 300;
const STOP_LOSS_BPS = 250;
const STALE_BARS = 720;
const FLAT_GUARD_BARS = 30;

const closes: bigint[] = [];
let flatRun = 0;
let entryPrice: bigint | null = null;
let heldBars = 0;

function dipBps(close: bigint, high: bigint): bigint {
  return ((high - close) * 10000n) / high;
}

function retBps(close: bigint, entry: bigint): bigint {
  return ((close - entry) * 10000n) / entry;
}

await runBars({
  onBatch(state, batch) {
    if (state.warmingUp) return [];
    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar === undefined) return [];

    const close = BigInt(bar.c);
    closes.push(close);
    if (closes.length > HIGH_WINDOW) closes.shift();

    if (bar.o === bar.h && bar.h === bar.l && bar.l === bar.c) {
      flatRun += 1;
    } else {
      flatRun = 0;
    }

    // Record fills: a buy fill sets the entry price, a sell fill clears it.
    for (const fill of batch.fills) {
      if (fill.symbol !== SYMBOL || fill.status !== 'filled') continue;
      if (fill.side === 'buy') {
        entryPrice = BigInt(fill.price);
        heldBars = 0;
      } else {
        entryPrice = null;
        heldBars = 0;
      }
    }

    const position = state.positions.get(SYMBOL);
    const qty = position?.qty ?? 0n;

    if (qty > 0n && entryPrice !== null) {
      heldBars += 1;
      const ret = retBps(close, entryPrice);
      if (ret >= BigInt(TAKE_PROFIT_BPS) || ret <= -BigInt(STOP_LOSS_BPS) || heldBars >= STALE_BARS) {
        const order: SellInput = { side: 'sell', symbol: SYMBOL, qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        return [order];
      }
      return [];
    }

    if (qty > 0n) return [];
    if (closes.length < HIGH_WINDOW) return [];
    if (flatRun >= FLAT_GUARD_BARS) return [];

    let high = closes[0]!;
    for (const c of closes) if (c > high) high = c;
    if (dipBps(close, high) < BigInt(DIP_BPS)) return [];

    const cash = state.cash;
    if (cash <= 0n) return [];
    const order: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
    return [order];
  },
});
