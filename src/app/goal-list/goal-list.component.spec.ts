import { TestBed } from '@angular/core/testing';
import { GoalListComponent } from './goal-list.component';
import { EmployeeGoal } from '../services/kpi.service';

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for GoalListComponent.trackByCompositeKey()
//
// PURPOSE:
//   Prove that when the list data reference changes (new array from the server)
//   but the values (employeeId + goalId) are the same, trackByCompositeKey()
//   returns the same key → Angular reuses the DOM node → no re-render occurs.
//
//   This is exactly what Angular's *ngFor does internally: it calls trackBy
//   and only destroys/recreates a row when the key CHANGES.  Same key = reuse.
// ─────────────────────────────────────────────────────────────────────────────

describe('GoalListComponent — trackByCompositeKey()', () => {
  let component: GoalListComponent;

  // Helper to build a minimal EmployeeGoal object for testing
  function makeGoal(overrides: Partial<EmployeeGoal>): EmployeeGoal {
    return {
      id:           1,
      employeeId:   1,
      employeeName: 'Test User',
      goalTitle:    'Test Goal',
      progress:     50,
      dueDate:      '2025-06-30',
      priority:     'Medium',
      ...overrides,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalListComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(GoalListComponent);
    component = fixture.componentInstance;
  });

  // ── Test 1 ────────────────────────────────────────────────────────────────
  // Two different object references, same employeeId + id
  // → same composite key → Angular REUSES the DOM row (no re-render)
  it('should return the same key for two different object references with the same employeeId and id', () => {
    const goalFirstFetch  = makeGoal({ employeeId: 5, id: 42, progress: 30 });
    const goalSecondFetch = makeGoal({ employeeId: 5, id: 42, progress: 75 }); // new object, same identity

    const key1 = component.trackByCompositeKey(0, goalFirstFetch);
    const key2 = component.trackByCompositeKey(0, goalSecondFetch);

    // Same key → Angular reuses the DOM node → no unnecessary re-render
    expect(key1).toBe(key2);
    expect(key1).toBe('5-42');
  });

  // ── Test 2 ────────────────────────────────────────────────────────────────
  // Different goalId, same employeeId → different key → Angular REPLACES row
  it('should return different keys when goal id changes', () => {
    const goalA = makeGoal({ employeeId: 5, id: 42 });
    const goalB = makeGoal({ employeeId: 5, id: 99 });

    expect(component.trackByCompositeKey(0, goalA)).not.toBe(
      component.trackByCompositeKey(0, goalB)
    );
  });

  // ── Test 3 ────────────────────────────────────────────────────────────────
  // Same goalId, different employeeId → different key → Angular REPLACES row
  // This is WHY we use a composite key and not just goal.id alone —
  // two employees could have goals with the same id in some backends.
  it('should return different keys when employeeId changes even if goal id is the same', () => {
    const goalEmp1 = makeGoal({ employeeId: 1, id: 10 });
    const goalEmp2 = makeGoal({ employeeId: 2, id: 10 }); // same goal id, different employee

    expect(component.trackByCompositeKey(0, goalEmp1)).toBe('1-10');
    expect(component.trackByCompositeKey(0, goalEmp2)).toBe('2-10');
    expect(component.trackByCompositeKey(0, goalEmp1)).not.toBe(
      component.trackByCompositeKey(0, goalEmp2)
    );
  });

  // ── Test 4 ────────────────────────────────────────────────────────────────
  // Composite key format is always "employeeId-goalId"
  it('should produce a composite key in the format employeeId-goalId', () => {
    const goal = makeGoal({ employeeId: 7, id: 123 });
    expect(component.trackByCompositeKey(0, goal)).toBe('7-123');
  });

  // ── Test 6 ────────────────────────────────────────────────────────────────
  // THE FIX TEST: proves that the composite trackBy function is the direct
  // reason DOM nodes are reused after a reload.
  //
  // Without trackBy Angular compares object references: oldObj !== newObj → destroy + recreate.
  // With trackByCompositeKey Angular compares the returned string: "5-42" === "5-42" → reuse.
  //
  // This test makes that contract explicit: two objects with zero shared identity
  // (different reference, different progress value) still produce the same key,
  // which is exactly the signal Angular's *ngFor uses to skip DOM work.
  it('FIX: should return equal keys for objects with same employeeId+id regardless of other field changes — proving Angular reuses the DOM row', () => {
    // Simulate the object returned on first load
    const beforeReload = makeGoal({ employeeId: 3, id: 17, progress: 20, priority: 'Low' });

    // Simulate the "same" goal returned after a server reload:
    // completely different object reference, updated progress and priority
    const afterReload  = makeGoal({ employeeId: 3, id: 17, progress: 95, priority: 'High' });

    const keyBefore = component.trackByCompositeKey(0, beforeReload);
    const keyAfter  = component.trackByCompositeKey(0, afterReload);

    // Keys are equal → Angular treats these as the same row → DOM node is reused,
    // not destroyed and recreated. This is the entire value of the fix.
    expect(keyBefore).toBe('3-17');
    expect(keyAfter).toBe('3-17');
    expect(keyBefore).toBe(keyAfter);
  });

  // ── Test 5 ────────────────────────────────────────────────────────────────
  // Simulates what Angular does on a re-fetch:
  // Build an array, "re-fetch" it (new references, same values), compare all keys.
  // All keys should match → zero rows re-rendered.
  it('should produce identical keys for a re-fetched list with same values (simulates no re-render)', () => {
    const originalList: EmployeeGoal[] = [
      makeGoal({ employeeId: 1, id: 1 }),
      makeGoal({ employeeId: 2, id: 2 }),
      makeGoal({ employeeId: 3, id: 3 }),
    ];

    // Simulate server re-fetch: completely new object references, same data
    const reFetchedList: EmployeeGoal[] = [
      makeGoal({ employeeId: 1, id: 1 }),
      makeGoal({ employeeId: 2, id: 2 }),
      makeGoal({ employeeId: 3, id: 3 }),
    ];

    // Every key from the re-fetched list matches the original → Angular reuses all rows
    originalList.forEach((goal, i) => {
      expect(component.trackByCompositeKey(i, goal)).toBe(
        component.trackByCompositeKey(i, reFetchedList[i])
      );
    });
  });
});
