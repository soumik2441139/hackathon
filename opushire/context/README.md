# 🔐 Auth Context

## `AuthContext.tsx`

React Context providing authentication state across the app.

### Provides

```typescript
{
  user: User | null        // Current authenticated user
  token: string | null     // JWT token
  loading: boolean         // Auth state loading
  login(email, password)   // Login and redirect by role
  register(data)           // Register with role selection
  refreshUser()            // Re-fetch profile from server
  logout()                 // Clear session and redirect
}
```

### Features

- **Session persistence:** Token stored in `localStorage`
- **Auto-verification:** Checks token validity on app init via `GET /auth/me`
- **Role-based routing:** After login, redirects to `/dashboard/admin` or `/dashboard/student`
- **Theme switching:** Applies CSS class (`theme-student`, `theme-admin`) based on role
- **Auto-logout:** Clears state on token expiry or verification failure
