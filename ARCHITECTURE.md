## 1. State Management (How data is handled)

- We have three separate data parts: KPI scores, goals, and notifications
- They do not depend on each other
- So we do not need something heavy like NgRx

Why not use NgRx:

- It adds extra code and complexity
- It is useful only for large, complex data sharing across components

Better approach:

- Use simple Angular signals
- Each feature has its own small service
- Components directly read the data

Result:

- Less code
- Easier to maintain
- Cleaner structure

---

## 2. Polling Optimization (Saving resources)

Problem:

- The app keeps calling APIs even when the tab is not active
- This wastes system and server resources
- When the user returns, the UI updates suddenly

Fix:

- Detect if the browser tab is active
- Stop API calls when the tab is hidden
- Fetch data immediately when the user returns

Result:

- Better performance
- No unnecessary API calls
- Smoother user experience

---

## 3. Token Expiry Issue (Login problems)

Problem:

- When the token expires, multiple API calls may fail at the same time
- This can trigger multiple login attempts

Fix:

- First try to refresh the token silently
- Ensure only one login attempt happens
- Stop further API calls if the session is invalid

Result:

- Stable login flow
- No repeated redirects

---

## 4. WebSocket (Real-time updates) — Why not now

Problem:

- Real-time updates can send too many changes at once
- This can affect UI performance

Example:

- If many employee records update together, the UI may try to update too frequently

Current polling approach:

- Controlled updates at fixed intervals
- Always shows the latest data without overload

Before using WebSockets, we need:

- Limits on how many updates are sent
- Grouping of updates instead of many small ones
- Proper reconnection handling

Conclusion:

- Polling is more stable and predictable for now
- WebSockets require more backend support

---

## Final Takeaway

- Keep the solution simple
- Avoid unnecessary complexity
- Focus on stability and maintainability
