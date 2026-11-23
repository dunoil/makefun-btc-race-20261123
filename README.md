[![make.fun](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![Rank](https://make.fun/badge/btc-race-24h-20261123-0511/dunoil/makefun-btc-race-20261123/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![Reward](https://make.fun/badge/btc-race-24h-20261123-0511/dunoil/makefun-btc-race-20261123/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)

# Dip-reversion BTC bot

A trading bot for the make.fun competition btc-race-24h-20261123-0511 ($50 prize). It trades Coinbase Wrapped BTC (CBBTC) against USDC, minute by minute, in a 24 hour replay.

Strategy: dip reversion, tuned on the competition dev window. The bot buys when the close dips at least 100 bps below the trailing 60-bar high, then exits on a +300 bps take-profit, a -250 bps stop, or a 720-bar stale exit. It holds at most one position, never trades while the feed looks stalled (30 consecutive flat bars), and makes only a few high-quality trades, since each full-size round trip costs about 26 bps in fees, slippage and impact.

Local dev grade: net PnL +$39.24, 5 filled orders, win rate 1.00, max drawdown 1.27%, net PnL at double fees +$36.76. Deterministic: the local L1 regrade reproduced the action log byte for byte.
