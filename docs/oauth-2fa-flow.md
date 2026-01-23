# OAuth + Two-Factor Authentication Flow

Better Auth's built-in 2FA only works with credential (email/password) login. For OAuth/social login (e.g., Google), we implement a custom verification flow since Better Auth creates a full session immediately after OAuth callback without checking 2FA status.

## Architecture

### The Problem

| Login Method | Better Auth Behavior |
|---|---|
| Credential | Returns `twoFactorRedirect: true`, no session created until 2FA verified |
| OAuth | Session created immediately, 2FA bypassed entirely |

Better Auth's `/two-factor/verify-totp` endpoint requires a signed "pending 2FA" cookie that is only set during credential login. Calling it with an OAuth session returns 401.

### The Solution

A cookie-based gate (`pending_2fa`) combined with custom server-side TOTP/backup code verification that replicates Better Auth's internal logic.

## Flow Diagram

```
OAuth Login with 2FA Enabled
─────────────────────────────

1. User clicks "Sign in with Google"
2. OAuth flow completes → callback handler runs
3. After hook checks user.twoFactorEnabled
4. Sets HttpOnly cookie: pending_2fa=1 (Max-Age: 7 days)
5. Browser redirects to /me/dashboard (callbackURL)

6. /me/layout.tsx detects pending_2fa cookie
7. Redirects to /two-factor?flow=oauth

8. (auth)/layout.tsx sees session + pending_2fa cookie
9. Allows access (normally redirects authenticated users away)

10. User enters TOTP code
11. verifyTotpForOAuthAction() called:
    - Gets session from headers
    - Reads two_factor record from DB
    - Decrypts TOTP secret with BETTER_AUTH_SECRET
    - Verifies code using @better-auth/utils/otp
    - On success: deletes pending_2fa cookie
12. User redirected to /me/dashboard (no cookie → access granted)
```

## Key Files

| File | Role |
|---|---|
| `src/lib/auth/auth.ts` | After hook sets `pending_2fa` cookie on OAuth callback |
| `src/app/me/layout.tsx` | Redirects to `/two-factor?flow=oauth` if cookie exists |
| `src/app/(auth)/layout.tsx` | Allows two-factor page access if cookie exists |
| `src/lib/services/security.ts` | `verifyTotpForOAuth()` and `verifyBackupCodeForOAuth()` |
| `src/lib/auth/actions.ts` | Server actions that verify + clear cookie |
| `src/app/(auth)/two-factor/page.tsx` | Detects `flow=oauth` param, uses server actions |

## How TOTP Verification Works

The custom verification replicates Better Auth's internal logic:

```typescript
// 1. Decrypt the stored secret
const decryptedSecret = await symmetricDecrypt({
  key: process.env.BETTER_AUTH_SECRET,
  data: twoFactorRecord.secret,
});

// 2. Verify the code (same library Better Auth uses)
const isValid = await createOTP(decryptedSecret, {
  period: 30,
  digits: 6,
}).verify(code);
```

Dependencies used:
- `better-auth/crypto` — `symmetricDecrypt`, `symmetricEncrypt` (public export)
- `@better-auth/utils/otp` — `createOTP` (Better Auth's internal OTP library)

## How Backup Code Verification Works

```typescript
// 1. Decrypt stored backup codes
const decryptedCodes = await symmetricDecrypt({ key: secret, data: record.backupCodes });
const backupCodes: string[] = JSON.parse(decryptedCodes);

// 2. Find matching code (normalized comparison)
const matchIndex = backupCodes.findIndex(c =>
  c.replace(/[-\s]/g, "").toLowerCase() === normalizedInput
);

// 3. Remove used code and re-encrypt
const updatedCodes = backupCodes.filter((_, i) => i !== matchIndex);
const encrypted = await symmetricEncrypt({ key: secret, data: JSON.stringify(updatedCodes) });
await db.update(twoFactor).set({ backupCodes: encrypted }).where(...);
```

## Cookie Lifecycle

| Event | Cookie State |
|---|---|
| OAuth callback (user has 2FA) | `pending_2fa=1` set (HttpOnly, 7-day Max-Age) |
| Successful TOTP/backup verification | `pending_2fa` deleted |
| User signs out | Cookie becomes irrelevant (no session) |
| Cookie expires (7 days) | User can access dashboard without 2FA* |

*Edge case: if the cookie expires before verification, the user bypasses 2FA for that session. This is acceptable because the cookie is re-set on each new OAuth login.

## Credential Login Flow (Unchanged)

The credential login flow remains entirely handled by Better Auth:

1. User submits email + password
2. Better Auth returns `twoFactorRedirect: true` (no session)
3. Client-side `onTwoFactorRedirect()` redirects to `/two-factor`
4. No `flow=oauth` param → uses `authClient.twoFactor.verifyTotp()` (Better Auth's endpoint)
5. Better Auth creates session after verification

## Trust Device

The "Trust Device" feature (30-day skip) only works with the credential login flow since it's managed by Better Auth's session system. For OAuth login, 2FA is required on every sign-in.

## Environment Requirements

- `BETTER_AUTH_SECRET` — Must be set. Used as the encryption key for TOTP secrets and backup codes.
