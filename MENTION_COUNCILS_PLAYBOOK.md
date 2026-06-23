# Mention-Market Councils — Master Playbook

*Single reference for how we research Kalshi "mention markets" and produce trade recommendations: the council architecture, the verification gates, the full rule library, corpus methodology, sizing, and the burn-case ledger that earned each rule.*

**Maintained alongside:** `data/mentions_speakers/_recommendations.md` (the live trade log), the per-speaker corpora under `data/mentions_speakers/*/`, the rules cache `data/mentions_kb/rules/`, and the memory files in `~/.claude/projects/-workspace/memory/`.

---

## 0. What these markets are

Kalshi **mention markets** (series like `KX...MENTION`) resolve **YES** if a **scoped speaker** says an **exact word/phrase** during a **defined event**, within rules:
- **Exact token only.** Plural & possessive count ("immigrant" → "immigrants/immigrant's"). Other tense inflections, hyphenated compounds, and synonyms do **NOT** ("optic" ≠ "optical"; "mutilation" ≠ "mutilate"; "terror" ≠ "terrorism").
- **Slash = either.** "Doge/Dogecoin" resolves on either token.
- **Scope** = who counts (e.g. earnings = *any company rep incl. the operator + Q&A*; an interview = the *guest only*, not the host).
- **Window** (for time-based markets like "what will Trump say this week").
- **Min-count** clauses ("said ≥N times; all instances after issuance").

Our job: estimate **P(scoped speaker says the exact token in-event)**, compare to the **live price on the side we'd actually buy**, and trade only where the edge is **overwhelming**. Default action on any market is **STAND DOWN**.

### Genres we cover
Earnings calls · politician interviews/speeches/hearings · Fed pressers · freestyle speakers (Trump etc.) · NYC mayor (Mamdani) · UFC (sports exception). Pure team-sports announcer markets are out of scope.

### Data source (public API)
`https://api.elections.kalshi.com/trade-api/v2/`
- `/series?category=Mentions` · `/events?series_ticker=X&status=open|settled` · `/markets?event_ticker=X`
- Per market: `custom_strike.Word`, `yes_ask_dollars`, `no_ask_dollars`, `last_price_dollars`, `volume`, `open_interest`, `result` (settled), `rules_primary`.
- Header `User-Agent: Mozilla/5.0`; throttle ~3-4s to avoid HTTP 429.

---

## 1. The council discipline (HARD RULE)

**Every fundable trade must clear a full multi-round council. Single-pass analysis is forbidden** — it is where every error has hidden (Salesforce, Owens, Gbitse; and this session: the single-pass sweep produced 9 false/overstated edges incl. its #1 pick).

### Round structure
| Round | Purpose |
|---|---|
| **R1 Research + Corpus + News + Booking + Length** | Pull book + `rules_primary`; build/load corpus; count exact tokens; per-word news-catalyst scan; confirm the speaker is appearing; estimate speaking-length/surface factor. |
| **R2 Synthesis** | Form candidate trades; P incorporates news + surface factor + remaining-window; edge on the **actual** ask. |
| **R3 Verification** | Independently re-fetch book, **re-count tokens from source**, **same-quarter recency** check, **Q&A-dependence** check, token-vs-topic, rules (inflection/scope/window). Verdict: stands / corrected / killed. |
| **R4 Adversarial** | Bull + bear run in parallel; bear tries to kill every surviving trade. |
| **R5 Reconciliation** | Keep only trades that survive the bear on merits; apply R3 haircuts; size. |
| **R6 Skeptic** | For each survivor, argue *why the market is right and we're wrong*; check directly; verdict holds / market-may-be-right / kill. |

Implemented as a `Workflow` pipeline (see `…/workflows/scripts/councils-v2-news-corpus-skeptic-*.js`). Schemas force structured output per round. Pipeline (not barrier) by default so each dimension verifies as soon as its research lands.

---

## 2. THE FOOLPROOF GATE — 9 ordered checks (per trade, before sizing)

Councils over-label things "structural." **A direct source check has reversed the call every time it was run.** Run this as R3 + R6 of every council. (Memory: `feedback_mention_trade_verification_protocol`.)

1. **RULES** — fetch + digest `rules_primary` (cache: `data/mentions_kb/rules/`). Window · scope · inflection · slash · min-count. ⟶ *burn: the "50,000" window.*
2. **SETTLEMENT-FIRST** — prior settled-market `result` rates **>** corpus file-frequency. ⟶ *burn: Mamdani "New Era" settled 12% vs corpus 43%; "Economy" 47% vs 71%.*
3. **TOKEN-COUNT, DIRECT + RECENCY** — re-fetch transcripts, count the **exact** token call-by-call; **weight the same-quarter comparable highest** (seasonality). A word on recent calls but **zero on the comparable quarter** is not structural for that quarter. ⟶ *burn: CRWD "tailwind" 0/1/3 across FY26, comparable Q1 = 0; "optic" was "optical".*
4. **NEWS-CATALYST GATE** — WebSearch `entity + word + period` for a current catalyst. A structural-**absence** NO is invalid if a recent announcement made the word live. ⟶ *burn: Ulta–Google **Gemini** partnership (Apr 22) flipped a +47 NO into a trap.*
5. **TOKEN-VS-TOPIC** — topic salient ≠ exact token spoken. Will they say the literal word or a synonym? ⟶ *burn: VSCO "pressure" not "headwind"; "symbol" not "ticker"; Trump Epstein lawsuit ≠ Trump saying "Epstein".*
6. **Q&A-DEPENDENCE** — is the word management-**volunteered** (prepared remarks) or only **analyst-prompted**? Q&A-dependent = lower, uncontrollable P. ⟶ *burn: CRWD "tailwind" both hits were analyst-prompted.*
7. **TIME-WINDOW / REMAINING-WINDOW** — condition base rate on the **remaining** window, not the full period; if most elapsed with no in-window hit, discount hard (price already reflects it). ⟶ *burn: 50,000 / Epstein / Bibi full-period rates on near-closed windows.*
   - **7b. SPEAKING-LENGTH / SURFACE** — estimate the scoped speaker's **own airtime** (earnings remarks+Q&A ~45-70min = big surface; interview/profile ~6-15min; a 2-min hit is tiny). Short event → discount marginal/topical words (surface_factor < 1.0); long → lift (~1.1). Signature/volunteered words are length-insensitive; narrow topical words are length-sensitive. ⟶ *Powell JFK ~12min supports "President"; Hassett FNS ~10min economy-segment supports signature AI/Warsh.*
8. **SKEPTIC / MARKET-SELECTION-GATE** — argue why the market is right. A large edge on a **liquid** market is a model/data error, not alpha — stand down or find the flaw. ⟶ *burn: Bibi +20 on a commons word was an artifact.*
9. **VIG / LIQUIDITY** — edge on the **actual side bought** (NO ask, not 100−yes); near-locks at >80-90¢ are vig-killed; verify volume/OI; on wide thin pre-event books **rest near LAST, don't lift the ask**. ⟶ *burn: most P≥0.90 "near-locks" vig-killed.*

---

## 3. THE OVERWHELMING-ODDS FILTER (final gate on top of the 9 checks)

Even a trade that passes the 9 checks is **not funded** unless it clears all 5 of these. **Most events = ZERO trades, and that is the correct answer.** (Memory: `feedback_overwhelming_odds_filter`.)

1. **Exact-token, not topic** — verified habit of *this* word, with **no more-natural synonym competing**.
2. **Provenance ≥ structural** — settlement ≥90% on comparable events, OR transcript-confirmed *every* recent comparable, OR clip-locked by the scoped speaker. Topic-salience / news-catalyst alone is insufficient.
3. **Edge ≥ 15¢ on the actual side AND entry ≤ 90¢** — skip vig-killed near-locks.
4. **Survives the skeptic** — no live failure mode when arguing the market's side.
5. **No conflicting precedent** — one comparable yes + another no = not overwhelming.

> The hard truth: overwhelming-odds words are usually priced 85-100 (vig-killed before you can profit), and cheap words carry synonym-substitution risk. The intersection (overwhelming **and** real edge **and** ≤90¢) is **rare** — a few per week, mostly **settlement-backed structural words** (e.g. Mamdani Five Borough 100% 6/6). Fire on those; stand down on everything else.

*Burn that created this filter (May 30):* four token-vs-topic "small leans" on Lara Trump (Gold/Hottest/Ceasefire/250) **all settled NO, −$59.** He said "greatest"/"deal," not the tokens. Correct play was zero trades.

---

## 4. The rule library

### 4.1 Resolution & rules-reading
- **Rules-first** (Memory: `feedback_rules_first_council`): download + save + digest `rules_primary` for **every** market before councils. Cache to `data/mentions_kb/rules/<event>.json` + rebuild `DIGEST.md`.
- **Inflection:** plurals/possessives only; tense/hyphen/synonym excluded.
- **Slash:** either token satisfies.
- **Scope** (Memory: `feedback_speaker_scope`, `feedback_speaker_scope_default`): parse **WHO** says the word before any probability work. GUEST-ONLY is the hard default for person-mention interviews; the host/interviewer saying it does **not** count. Multi-speaker compounding banned unless proven.

### 4.2 Provenance hierarchy (what P is allowed to rest on)
**Settlement ≥90% ≈ transcript-every-call ≈ clip-locked-by-speaker > news-catalyst > priors-only.**
- **Settlement-first** beats corpus file-frequency, always.
- **Clip-locked**: if the scoped speaker is shown saying the exact token in a *released clip of the same event*, it's near-locked. (Caution: a clip from a *separate* event does NOT count — the "gold leaf" Lara misattribution.)
- **Clip-absence ≠ word-absence:** a 3-min clip of a 45-min interview proves nothing about the rest — fall back to prior (Rule 32 vocabulary-breadth).

### 4.3 Pricing & liquidity reading (Memory: `feedback_mention_price_liquidity`, `feedback_no_side_live_pricing`)
- Compare base rate to **last_price**, not the (often wide MM) ask.
- Compute **NO** edges against the actual NO ask, not (100 − YES) — overround kills NO edges in thin books.
- Read the **order-book depth** before deciding take-vs-rest: if there are no sellers between bid and ask, a deep resting bid won't fill — take the cheap offers up to the next wall (the Warsh-depth lesson).
- Verify volume/OI before calling a market dead or tradeable.

### 4.4 Corpus & recency
- **Token-count beats theme-intuition** (Memory: `reference_earnings_transcript_source`): Broadcom "Optic" +54 was a mirage (says "optical"); the real edges come from literal call-by-call counts.
- **Same-quarter recency** (R3, check #3): weight the year-ago comparable quarter highest.
- **Remaining-window** (check #7): condition time-windowed markets on time left.
- **Regime stability** (Memory: `feedback_regime_stability`): base rates assume a stable world — detect exec changes / catalyst paths before trusting frequency. (E.g. WWDC26 = Cook's *farewell* keynote → "exec-delivered NO" bets flip wrong-sided; Ternus → CEO Sep 1 2026.)

### 4.5 The numbered council-spec rules (v2.7 overlay, Rules 0 & 32-42)
These live in the CLI council scripts; the trading logic applies them regardless of implementation.
- **Rule 0** — market-selection gate: stand down on liquid/tight markets.
- **Rule 32** — vocabulary-breadth asymmetry: "NOT SAID on a prior call/clip" is **not** a valid NO basis for content-rich events; NO bets need structural-domain absence or ≥3-event confirmed absence.
- **Rule 33** — longshot-YES evidence gate: YES at 20-35¢ claiming >+25¢ edge needs TRANSCRIPT/STRUCTURAL provenance + ≥3 exact-token prior uses; topic-proximity is insufficient.
- **Rule 34** — freestyle-speaker format override: Trump/Sanders/RFK/MTG/Carlson/Rogan/Musk get rally-class vocabulary breadth in any podium format.
- **Rule 35** — conditional dead-zone gate: estimate `event_yes_base_rate`; if >0.65, the YES 70-79¢ BAN lifts (that band only).
- **Rule 36** — freestyle per-word **size cap** by evidence tier: HARD max $30 @≤70¢ · MIXED max $10 @≤30¢ · SOFT max $3 @≤15¢. (*Bernie YES at 30-70¢ lost $280 in a week oversized.*)
- **Rule 37** — macro-topic ∩ speaker-lane gate: NO bets >25¢ where token ∈ (macro top-3 ∩ speaker lane) are HARD REFUSED; macro-only NO capped at $5.
- **Rule 38** — tiered take-profit limit-sells: SPEC-sleeve (entry 15-64¢, NEWS_CATALYST/MACRO) get a pre-placed limit-sell at entry+offset (15-29→+22, 30-54→+15, 55-64→+12); CORE + entry ≥65¢ HOLD to settlement.
- **Rule 39** — intra-event entry doctrine: (a) **no dip-bidding** — intra-event dips are *informational*, post-dip YES-rate collapses (−8% to −35% ROI); pre-event sag bids only. (b) momentum-buy a rising lotto only with ≥2-min sustain in the 35-45¢ band + a mandatory Rule 38 limit-sell.
- **Rule 40** — NEWS_CATALYST boost cap: catalyst boosts capped at +15pp above the interview base rate. (*Muslim/Islam 22%→55% claimed, settled NO.*)
- **Rule 41** — corpus-frequency floor: words with ≥10 mentions in ≥15% of files get a min $5 SPEC position.
- **Rule 42** — same-day announcement discount: same-day announcements capped at 75% P(YES) for TV mentions.

Other standing spec rules: Rule 2 token-reliability `P(word)=P(topic)×P(token|topic)` · Rule 14 upstream-catalyst timing (independent vs conditional words) · Rule 15 vig-asymmetry/tradeable-side · multi-speaker compounding `P=1−(1−p)^n` (only when scope proven).

### 4.6 Recent-news gate (Memory: `feedback_recent_news_gate`)
Before finalizing ANY trade, WebSearch each word for a current-quarter/in-window catalyst. **NO bets are the danger zone** — a fresh catalyst flips structural-absence into near-certain YES. YES bets are usually *confirmed* by a catalyst (VSCO "headwind" guidance; Ulta "Target" shop-in-shop wind-down).

### 4.7 Booking confirmation (R1, for speech/interview/appearance markets)
Confirm the scoped speaker is **actually appearing** — check the show's official guest page, the speaker's site/social, lineup roundups. Set `confirmed/likely/unconfirmed/not-appearing` + source + note the **segment/topic** (shifts which words are in-scope). If unconfirmed → do not fund. (*Hassett scare: appeared on ABC; verified he was also on the FNS economy segment → AI/Warsh strengthened.*)

---

## 5. Corpus collection methodology

**Cost policy:** use Claude Code's own LLM + WebSearch/WebFetch. Do **not** call external Gemini/OpenAI/Perplexity APIs. (Memory: `feedback_use_claude_code_resources`.)

| Genre | Free source (server-side) | Method |
|---|---|---|
| **Earnings** | Motley Fool `fool.com/earnings/call-transcripts/...` (full text, WebFetch) | Count exact token call-by-call across last 2-3 quarters + the year-ago **same quarter**. |
| **Trump / freestyle** | `trumpstruth.org/feed` (Truth Social mirror) + WebSearch dated statements | Last-posted recency per token; in-window check. (truthbrush/x.com are Cloudflare-blocked from datacenter IPs.) |
| **Politicians / Fed** | WebSearch transcripts + official speeches/testimony (Rev, Factba.se, agency sites) | Separate **format-structural** words (every presser/keynote) from **personal** vocab. |
| **Mamdani** | NYC.gov transcripts + Kalshi **settlement** archive (95 events) | Settlement rates are authoritative; corpus is secondary. |
| **Video (YouTube/Fox clips)** | ⚠️ captions Cloudflare-blocked from this server | Needs a residential-IP pull (user drops transcripts into `docs-inbox/<speaker>/`; daemon ingests). |

Save each speaker corpus to `data/mentions_speakers/<speaker>/CORPUS.md` with: source list (URLs), verbatim quotes by theme (provenance-tagged), and a token-habit table (`word | literal-token? | freq | synonym-risk | prior P`).

**Build the corpus FIRST**, before the council reasons — councils that reason from inline guesses miss substitution traps (the Pence "Israel" correction).

---

## 6. Sizing, sleeves & exits

- **Sleeves:** CORE (structural/settlement, entry ≥65¢) → hold to settlement. SPEC (15-64¢, news/macro provenance) → Rule 38 take-profit limit-sell.
- **Freestyle size cap:** Rule 36 tiers by evidence (HARD/MIXED/SOFT).
- **Sizing heuristic:** edge × confidence, then capped for thin books & vig. Anchor to a stated budget; scale linearly.
- **Entry mechanics:** tight spread → take. Wide thin pre-event book → **rest near LAST** (capture the spread; fills on the pre-event sag). Never lift a wide ask on a near-lock. No dip-bidding intra-window (Rule 39).
- **Don't average down.** A position down 78% with a closing window is not a discount — the price fell because P fell. (TDS @6 was a write-off, not a buy.)

---

## 7. Monitoring & automation (runs without a Claude session)

Daemon loop (`scripts/mention_scanner_daemon.sh`, flock single-instance, 300s) runs:
1. `mention_scanner.py` — scans Mentions series, classifies new markets (political/ufc/earnings/other; sports excluded), queues councils, alerts.
2. `rules_fetch.py` — caches `rules_primary` + rebuilds `DIGEST.md` for every new market (so nothing is councilled rules-blind).
3. `edgar_release_watcher.py` — polls SEC for the earnings 8-K (item 2.02); when the press release drops (25-90 min pre-call), scans it for slate tokens and pings Telegram (a token in the release ≈ locks the YES for the call).
4. `trumpstruth_monitor.py` — flags grievance/market words in new Trump posts.
5. `nyc_mayor_watcher.py` — pings new @NYCMayorsOffice livestream (= the Mamdani announcement topic).
6. `inbox_ingest.py` — ingests social/transcript drops in `docs-inbox/`.

Telegram alerts via `notify.py` (creds in `~/.config/truthmon/telegram.env`, 600).

---

## 8. Burn-case ledger (every rule was paid for)

| Date | Trade | What happened | Rule it created/validated |
|---|---|---|---|
| (prior) | Mamdani "New Era" | Corpus 43% vs settlement 12% | Settlement-first (#2) |
| (prior) | "Mr Beast" | Said 6× but settled Beast=NO | Token-edge settlement check |
| May 30 | Broadcom "Optic" +54 (#1 pick) | Says "optical" (excluded inflection) | Token-count / inflection (#3) |
| May 30 | Ulta Google/**Gemini** NO +47 (#1 pick) | Apr 22 Gemini partnership made it live | News-catalyst gate (#4) |
| May 30 | CRWD "Tailwind" +36 | Comparable Q1 = 0; analyst-prompted | Same-quarter recency + Q&A-dependence (#3, #6) |
| May 30 | Trump "Bibi" +20/+56 | Commons word on a liquid market | Market-selection / skeptic (#8) |
| May 30 | Trump "Epstein" +74 | Lawsuit ≠ Trump saying the token | Token-vs-topic + remaining-window (#5, #7) |
| May 30 | LULU "Chip/Wilson" +34 | Needs a rep not analyst; "Chip" was a director | Scope + verify recount |
| May 30 | **Lara Trump** Gold/Hottest/Ceasefire/250 (4 leans) | All settled NO, −$59; said "greatest"/"deal" | **Overwhelming-odds filter** (§3) |
| May 31 | WWDC "Privacy" YES @33 | It's Federighi's word, not Cook's | Scope + regime (farewell keynote) |
| May 31 | Pence "Israel" +23 → fair | Topic-arrival caps it; corpus-light overstated it | Corpus-first + speaking-length (§5, #7b) |

**Meta-lesson:** the single-pass sweep produced **9 false/overstated edges including its #1 pick**; the full council + adversarial + skeptic caught all of them. Breadth-first triage is fine; **no trade is fundable until it clears all rounds + the filter.**

---

## 9. Output & where things live

- **Live trade log:** `data/mentions_speakers/_recommendations.md` (slate tables, sizing, settlement P&L, lessons). Mark superseded slates explicitly.
- **Per-speaker corpora:** `data/mentions_speakers/<speaker>/CORPUS.md` + events/.
- **Rules cache:** `data/mentions_kb/rules/*.json` + `DIGEST.md`.
- **News catalysts:** `data/mentions_kb/news/`.
- **Council workflow scripts:** `…/workflows/scripts/councils-v2-news-corpus-skeptic-*.js` (resume-able via `resumeFromRunId`).
- **Memory index:** `~/.claude/projects/-workspace/memory/MEMORY.md` (one-line pointers to every rule file).

### The one-paragraph summary
Read the rules → build the corpus → settlement-first, count exact tokens with same-quarter recency → news-gate every word (especially NOs) → run 6 rounds incl. a skeptic that argues the market is right → price the edge on the **actual side** against **last**, not the ask → then apply the **overwhelming-odds filter**, which says **stand down** on almost everything. Fire only on the rare word that is exact-token, structurally/settlement-backed, ≥15¢ edge at ≤90¢, survives the skeptic, and has no conflicting precedent — most often a settlement-locked structural word like Mamdani "Five Borough."
