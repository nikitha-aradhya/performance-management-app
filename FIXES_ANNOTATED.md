# Fixes — Annotated Code, Unit Test & Retrospective

---

## Bug 1 — Missing `trackBy` in `*ngFor`

### Fixed Code — Explanation

The purpose of introducing a `trackBy` function is to give Angular a **stable identity** for each item in the list.

By default, Angular compares objects using **reference equality**. Since the service returns new object instances on every call, Angular assumes all items are new and re-renders the entire list.

The `trackBy` function solves this by returning a **consistent unique key** for each item.

```typescript
trackByCompositeKey(_index: number, goal: EmployeeGoal): string {
  return `${goal.employeeId}-${goal.id}`;
}
```

### Why a composite key?

Using only `goal.id` is not reliable if IDs are reused per employee. Combining `employeeId` and `goal.id` ensures global uniqueness.

### Template Fix

```html
<tr *ngFor="let goal of goals; trackBy: trackByCompositeKey"></tr>
```

### Service Fix

```typescript
getGoalsCached(): Observable<EmployeeGoal[]> {
  if (!this.cachedGoals) {
    this.cachedGoals = this.generateGoals();
  }
  return of(this.cachedGoals);
}
```

### Outcome

- Angular reuses existing DOM elements
- Eliminates unnecessary DOM destruction and recreation
- Significant performance improvement for large lists

---

### Unit Test — Purpose and Validation

This test ensures that **two logically identical items produce the same key**, even if other fields differ.

```typescript
it("should return same key for same employeeId and goalId", () => {
  const before = makeGoal({ employeeId: 3, id: 17, progress: 20 });
  const after = makeGoal({ employeeId: 3, id: 17, progress: 95 });

  const keyBefore = component.trackByCompositeKey(0, before);
  const keyAfter = component.trackByCompositeKey(0, after);

  expect(keyBefore).toBe("3-17");
  expect(keyAfter).toBe("3-17");
  expect(keyBefore).toBe(keyAfter);
});
```

### What this proves

Angular will treat both objects as the same item and reuse the DOM node instead of recreating it.

---

## Bug 2 — Unsubscribed Subject Subscription

### Fixed Code — Explanation

The issue is resolved by tying the subscription lifecycle to the component lifecycle using Angular’s built-in utilities.

```typescript
this.notificationService.notifications$
  .pipe(
    takeUntilDestroyed(this.destroyRef),
    finalize(() => {
      this.notificationService.activeSubscriptions--;
    })
  )
  .subscribe((msg) => {
    this.received.unshift(msg);
  });
```

### Key Concepts

- **`takeUntilDestroyed`**
  Automatically unsubscribes when the component is destroyed. This prevents memory leaks and stale callbacks.

- **`finalize`**
  Executes cleanup logic when the observable completes or unsubscribes. Used here to maintain an accurate subscription counter.

### Outcome

- Prevents accumulation of subscriptions
- Eliminates duplicate event handling
- Ensures proper memory cleanup

---

## Bug 3 — OnPush Mutation Issue

### Fixed Code — Explanation

With `OnPush`, Angular only detects changes when the **reference of an input changes**.

Mutating an existing object does not change its reference, so Angular skips change detection.

The fix is to create **new object instances** during updates.

```typescript
this.kpiData = data.map((emp) => ({ ...emp }));
```

### Why this works

- Each object now has a new memory reference
- Angular detects the change and updates the UI

### Deep Copy Consideration

If objects become nested, a deep copy approach such as `structuredClone` should be used to avoid shared references.

---

### Component-Level Handling

```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['kpi']) {
    this.cdr.markForCheck();
  }
}
```

### Why `markForCheck` is included

This ensures updates are reflected even when data originates **outside Angular’s change detection cycle** (e.g., WebSocket callbacks).

---

### Template Note

```html
<div *ngFor="let emp of kpiData; trackBy: trackById"></div>
```

Using `trackBy` here ensures:

- Component instances are reused
- The OnPush behavior becomes observable and predictable

---

## Retrospective — Improvements for a Fresh Implementation

### 1. Prefer `async` pipe over manual subscriptions

Manual subscription management introduces risk of memory leaks. Using the `async` pipe:

- Automatically handles subscription and unsubscription
- Keeps data flow declarative and visible in the template

---

### 2. Enforce immutability at the service layer

Instead of relying on developers to avoid mutations:

- Return `Readonly` types from services
- Prevent accidental in-place updates at compile time

This shifts correctness from discipline to enforcement.

---

### 3. Use tooling to enforce best practices

Introduce linting rules such as:

- Enforce `trackBy` usage in `*ngFor`
- Prevent patterns known to cause performance issues

This ensures:

- Issues are caught early during development
- Code quality is consistent across the team

---

## Final Summary

| Bug                     | Core Issue                       | Resolution                             |
| ----------------------- | -------------------------------- | -------------------------------------- |
| Missing `trackBy`       | Full DOM re-render               | Provide stable identity with `trackBy` |
| Unsubscribed Observable | Memory leak and duplicate events | Lifecycle-based unsubscription         |
| OnPush Mutation         | UI not updating                  | Use immutable data updates             |

---
