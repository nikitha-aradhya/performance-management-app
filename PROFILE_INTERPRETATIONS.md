# Profile Interpretations — Performance Management App

---

## Bug 1 — Missing `trackBy` in `*ngFor`

### What the Performance profile shows and what it means

The Performance tab shows a large “Recalculate Style” and “Layout” block (80–200 ms) after clicking reload, often marked as a Long Task. This indicates the main thread is blocked and cannot respond to user input.

This time is spent on DOM work, not business logic. Angular destroys and recreates all 2,000 rows because it cannot identify items without `trackBy`. Each node is removed, recreated, styled, and inserted again, followed by a full layout recalculation.

After adding `trackBy`, Angular reuses existing DOM nodes. The flame chart shrinks significantly, showing minimal work since no DOM updates are required.

---

## Bug 2 — Unsubscribed Subject Subscription

### What the Memory profile shows and what it means

Heap snapshots show an increasing number of `SafeSubscriber` objects after repeated navigation. Each represents an active subscription still held by the `Subject`.

These subscribers retain the entire component instance and its data, preventing garbage collection. This leads to a predictable memory leak: one retained component per navigation.

The duplicate notifications seen in the UI occur because all retained subscribers continue to receive events. The profiler confirms the root cause as lingering references inside the `Subject`.

---

## Bug 3 — OnPush Mutation (`KpiCardComponent`)

### What the Console and DevTools profile shows and what it means

There is no CPU spike or memory growth, but expected UI updates do not occur. Angular DevTools shows that `DashboardComponent` updates, while `KpiCardComponent` does not.

With `OnPush`, Angular checks for reference changes. Since objects are mutated instead of replaced, the reference remains the same and change detection is skipped.

Console checks reveal updated values in memory but stale values in the DOM. This confirms a rendering issue, not a data issue.
