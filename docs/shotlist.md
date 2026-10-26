# Krafty Bot — "Real work" (20 s, 16:9 + 9:16)

Status: DRAFT (built on defaults while waiting on the user; changes welcome)

## Brand (measured from kraftybot.app, 2026-10-24)
| Token | Hex | Source |
|---|---|---|
| bg | #161615 | `--sidebar` dark theme, OG image backdrop |
| card | #202020 | `--frost` dark |
| ink | #faf4e6 | mascot cream, sampled from /icon.png |
| ink2 | #a6a6a6 | `--muted-foreground` dark |
| accent | #4cc79b | `badge[data-status=done]`, the "done/approved" green. The only accent. |

Fonts: botFont (`/_next/static/media/display-s…woff2`, variable 200–800) for display; the same file at 450–500 for UI, matching the site.
Logo: the cream blob mascot with two pill eyes (`/icon.png`), "Krafty" wordmark in botFont 700.

## Music
Original synth score, 120 BPM, 10 bars. Chords Am7 F C G. Muted, pulsing intro → full kit at the approval beat (bar 5) → swell into the end card. SFX: soft pops on bubbles, ticks on typing, a bright click on "Send email", a low thud on the logo.
No voiceover.

## Shots (beats at 120 BPM; 2 beats = 1 s)
| # | Beats / time | On screen (exact copy is from the site) | Motion | SFX |
|---|---|---|---|---|
| 1 | 0–4 · 0–2 s | **"Give AI real work."** left-aligned, huge. "real work" in green. The mascot slides in on the right, eyes blink on beat 3. | Words rise through a mask (heavy), word 1 already readable on frame 0. Mascot grows from 0.85. | pop per word |
| 2 | 4–8 · 2–4 s | Mascot collapses into the sidebar's avatar. The real agent list builds: Inbox Manager "sent. inbox at zero, 5 drafts parked for tomorrow.", Expense Manager "report filed. 9 receipts, nothing outstanding.", Talent Scout "3 intros drafted in your voice, held for your ok." | Rows card-rise one per beat, camera push 1.00→1.05. | soft pop per row |
| 3 | 8–12 · 4–6 s | Chat with **Sales Outbound**. User bubble types: "work the pipeline overnight: research the accounts, score the contacts, draft email and linkedin in my voice. nothing goes out without me." → chip **Created routine · Overnight outbound batch**. | Typewriter, chip grows out of the bubble (snappy). | typing ticks, chip pop |
| 4 | 12–16 · 6–8 s | Type card: **"They work while you sleep."** Clock flips 1:08 PM → 12:16 PM. Bot reply: "overnight batch ready: 36 queued in your voice, 4 skipped as recently touched. nothing sent." | Line rises, counter 0→36 on beats. | tick per count step |
| 5 | 16–22 · 8–11 s | Email card **"Three infra roles and a migration"** to dana@northwind.io. Cursor moves to **Send email**, clicks; badge turns green **Sent**. Type over: **"Nothing ships without your OK."** | Card rises with perspective settling 14°→3° (2D skew fallback), button press snappy, green badge pops. Kit drops in here. | click, whoosh-out |
| 6 | 22–28 · 11–14 s | **Launch team — "One brief. Four teammates."** Checklist ticks green one per beat: Research gathered · Brief drafted · Details checked · Ready for your review. | Checks pop on beats, list slides up as it fills. | 4 ticks |
| 7 | 28–34 · 14–17 s | **"A computer of their own."** Cloud computer window: banner "Sign in to your help desk. I'll draft the replies." then the Friday recap card (Visitors 2,840 · Signups 186 · Activation 72%) builds skeleton → content. | Window grows from the chat; numbers count up. | pops on each stat |
| 8 | 34–40 · 17–20 s | End card: mascot + **Krafty** wordmark. Sub line: "Start free. Give it something real to do." Then **kraftybot.app**. | Mascot drops in (playful, the one place overshoot is allowed), wordmark rises, eyes blink on the last beat. Held ≤ 2 s and never static. | low thud, final swell |

## 9:16 notes
Type stacks to 2–3 lines at 120 px, x = 72. UI cards scale to ~88 % width, centred vertically in the safe band (top 14 %, bottom 20 %, right 12 % clear). The end card stacks mascot above wordmark.
