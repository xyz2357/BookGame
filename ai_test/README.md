# AI Game Testing

Tools for AI agents to play 《底层书库》(The Underground Library) and provide feedback.

## Test Modes

Four modes control how much information the AI receives. All modes share the same action execution — the difference is only in what the AI sees.

| Mode | AI sees | Tests what |
|------|---------|-----------|
| `visual` | Screenshot only | Visual design clarity, layout, readability |
| `text` | Raw page text | Information architecture, UI self-explanation |
| `standard` | Text + classified button list | Narrative communication, strategic reasoning |
| `guided` | Text + buttons + next-step suggestion | Pure story/writing/emotional experience |

Set mode via environment variable `AI_MODE` (default: `standard`):

```bash
AI_MODE=visual npx playwright test ai-interactive --timeout 30000
AI_MODE=text npx playwright test ai-interactive --timeout 30000
npx playwright test ai-interactive --timeout 30000                  # standard (default)
AI_MODE=guided npx playwright test ai-interactive --timeout 30000
```

## How to Play (Interactive Mode)

1. Start with `ai_test/ai-actions.json` containing `[]`
2. Run: `npx playwright test ai-interactive --timeout 30000 2>&1`
3. Read the output — what you see depends on the mode
4. Decide your next action(s)
5. Append action(s) to the JSON array in `ai-actions.json`
6. Run again — ALL actions replay from scratch, you see the new state
7. Repeat until you reach an ending

### Action Format

```json
["click:开始游戏", "event", "book:画皮", "click:继续", "wait"]
```

| Format | Meaning |
|--------|---------|
| `"click:按钮文字"` | Click a button containing that text |
| `"event"` | Click the first event button |
| `"book:书名"` | Open inventory → select book by name → use it |
| `"wait"` | Capture state without acting |

## Autonomous LLM Player

Fully automated mode — an LLM reads game state each turn and decides what to do:

```bash
# PowerShell
$env:ANTHROPIC_API_KEY="sk-..."; npx playwright test ai-player --timeout 600000

# Bash
ANTHROPIC_API_KEY=sk-... npx playwright test ai-player --timeout 600000
```

To use a different LLM, modify the `askLLM()` function in `ai-player.spec.ts`.

## Blind Testing Rules

- **DO NOT read files under `src/`** — no peeking at game data, logic, or source code
- **Only read/write**: files in `ai_test/`
- **Only run**: `npx playwright test ai-interactive --timeout 30000 2>&1`
- Make all decisions from the game output alone — that's the whole point

## Writing Feedback

Save your experience report to `ai_test_feedback/`:

```
{ai_name}_{game_version}_{date}.md
```

Examples: `claude-opus_v1.0_2026-05-10.md`, `gpt-4o_v1.1_2026-06-01.md`

Include: first impressions, exploration notes, key moments, endings reached, scores (Writing / Game Design / Narrative / Emotional Impact / UI-UX, each /10), modification suggestions, wishlist.

## Prerequisites

```bash
npm install
npx playwright install chromium
```

## Files

| File | Purpose |
|------|---------|
| `ai-interactive.spec.ts` | Interactive replay driver (supports all 4 modes) |
| `ai-player.spec.ts` | Autonomous LLM player |
| `ai-actions.json` | Action list (input for interactive mode) |
| `walkthrough.json` | Guided mode step-by-step data |
| `lib/game-driver.ts` | Shared action execution + state capture |
