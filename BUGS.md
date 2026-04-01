# Performance Management App — Bug

This application contains three intentional bugs. Each bug does not break the application immediately but leads to performance issues, memory leaks, or incorrect UI behavior.

---

## Bug 1 — Missing `trackBy` in `*ngFor`

### What is happening

The application renders a list of around 2,000 goal rows. On every reload, Angular treats the entire list as new and re-renders all rows.

### Root cause

- The data source returns a new array with new object references on every call.
- No `trackBy` function is provided, so Angular cannot identify which items are unchanged.

### Impact

- All DOM elements are destroyed and recreated on every reload.
- Causes unnecessary rendering work and UI lag, especially for large lists.
- Performance degrades as list size or refresh frequency increases.

### Fix

- Add a `trackBy` function to provide a unique identifier for each item.
- Ensure stable object references where possible.

```typescript
trackByCompositeKey(index: number, goal: EmployeeGoal): string {
  return `${goal.employeeId}-${goal.id}`;
}
```

### Result

Angular reuses existing DOM elements and only updates changed items, significantly improving performance.

---

## Bug 2 — Unsubscribed Observable (Memory Leak)

### What is happening

The component subscribes to a notification stream but does not unsubscribe when the component is destroyed.

### Root cause

- A singleton service holds a long-lived `Subject`.
- Subscriptions are created on each component initialization but never cleaned up.

### Impact

- Multiple subscriptions accumulate over time.
- Leads to duplicate notifications being processed.
- Causes memory leaks by retaining references to destroyed components.

### Fix

Use automatic unsubscription tied to the component lifecycle:

```typescript
this.notificationService.notifications$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
  this.received.unshift(msg);
});
```

### Result

- Subscriptions are cleaned up when the component is destroyed.
- Prevents memory leaks and duplicate event handling.

---

## Bug 3 — OnPush Change Detection with Object Mutation

### What is happening

The dashboard updates KPI data periodically, but the UI does not reflect updated values.

### Root cause

- The component uses `OnPush` change detection.
- Existing objects are mutated instead of creating new references.
- Angular detects changes only when object references change.

### Impact

- UI displays stale data even though the underlying data is updated.
- No errors are thrown, making the issue harder to detect.

### Fix

Use immutable updates by creating new object references:

```typescript
this.kpiData = data.map((emp) => ({ ...emp }));
```

### Additional note

If updates originate outside Angular’s zone (e.g., WebSocket callbacks), explicitly trigger change detection:

```typescript
this.cdr.markForCheck();
```

### Result

Angular detects input changes correctly and updates the UI as expected.
