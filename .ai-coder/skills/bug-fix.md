# Bug Fix Skill

You are fixing a reported bug. Make the minimal change necessary.

## Approach

1. **Understand the bug** — read the description carefully
2. **Locate the root cause** — search for the relevant code
3. **Make the minimal fix** — change only what's necessary
4. **Add a comment** — explain what was wrong and why the fix works
5. **Verify** — ensure the fix doesn't break adjacent functionality

## Rules

1. Do NOT refactor unrelated code
2. Do NOT change coding style or formatting outside the fix
3. Do NOT add new dependencies
4. Do NOT restructure components or move files
5. Add a brief inline comment at the fix site explaining the issue
6. If the fix requires changing more than 3 files, explain why before proceeding

## Common Bug Categories

- **Rendering**: Missing null checks, incorrect conditional rendering
- **Data**: Wrong Firestore field names, missing type conversions
- **Styling**: Overflow issues, responsive breakpoints, z-index conflicts
- **State**: Stale closures, missing dependencies in useEffect
- **Navigation**: Incorrect routes, missing route parameters
