# Two-Factor Authentication (2FA)

This document describes the TOTP-based two-factor authentication feature implementation using Better Auth.

## Overview

The application supports Time-Based One-Time Password (TOTP) two-factor authentication, which adds an extra layer of security to user accounts. Users can enable 2FA using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator.

## Features

- **TOTP Support**: Compatible with standard authenticator apps
- **QR Code Setup**: Easy setup via QR code scanning
- **Backup Codes**: 10 backup codes generated for account recovery
- **Device Trust**: Option to trust devices for 30 days
- **Settings Management**: Enable, disable, and manage 2FA from settings page

## Database Schema

The `twoFactor` table stores encrypted secrets and backup codes:

```typescript
{
  id: string (primary key)
  secret: string (encrypted TOTP secret)
  backupCodes: string (encrypted JSON array of backup codes)
  userId: string (foreign key to users table)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## Configuration

### Environment Variables

No additional environment variables are required. The feature uses the existing Better Auth configuration.

### Better Auth Plugin Configuration

The two-factor plugin is configured in `src/lib/auth/auth.ts`:

- **Issuer**: "Budget-ch"
- **Backup Codes**: 10 codes, 10 characters each
- **OTP Email**: Optional email-based OTP (configured but not primary)

## User Flow

### Enabling 2FA

1. User navigates to Settings → Security
2. Clicks "Enable 2FA"
3. Enters password for verification
4. QR code is displayed
5. User scans QR code with authenticator app
6. User enters 6-digit verification code
7. 2FA is enabled

### Signing In with 2FA

1. User signs in with email and password
2. If 2FA is enabled, user is redirected to `/two-factor`
3. User enters 6-digit TOTP code OR backup code
4. Optionally checks "Trust this device" to skip 2FA for 30 days
5. User is redirected to the originally requested page

### Managing Backup Codes

- **View Codes**: Click "Show Backup Codes" in settings (only works immediately after generation)
- **Regenerate Codes**: Click "Regenerate Backup Codes" and enter password (invalidates old codes)

### Disabling 2FA

1. Click "Disable 2FA" in settings
2. Enter password for verification
3. 2FA is disabled

## API Endpoints

All 2FA operations are handled through Better Auth's built-in endpoints:

- `POST /two-factor/enable` - Enable 2FA
- `POST /two-factor/verify-totp` - Verify TOTP code
- `POST /two-factor/disable` - Disable 2FA
- `POST /two-factor/get-totp-uri` - Get TOTP URI for QR code
- `POST /two-factor/view-backup-codes` - View backup codes
- `POST /two-factor/generate-backup-codes` - Regenerate backup codes
- `POST /two-factor/verify-backup-code` - Verify backup code (used during login)

## Server Actions

Server actions are available in `src/app/me/settings/actions.ts`:

- `enableTwoFactorAction(password)` - Start 2FA setup
- `verifyTotpCodeAction(code)` - Verify and complete 2FA setup
- `disableTwoFactorAction(password)` - Disable 2FA
- `getTotpUriAction(password)` - Get TOTP URI
- `viewBackupCodesAction()` - View backup codes
- `regenerateBackupCodesAction(password)` - Regenerate backup codes
- `getTwoFactorStatusAction()` - Get current 2FA status

## Services

Security service functions are in `src/lib/services/security.ts` and wrap Better Auth API calls with error handling and session validation.

## Components

### Settings Page

`src/app/me/settings/_components/security.tsx` - Main security settings component with:
- 2FA status display
- Enable/disable buttons
- Backup code management
- Password reset functionality

### Two-Factor Challenge Page

`src/app/(auth)/two-factor/page.tsx` - Challenge page shown during login:
- TOTP code input
- Backup code input
- Device trust option

## Testing

### Manual Testing Checklist

1. **Enable 2FA**:
   - Go to Settings → Security
   - Click "Enable 2FA"
   - Enter password
   - Scan QR code with authenticator app
   - Enter verification code
   - Verify 2FA is enabled

2. **Sign In with 2FA**:
   - Sign out
   - Sign in with email/password
   - Verify redirect to `/two-factor`
   - Enter TOTP code
   - Verify successful login

3. **Use Backup Code**:
   - Sign out
   - Sign in with email/password
   - Switch to backup code tab
   - Enter a backup code
   - Verify successful login

4. **Trust Device**:
   - Sign in with 2FA
   - Check "Trust this device"
   - Sign out and sign in again
   - Verify no 2FA prompt (within 30 days)

5. **View Backup Codes**:
   - Go to Settings → Security
   - Click "Show Backup Codes"
   - Verify codes are displayed

6. **Regenerate Backup Codes**:
   - Go to Settings → Security
   - Click "Regenerate Backup Codes"
   - Enter password
   - Verify new codes are displayed
   - Verify old codes no longer work

7. **Disable 2FA**:
   - Go to Settings → Security
   - Click "Disable 2FA"
   - Enter password
   - Verify 2FA is disabled
   - Sign out and sign in
   - Verify no 2FA prompt

8. **Translations**:
   - Switch language to German/French/Italian
   - Verify all 2FA-related text is translated

## Security Considerations

- Backup codes are encrypted before storage
- TOTP secrets are encrypted in the database
- Password verification required for sensitive operations
- Backup codes are single-use (consumed after use)
- Device trust expires after 30 days
- Session validation on all server actions

## Troubleshooting

### QR Code Not Scanning
- Ensure the QR code is fully visible
- Try manually entering the secret key
- Check that the authenticator app supports TOTP

### Invalid Code Error
- Verify device time is synchronized
- Ensure code is entered within the 30-second window
- Try the code from the previous or next time window

### Backup Codes Not Working
- Verify codes haven't been regenerated (old codes are invalidated)
- Ensure code is entered exactly as shown
- Check that the code hasn't been used already (single-use)

## Future Enhancements

- Email-based OTP as alternative to TOTP
- SMS-based 2FA
- Recovery email for account recovery
- 2FA enforcement for admin users
- Activity log for 2FA events

