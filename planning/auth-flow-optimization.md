# Planning - Auth Flow Optimization & Route Protection

## 1. Objective

Optimize the authentication flow and route protection between the Login page, the Dashboard, and potential protected routes like `/bank-soal`. Ensure standard redirection rules:

- Route `/dashboard` and `/bank-soal` (and any other sub-routes) are only accessible to logged-in users. Unauthenticated users are redirected to `/login`.
- Route `/login` is only accessible to unlogged users. Logged-in users are redirected to `/dashboard`.
- Prevent flashing/layout shifts of login cards for logged-in users on page reload.
- Handle database synchronization errors cleanly (e.g., if MySQL sync fails, roll back Firebase authentication).

---

## 2. Affected Files

- [x] `planning/auth-flow-optimization.md` (This planning file)
- [ ] `src/app/login/page.tsx` (Optimize login flow, add router-based redirect, prevent flashing of login UI for logged-in users, sign out if MySQL sync fails)
- [ ] `src/app/dashboard/layout.tsx` (Refine protection layout, verify it guards children properly, handle loading elegantly)
- [ ] `src/app/api/auth/sync/route.ts` (Ensure MySQL sync is atomic, reliable, handles error states smoothly)

---

## 3. Implementation Steps

### Step 1: Optimize the Sync API (`src/app/api/auth/sync/route.ts`)

- Use Prisma upsert to perform atomic database operations. (Currently already implemented with `upsert` but we will double-check error messages and handling).
- Return descriptive error messages to help the client roll back Firebase session if synchronization fails.

### Step 2: Refine the Login Page (`src/app/login/page.tsx`)

- Import `useRouter` from `next/navigation`.
- Implement an `useEffect` with `onAuthStateChanged` to check if a user is already authenticated.
- Add a `checkingAuth` loading state. If `true`, display a clean full-screen loader (`Loader2` spinner) to prevent flashing the login form for logged-in users.
- In `handleGoogleLogin`:
  1. Authenticate with Google Provider.
  2. Perform POST request to `/api/auth/sync`.
  3. **Critical Handling:** If the synchronization POST fails, trigger `auth.signOut()` immediately to roll back Firebase session and throw a sync error so the user isn't stuck in a half-logged-in state.
  4. If successful, immediately push to `/dashboard` using `router.push("/dashboard")`.

### Step 3: Refine the Dashboard Layout (`src/app/dashboard/layout.tsx`)

- Ensure the client-side route guard in `useEffect` with `onAuthStateChanged` works seamlessly.
- Ensure that if `!currentUser` is detected, it redirects to `/login`.
- Provide a clean and unified full-screen loading spinner while verifying session.

---

## 4. Dependencies

No new packages are needed. The existing dependencies are sufficient:

- `firebase` for authentication.
- `@prisma/client` and Prisma ORM.
- `lucide-react` for spinners/icons.

---

## 5. Edge Cases & Error Handling

- **Database Offline / Sync Failed:** If `/api/auth/sync` fails, Firebase authentication is signed out (`await auth.signOut()`) and an error message is shown to the user on the login page.
- **Session Flash on Page Reload:** When an already logged-in user visits `/login` directly, a full-screen loading state is shown until Firebase Auth resolves and redirects them to `/dashboard`.
- **Direct Link Sharing:** If an unauthenticated user attempts to access `/dashboard` or `/bank-soal`, they are immediately sent to `/login`. Once they log in successfully, they are redirected to `/dashboard`.
