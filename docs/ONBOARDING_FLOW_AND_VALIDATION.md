# VisionShoutout & New-User Onboarding: Validation & WalkMe Flow

## 1. Validation Summary

### 1.1 Code & Build

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript | Pass | `tsc --noEmit` clean |
| ESLint | Pass | No new errors from VisionShoutout/Dashboard |
| VisionShoutout.tsx | OK | Exports, AnimatePresence, magnetic hover, breathe, `getVisionShoutoutSeen` / `setVisionShoutoutSeen` |
| Dashboard integration | OK | 800ms delay, scale 0.95↔1, `onEnter` / `onEntered`, shimmer on Capture New + FAB |
| index.css | OK | `add-link-glow` keyframes, `.add-link-shimmer` |

### 1.2 Flow (Logic)

| Step | Expected | Implementation |
|------|----------|----------------|
| First visit, `!getVisionShoutoutSeen()` | After 800ms, overlay appears | `useEffect` with `setTimeout(..., 800)` |
| Overlay visible | Dashboard at `scale(0.95)` | `motion.div` with `animate={{ scale: showVisionShoutout ? 0.95 : 1 }}` |
| Click "Enter My Sanctuary" | `setVisionShoutoutSeen()`, `onEnter()` | `handleEnter` in VisionShoutout |
| On enter | Overlay fades, dashboard scales to 1 | `setShowVisionShoutout(false)` → AnimatePresence exit + motion.div scale |
| After exit | `onEntered` runs | `AnimatePresence onExitComplete={() => onEntered?.()}` |
| After `onEntered` | Shimmer on Add Link 2.5s | `setAddLinkHighlight(true)`, `setTimeout(..., 2500)` |
| Return visit | No overlay | `getVisionShoutoutSeen()` → `useEffect` returns early |

### 1.3 Gaps & Edge Cases

- **VisionShoutout vs Extension Install:** VisionShoutout at 800ms and Extension Install at 2000ms can both apply. If the user hasn’t clicked "Enter" by 2s, the Extension modal can open on top of VisionShoutout → **recommendation in §2**.
- **Empty library:** Shimmer correctly points to "Capture New" / FAB as the first action.
- **Reduced motion:** `prefersReducedMotion` disables breathe and magnetic hover.
- **Mobile:** Magnetic hover off (`magneticHover={!isMobile}`); FAB gets shimmer when `addLinkHighlight` is true.

---

## 2. WalkMe-Onboarding Flow for New Users

As a WalkMe-style specialist, the goal is: **one clear path** from first load to first value (e.g. first link added), with minimal clicks and no overload.

---

### 2.1 Principle: One Overlay at a Time

- Do **not** show Extension Install while VisionShoutout is open.
- **Rule:** Show Extension Install only when **either**
  - `getVisionShoutoutSeen() === true`, or  
  - VisionShoutout is not being shown this session (e.g. user already saw it before).

**Concrete change:** In the Extension Install `useEffect`, add:

```ts
// Don't show Extension modal while VisionShoutout is (or could be) shown.
// Wait until VisionShoutout has been seen at least once.
if (!getVisionShoutoutSeen()) return
```

And **increase the delay** after VisionShoutout is “done” (e.g. show Extension 1200ms after VisionShoutout is dismissed for first-time users). A simpler approach: **only start the 2000ms Extension timer after `getVisionShoutoutSeen()` is true**. For first-time users, that becomes: show VisionShoutout at 800ms → user clicks Enter → we set `smartrack-vision-shoutout-seen` → on *next* dashboard load, Extension timer runs. For users who already had VisionShoutout seen, Extension runs on first load as today. So:

- **First-time (VisionShoutout not seen):** 800ms → VisionShoutout; no Extension this load. Next load → Extension at 2000ms if `!isExtensionInstalled && !hasExtensionLinks`.
- **Returning (VisionShoutout seen), no extension:** Extension at 2000ms as today.

---

### 2.2 Golden Path (Ideal First Session)

| # | Moment | What the user sees | Purpose |
|---|--------|--------------------|---------|
| 1 | **0–800ms** | Dashboard (content or skeleton) | Brief context before the “reveal” |
| 2 | **800ms** | **VisionShoutout** (“Your Research, Redefined as Art” / “Enter My Sanctuary”) | Identity, “sanctuary,” and a single CTA |
| 3 | **User clicks “Enter My Sanctuary”** | Dissolve (overlay fade + dashboard scale to 1) | Feeling of “entering” the product |
| 4 | **Right after exit** | **Shimmer on “Capture New” (desktop) or FAB (mobile)** for 2.5s | Directs to the first high-value action |
| 5 | **User clicks Capture New / FAB** | Add Link modal | First concrete action |
| 6 | **User adds first link** | Toast + new card in the feed | First success, reinforces the loop |
| 7 | **Next visit (or later in session)** | **Extension Install** (desktop, if `!isExtensionInstalled && !hasExtensionLinks`) at 2000ms | Introduce one-click capture *after* they’ve used the core action once |

---

### 2.3 Copy & Microcopy Along the Path

- **VisionShoutout:**  
  - Headline: “Your Research, Redefined as Art.”  
  - Body: “In a world of infinite tabs, SmarTrack is your sanctuary. We've turned your scattered bookmarks into a visual discovery canvas designed for the modern builder.”  
  - CTA: “Enter My Sanctuary.”  
  - 3-dot indicator: first dot blue = “step 1 of a short journey,” sets expectations.

- **After Enter (implicit):** Shimmer has no label; the motion is the message: “start here.”

- **Add Link modal:** Existing UX; optional later: a one-time subtitle like “Add your first link to get started” when `links.length === 0`.

- **Extension Install:** Keep current copy; it already fits as “next power-up” after the first manual add.

---

### 2.4 What We’re *Not* Doing (By Design)

- **No product tour with multiple steps** (e.g. Search, Categories, Sidebar) on first load. VisionShoutout + shimmer keeps the first interaction to one idea and one button.
- **No tooltips on first load** for Search, Filters, View toggles. Those can come from a “Help” or “Take a tour” later.
- **No forced “Add your first link” before closing VisionShoutout.** The CTA is “Enter My Sanctuary”; the *suggestion* to add a link is the shimmer, not a blocking step.

---

### 2.5 Optional Next Steps (Post–MVP)

1. **First-link nudge in Add Link modal**  
   When `links.length === 0`, add a short line: “Add your first link to turn your library into a visual canvas.”

2. **“Capture from the extension” hint**  
   After the first link is added and Extension isn’t installed, a small inline tip (e.g. above the feed): “Install the extension to save pages in one click from your browser.”

3. **Lightweight “Discover SmarTrack” tour**  
   In Settings or a “?” in the header: 3-step tour (Add / Search / Categories or Collections) for users who want to explore. Kept off the critical path.

4. **Analytics**  
   - VisionShoutout: shown, clicked “Enter,” time to click.  
   - Shimmer: % of users who click Capture New while shimmer is active.  
   - Extension: show, dismiss, install.  

   Use this to tune delays and copy.

---

### 2.6 Implementation Checklist for §2.1

- [x] In Dashboard’s Extension Install `useEffect`: **if `!getVisionShoutoutSeen()`, return** (do not start the 2000ms timer).  
- [x] Ensure Extension still shows on a **subsequent** load when VisionShoutout has already been seen and extension is not installed.

---

## 3. Manual Test Outline

1. **Clear `smartrack-vision-shoutout-seen`** in `localStorage`, reload `/` or `/dashboard`.
2. **~800ms:** VisionShoutout appears; dashboard at 0.95 scale.
3. **Hover “Enter My Sanctuary” (desktop):** Slight magnetic pull and `whileHover` scale.
4. **Click “Enter My Sanctuary”:** Overlay fades, dashboard scales to 1; after exit, “Capture New” (desktop) or FAB (mobile) shimmers ~2.5s.
5. **Reload (VisionShoutout already seen):** No overlay; if Extension conditions hold, Extension Install at 2000ms (with §2.1: only when `getVisionShoutoutSeen()` is true).
6. **`prefers-reduced-motion: reduce`:** No breathe, no magnetic hover.
7. **Mobile:** No magnetic; FAB shimmers when `addLinkHighlight` is true.

---

## 4. Summary

- **Validation:** VisionShoutout, Dashboard integration, and shimmer behave as designed; TypeScript and lint are clean.  
- **Main UX fix:** Stagger VisionShoutout and Extension Install so only one overlay is active; Extension runs only after VisionShoutout has been seen.  
- **WalkMe flow:** VisionShoutout (identity) → Enter (dissolve) → Shimmer on Add Link (first action) → Add first link (first value) → on a later visit, Extension (power-up). This keeps the first session focused and avoids overlay stacking.
