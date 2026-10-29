# SDD ledger — plan: docs/superpowers/plans/2026-10-29-sibaq26-hub.md

## Pre-flight interface scan
- Task 2 → Task 3: Program model produces `askedQuestionRegistry`, `candidates[]` — seeder writes directly. OK.
- Task 3 → Task 4: `/api/programs` GET returns IProgram[] — dashboard consumes. OK.
- Task 5 → Task 6: `generateQuiz(params)` produced by ai-engine.ts; api/ai/generate consumes. OK.
- Task 6 → Task 7: `POST /api/ai/generate` produces Quiz/flashcards; Program Hub consumes. OK.
- Task 8 → Task 9: `playCorrectSound()`, `playWrongSound()`, `playFinishFanfare()` produced; quiz engine consumes. OK.
- Task 5 → Task 10: `searchLiveWeb()`, `generateWithNvidia()`, `generateWithOrca()` produced; chat api consumes. OK.

Ruling: create-next-app@14 uses `/app` at root (not `/src/app`). Plan says `src/app`; scaffold puts code under `app/` at project root. We will keep the flat structure and adjust all import paths accordingly — cost if wrong: minor path adjustments.

## Task progress
