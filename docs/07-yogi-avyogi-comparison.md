# Deliverable 7 — Yogi / Avyogi Formulation Comparison

## Method A (supplied in brief) — rule `YOGI.A` v0.1 — status: UNVERIFIED (awaiting owner approval)
- Yogi Point `Y = (λ☉ + λ☽ + 93°20′) mod 360°`  (93°20′ = 93.3333…°)
- Yogi Nakshatra = nakshatra containing Y; index = floor(Y / 13°20′); Yogi Planet = Vimshottari lord of that nakshatra.
- Sahayogi (Duplicate Yogi) = lord of the **sign** containing Y (as per owner's convention).
- Avyogi Point `A = (Y + 186°40′) mod 360°`; 186°40′ = 186.6667° = 14 × 13°20′ exactly.
- Avyogi Planet = nakshatra lord of the nakshatra containing A.

### Arithmetic observations (for owner review, not decisions)
1. 93°20′ = 7 × 13°20′. So the formula adds 7 nakshatras to (Sun+Moon).
2. 186°40′ = 14 × 13°20′, so Avyogi nakshatra = Yogi nakshatra + 14. Because 27 ≡ 0 modulo cycle and the Vimshottari lord sequence has period 9, +14 nakshatras shifts the lord by 14 mod 9 = 5 places in the Vimshottari lord order.
3. Some popular sources are reported to define Avayogi as the lord of the 6th nakshatra from the Yogi nakshatra (+5 nakshatras). This is NOT verified here and must be checked against a primary text. Arithmetic only: because the Vimshottari lord sequence repeats every 9 nakshatras, +14 and +5 both shift the lord by 5 places (14 mod 9 = 5). So Method A and a "+5" rule would give the **same Avyogi planet** but a **different Avyogi point, nakshatra and pada**. The owner should decide whether the point/nakshatra or only the planet is the intended output.
4. Sun+Moon sum can reach 720°; always reduce mod 360 **after** adding the constant.
5. Edge: Y exactly on a nakshatra/sign boundary — define tie-rule (start-inclusive, end-exclusive proposed).

## Method B — rule `YOGI.B` — status: UNVERIFIED — NOT ENABLED FOR PRODUCTION
Not defined. No formula will be invented. Owner to supply: source text, edition, verse/page, exact math (Yogi, Sahayogi, Avyogi), tie rules.

## Comparison table (to complete after owner input)
| Aspect | Method A | Method B |
|---|---|---|
| Yogi point | (☉+☽+93°20′) mod 360 | ? |
| Yogi planet | nakshatra lord at point | ? |
| Sahayogi | sign lord at point | ? |
| Avyogi point | Y + 186°40′ | ? |
| Avyogi planet | nakshatra lord at A | ? |
| Source | owner brief (text ref TBD) | ? |
| Sidereal/ayanamsha dependence | yes (Nirayana inputs) | ? |
| Status | UNVERIFIED | UNVERIFIED |

## Test vectors to prepare (JHora-independent, pure arithmetic — usable for Layer B unit tests once approved)
- ☉=0°, ☽=0° → Y=93°20′ (Cancer 3°20′).
- ☉+☽ = 266°40′ → Y=0° (wrap).
- Y on 13°20′ multiples (boundary).
- A computation when Y+186°40′ ≥ 360°.
Expected values to be computed by hand by owner or reviewer and confirmed against JHora (JHora's Yogi display, if available) before use.

## Verification against DAGDHA RASHI.docx (2026-11-07)
The docx (YOGI AND AVYOGI section) states all of these together:
1. Yogi point = Sun + Moon sidereal (+ 93°20′ in the worked example); Yogi planet = lord of that nakshatra.
2. Avyogi planet = lord of the nakshatra six ahead of the Yogi nakshatra, counting Yogi as first (+5 nakshatras).
3. Avyogi point = Yogi point + 186°40′ (= 14 nakshatras), and "equivalent to the sixth planet in the Vimshottari sequence".
Statements 2 and 3 give the same planet but different nakshatras (+5 vs +14), exactly as flagged in section 3 above. The docx's own example uses +186°40′ (statement 3). Its ready-reference table (Sun→Saturn, Moon→Mercury, Mars→Ketu, Mercury→Mars, Jupiter→Sun, Venus→Jupiter, Saturn→Moon, Rahu→Venus, Ketu→Rahu) was checked by arithmetic and equals "Yogi planet + 5 places in Vimshottari order" for all nine planets, so it is consistent with both statements for the planet.
Source quality: the docx cites a secondary web page and a book (Light on Relationships, de Fouw & Svoboda) without verse or page. Q-16 (primary citation) stays open.

### Test vector from the docx (planet and point both usable)
| Step | Value |
|---|---|
| Sun | Libra 10°00′ = 190°00′ |
| Moon | Taurus 25°00′ = 55°00′ |
| Yogi point | (190 + 55 + 93°20′) mod 360 = 338°20′ = Pisces 8°20′ |
| Yogi nakshatra / planet | Uttara Bhadrapada (index 25) / Saturn |
| Sahayogi | Jupiter (Pisces lord) |
| Avyogi point | (338°20′ + 186°40′) mod 360 = 165°00′ = Virgo 15°00′ |
| Avyogi nakshatra / planet | Hasta (index 12) / Moon |
For comparison, a "+5 nakshatras" rule would give Rohini (index 3), also lord Moon. Owner to decide which output is shown (Q-18); the proposed default is the docx's formula result (Hasta) with the planet highlighted.