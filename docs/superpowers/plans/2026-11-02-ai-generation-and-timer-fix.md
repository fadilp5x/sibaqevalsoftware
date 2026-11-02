# AI Generation, PDF Parser, Timer, and Background Task Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely eliminate AI generation failures (`Unexpected end of JSON input`), resolve OrcaRouter 429/402 issues by prioritizing high-speed NVIDIA Nemotron (8192 tokens + auto-repairing JSON parser), fix PDF/text file parsing with pdf-parse v2 compatibility, fix frozen timers across modal and quiz taker using timestamp-based tracking, add a persistent Duolingo-style Bottom Generation Task Dock/Pill with background progress monitoring, and clear all manifest/AudioContext console errors.

---

## 1. Root Cause Summary & Architecture Decisions

| Issue | Root Cause | Architectural Fix |
| :--- | :--- | :--- |
| **"Unexpected end of JSON input" on 25Q / Arabic** | `max_tokens: 4096` caused truncation mid-JSON for 25 questions in Arabic (which require ~8,700 chars); `JSON.parse` crashed on partial string. Also unhandled 500/504 errors in route.ts return non-JSON. | 1. Increase `max_tokens` to `8192`.<br>2. Build `parseAndRepairJson()` in `lib/ai-engine.ts` to auto-close truncated arrays and salvage question objects with regex fallback.<br>3. Wrap `app/api/ai/generate/route.ts` in global try/catch returning `{ error }` JSON.<br>4. Safely parse `fetch()` in frontend to never crash on non-JSON. |
| **DeepSeek / OrcaRouter Failure (429/402)** | OrcaRouter account lacks payment credits (402) and linked GitHub account (429). | Point generation calls to the operational `nvidia/nemotron-3.5-bolt-e4b` on NVIDIA NIM (which has active quota and supports 8192 tokens), with seamless fallback. |
| **PDF Parsing Failure** | `pdf-parse` v2 exports a class `PDFParse`, not a callable function. Calling `pdfParse(buffer)` threw `pdfParse is not a function` every time. | Use `new pdfModule.PDFParse({ data: buffer })` with `.getText()` and `.destroy()`, plus direct text extraction for `.txt` / `.md` files. |
| **Generation Timer Paused at 7s** | In `QuizGenerationModal.tsx`, passing array reference `questionFormats` in dependency array caused effect cleanup on re-render, clearing `timerInterval`, but `isStartedRef` remained true, preventing timer re-initialization. | Separate timer logic into an independent `useEffect` tied strictly to `isOpen` and using elapsed time calculation. |
| **Quiz Taker Countdown Stuck** | Relying purely on `setInterval(t => t - 1)` gets throttled or frozen by mobile browsers and background tabs. | Use timestamp-based target countdown: `targetEndTime = Date.now() + remainingSec * 1000`. |
| **Background Generation Task Dock** | User wants generation progress visible at the bottom so they can minimize the modal and watch progress in a bottom task dock. | Build a persistent `GenerationTaskDock.tsx` anchored at the bottom of the screen with stage tracker, elapsed timer, progress bar, click-to-expand modal, and completion pill. |
| **Manifest 404 & AudioContext & Meta** | Missing `/public/icon-192.png` & `/public/icon-512.png`; AudioContext resuming before user gesture; deprecated apple-mobile meta tag. | Generate high-res 192x192 & 512x512 icons in `/public`, add user-gesture guard for Web Audio, and add `mobile-web-app-capable: yes` meta. |

---

## 2. Proposed Changes & Task Breakdown

### Task 1: Robust AI Engine & Auto-Repair JSON Parser (`lib/ai-engine.ts` & `app/api/ai/generate/route.ts`)
- [ ] In `lib/ai-engine.ts`:
  - Increase `max_tokens` to `8192` in `generateWithNvidia`.
  - Ensure `generateWithOrca` safely catches 429/402 and immediately falls back to `generateWithNvidia`.
  - Create `parseAndRepairJson(rawText: string, formatsList: string[]): QuizQuestion[]`:
    - Clean markdown blocks (````json`, ````).
    - Try direct `JSON.parse`.
    - If it fails with syntax error:
      - Locate the last complete object ending with `}` before the end of the text.
      - Slice up to that `}` and append `]` to close the array.
      - If still failing, regex extract all valid `{ "questionStem": ..., "options": ... }` blocks and parse them.
    - Guarantee that valid questions are always returned.
- [ ] In `app/api/ai/generate/route.ts`:
  - Wrap entire handler in `try ... catch (err)` block that always returns `NextResponse.json({ error: err.message }, { status: 500 })`.
  - Ensure `engine` parameter mapping correctly uses `'nvidia'` for both `'nemotron'` and `'deepseek'` when OrcaRouter fails.

### Task 2: PDF & Document Upload Engine Fix (`app/api/materials/upload/route.ts`)
- [ ] In `app/api/materials/upload/route.ts`:
  - Check if file is plaintext (`.txt`, `.md`, `text/*`): extract directly with `Buffer.from(await file.arrayBuffer()).toString('utf-8')`.
  - For PDF:
    - Check if `pdfModule.PDFParse` is a constructor (v2): instantiate `new pdfModule.PDFParse({ data: buffer })`, call `await parser.getText()`, extract `text`, call `await parser.destroy()`.
    - If `typeof (pdfModule.default || pdfModule) === 'function'` (v1): call `await (pdfModule.default || pdfModule)(buffer)`.
  - Return extracted text, word count, and 200/201 response.

### Task 3: Timer & Modal Resilience Fixes
- [ ] In `components/QuizGenerationModal.tsx`:
  - Separate timer into a dedicated `useEffect` dependent only on `isOpen`.
  - Use `Date.now() - startTime` to compute elapsed seconds so it never pauses or gets stuck.
  - Safe response parser: try `res.json()`, fallback to `res.text()` with clear error messages.
- [ ] In `app/programs/[code]/quiz/[quizId]/page.tsx`:
  - Implement timestamp-based timer: store `examTargetEndTime = Date.now() + remainingSeconds * 1000` in localStorage.
  - Compute `remaining = Math.max(0, Math.round((examTargetEndTime - Date.now()) / 1000))` on every tick, ensuring zero throttling when tab sleeps.

### Task 4: Persistent Bottom Quiz Generation Task Dock (`components/GenerationTaskDock.tsx` & `ProgramHubClient.tsx`)
- [ ] Create `components/GenerationTaskDock.tsx`:
  - Duolingo-styled 3D floating dock at the bottom of the viewport.
  - Displays:
    - Glowing bolt icon / pulsing shield.
    - Program code & candidate name.
    - Current stage name (e.g. `Stage 4: AI Coach Question Synthesis`).
    - Elapsed timer & percentage progress bar.
    - "Expand / View Details" button to reopen `QuizGenerationModal`.
    - On completion: turns Feather Green (`#58CC02`), displays `Quiz Generated! (25 Questions)` with a 1-tap "Start Quiz" or "View in List" CTA.
    - Close / dismiss (X) button.
- [ ] Wire `GenerationTaskDock` into `app/programs/[code]/ProgramHubClient.tsx`:
  - Allow closing the modal without aborting the generation.
  - Synchronize progress and completion between the modal and the bottom dock.

### Task 5: Web Manifest, Public Icons, Layout Meta & AudioContext Clean Up
- [ ] Create `/public` directory with valid `icon-192.png` and `icon-512.png`.
- [ ] In `app/layout.tsx`: add `other: { 'mobile-web-app-capable': 'yes' }` to metadata.
- [ ] In `lib/sounds.ts`: guard AudioContext against unhandled suspension warnings and resume safely on user gesture.

### Task 6: Verification, Packaging & Deployment
- [ ] Run `node scripts/verify-no-emojis.js` to ensure 100% vector Lucide icons.
- [ ] Run `npm.cmd run build` to confirm 0 TypeScript / ESLint errors across all routes.
- [ ] Package deployment zip via `scripts/make-zip.ps1`.
- [ ] Commit and push to GitHub `origin main`.
- [ ] Test generation on AX37 with 25 questions in Arabic to confirm zero errors!
