# c06 · JEV decisions & evidence: index

Meta-prompt `mp-c06-v1` (META-PROMPT.md) · grounding in GROUNDING.md · all 10 validate against SCHEMA.json (sb60-v1). Mechanical checks passed for all 10: W1, W2, W10, G1 read time, N2, N3, N6, N7, N8, N10, S1.

| ID | Title | Repo | Hook (8 words) | Audience · Wada | Self |
|---|---|---|---|---|---|
| sb-06-01 | Hunches don't fit the slot. | manutej/jev | A "looks fine" card drops the ship lever. | Engineers · 166 | 0.72 |
| sb-06-02 | When unsure, the gate stays shut. | manutej/jev | Fog door swings open for a blank answer. | Leaders · 84 | 0.78 |
| sb-06-03 | Every step gets a tick. | manutej/jev-tape | Crash, restart, and the refund is paid twice. | Engineers · 279 | 0.80 |
| sb-06-04 | Doing waits behind the gate. | manutej/jev-tape | Asked for a draft, the AI sends it. | Leaders · 243 | 0.76 |
| sb-06-05 | Five small gates, not one. | manutej/JEV-works | One big "scam?" question, and the answer wobbles. | Researchers · 339 | 0.82 |
| sb-06-06 | First, check the ruler. | manutej/JEV-works | The score leaps, but the work never moved. | Learners · 207 | 0.74 |
| sb-06-07 | Coin flips go to a person. | manutej/jev-elder | A coin lands on its edge, money leaves. | Everyone · 296 | 0.80 |
| sb-06-08 | Leave the flag where it is. | manutej/jev-elder | The whale smooths over a gap. A pod trips. | Researchers · 84 | 0.70 |
| sb-06-09 | Every claim faces the same gates. | manutej/the-twenty-nesy | The whale is buried under papers stamped "reasoning". | Learners · 279 | 0.77 |
| sb-06-10 | Readers pass a one-way gate. | manutej/jev-tape-wiki | Leaning in to read, a fin bumps a lever. | Everyone · 166 | 0.71 |

Endings (all new): lever-waits-for-evidence · fog-door-stays-shut · one-coin-after-crash · envelope-waits-on-line · five-steady-lamps · level-bar-after-calibration · coin-caught-midair · flag-not-paddle · shelf-not-avalanche · fin-touches-glass.

## Two strongest
1. **sb-06-05 · Five small gates, not one.** It has the best real numbers in the cluster: 62.6% as one question becomes 95.1% as five small ones. Its CASE is honest because a plain two-line rule scored 91.8%, and its drawn limit is that empty input still scored 0.82–0.91. The problem ("one blurry question"), the move ("split it") and the callback (one wobbling ring becomes five steady lamps) all read sound-off.
2. **sb-06-03 · Every step gets a tick.** "The retry sent the refund twice" is a pain anyone in operations has felt. The move (resume from the last tick, pay last, once) is a single picture. The repo's own "0 duplicate applies" crash demo is the case, and the limit (a wrong answer is recorded perfectly too) stops it from overclaiming.

Runner-up: sb-06-07, coin flips (the most universal symbol, with the rule quoted verbatim from jev-elder).

## Not grounded
manutej/jev-domain and manutej/jev-threads are private, and Notion has no content page for either. No board uses them.
