# Authentication Flow Documentation

## Overview

This document describes the authentication flow in the CDA application, including email verification, polling mechanism, and session management.

## Authentication Flow

### Signup Flow

1. **User submits signup form**
   - POST `/api/auth/signup`
   - Validates email, password, and other fields
   - Creates pending signup record
   - Generates verification token with polling token
   - Sends verification email

2. **User redirected to verification page**
   - Frontend displays `/verify-email` page
   - Browser polls `/api/auth/check-verification` every 5 seconds
   - Maximum polling duration: 10 minutes

3. **User clicks email verification link**
   - GET `/api/auth/verify?token=X&type=signup`
   - Validates token and creates user account
   - Marks polling token as verified
   - Redirects to `/verify-result?success=true`

4. **Original browser detects verification**
   - Polling endpoint returns `verified: true`
   - Creates session for original browser only
   - Redirects to dashboard

### Login Flow (Magic Link)

1. **User submits login form**
   - POST `/api/auth/login`
   - Validates email
   - Generates magic link token
   - Sends magic link email

2. **User clicks magic link**
   - GET `/api/auth/verify?token=X&type=login`
   - Validates token
   - Marks polling token as verified
   - Redirects to `/verify-result?success=true`

3. **Original browser detects verification**
   - Polling endpoint returns `verified: true`
   - Creates session for original browser only
   - Redirects to dashboard

## Key Security Features

### Single Device Authentication

**Important:** Only the device that initiated the auth flow (the original browser) gets authenticated. The device that clicks the email link does NOT get a session.

This prevents unauthorized access when:
- Email is opened on a different device (e.g., mobile)
- Email is opened in a shared/public environment
- User's email is compromised

### Polling Mechanism

The original browser continuously polls the verification status:
- **Default rate**: 5 seconds
- **Max duration**: 10 minutes
- **Token expiry**: 30 minutes (signup) / 15 minutes (login magic link)

After 10 minutes of polling:
- Polling automatically stops
- User must manually reload the page to continue
- API respects token expiry even if polling continues

## Environment Variables

### Required Configuration

Add these to your `.env` file:

```bash
# Verification Token Configuration
VERIFICATION_TOKEN_EXPIRY_MINUTES=30  # Time for signup tokens to expire
MAGIC_LINK_EXPIRY_MINUTES=15          # Time for login magic links to expire

# Polling Configuration
NEXT_PUBLIC_POLLING_RATE_SECONDS=5          # Poll every 5 seconds
NEXT_PUBLIC_POLLING_MAX_DURATION_MINUTES=10 # Stop polling after 10 minutes

# Session Configuration
SESSION_TOKEN_EXPIRY_DAYS=30          # Session cookie duration
```

### Environment Variable Notes

- `NEXT_PUBLIC_` prefix is required for client-side variables
- Polling variables are accessible in the browser for `verify-email` page
- Session and token expiry are server-side only

## Important Considerations

### 1. Polling Timeout vs Token Expiry

- **Polling timeout**: 10 minutes (user must reload after this)
- **Token expiry**: 30/15 minutes (token invalid, user must request new link)

The API always checks token expiry, so even if polling continues after 10 minutes, it will fail when the token actually expires.

### 2. Single Session Behavior

The current implementation intentionally creates only ONE session:
- The original signup/login browser gets the session
- Email-clicking device gets NO session

**Rationale:** Better security by limiting authentication to the device that initiated the flow.

### 3. Session Management

- Sessions are stored in the `sessions` table
- Each session includes: user_id, session_token, expires_at, ip_address, user_agent
- Sessions can be deleted individually or all at once for a user
- Session tokens are 64-character random strings

### 4. Verification Tokens

- Two tokens are generated per auth request:
  - `verification_token`: In email link (for validation)
  - `polling_token`: In browser URL (for status checking)
- Both tokens expire based on the same timestamp
- Tokens are soft deleted after use

### 5. Email Link Behavior

When a user clicks the verification link:
- No session is created for that device
- Only marks the verification as complete in the database
- Redirects to a success page instructing user to close the tab
- Original browser (polling) will detect and create its own session

### 6. Manual Reload After Timeout

If polling stops after 10 minutes without verification:
- User must manually reload the page
- Polling will restart if token is still valid
- User will see "token expired" if time has passed

## API Endpoints

### `/api/auth/signup`
- **Method**: POST
- **Purpose**: Create pending signup and send verification email
- **Returns**: `{ pollingToken }`

### `/api/auth/login`
- **Method**: POST
- **Purpose**: Send magic link email
- **Returns**: `{ pollingToken }`

### `/api/auth/verify`
- **Method**: GET
- **Purpose**: Verify email token and create user
- **Query params**: `token`, `type` (signup/login), `lang`
- **Behavior**: Marks verification, redirects to result page
- **Important**: Does NOT create session

### `/api/auth/check-verification`
- **Method**: GET
- **Purpose**: Poll for verification status
- **Query params**: `token` (pollingToken)
- **Returns**: `{ verified: boolean, expired: boolean }`
- **Behavior**: Creates session for polling browser when verified

### `/api/auth/resend`
- **Method**: POST
- **Purpose**: Resend verification email
- **Body**: `{ email, type }`

## Database Schema

### Verification Tokens Table
```sql
- id: UUID
- user_id: UUID (nullable)
- email: VARCHAR
- token: VARCHAR (verification token in email)
- token_type: 'signup' | 'login'
- expires_at: TIMESTAMP
- used_at: TIMESTAMP (nullable)
- is_deleted: BOOLEAN
- deleted_at: TIMESTAMP (nullable)
- polling_token: VARCHAR (for browser polling)
- verified_user_id: UUID (set when email is verified)
- created_at: TIMESTAMP
```

### Sessions Table
```sql
- id: UUID
- user_id: UUID
- session_token: VARCHAR (64 chars)
- expires_at: TIMESTAMP
- ip_address: INET (nullable)
- user_agent: TEXT (nullable)
- is_deleted: BOOLEAN
- deleted_at: TIMESTAMP (nullable)
- created_at: TIMESTAMP
- last_active_at: TIMESTAMP
```

## Testing the Auth Flow

### Manual Testing Steps

1. **Signup Flow**
   - Fill signup form with email
   - Don't click email link immediately
   - Observe polling in network tab (every 5 seconds)
   - Click email link on a different device
   - Verify email-clicking device shows success message
   - Verify original device redirects to dashboard
   - Verify only one session is created

2. **Timeout Testing**
   - Start signup flow
   - Wait 10 minutes without clicking email
   - Verify polling stops
   - Reload page and observe polling restarts
   - Wait for token to expire (30/15 minutes)
   - Verify token expired error

3. **Security Testing**
   - Open email link on different device
   - Verify that device does NOT get authenticated
   - Try to access protected routes on that device
   - Verify original device is the only one authenticated

## Common Issues

### Issue: Polling continues indefinitely
- **Cause**: Token not being marked as verified
- **Check**: Database `verified_user_id` column is set
- **Fix**: Verify `markPollingTokenVerified()` is called

### Issue: Both devices get authenticated
- **Cause**: Old code path creating session in `/api/auth/verify`
- **Check**: Verify `/api/auth/verify` does not call `createSession()`
- **Fix**: Ensure only `/api/auth/check-verification` creates sessions

### Issue: User must reload after timeout
- **Expected behavior**: Polling stops after 10 minutes
- **Workaround**: User manually reloads page
- **Configuration**: Adjust `POLLING_MAX_DURATION_MINUTES`

### Issue: Environment variables not working
- **Cause**: Missing `NEXT_PUBLIC_` prefix for polling vars
- **Fix**: Add `NEXT_PUBLIC_` prefix in `.env` file
- **Restart**: Restart dev server after changes

## Files Modified

### Recent Changes (January 2026)

1. **`/api/auth/verify/route.ts`**
   - Removed session creation (security improvement)
   - Changed redirect to `verify-result?success=true`
   - Removed unused imports

2. **`/verify-email/page.tsx`**
   - Made polling rate configurable via env var
   - Made max polling duration configurable via env var

3. **`/verify-result/page.tsx`**
   - Added success state with green checkmark
   - Added success message translations
   - Improved UX for email verification

4. **`.env.example`** (new file)
   - Added all authentication-related env vars
   - Documented default values and purposes

5. **Translations**
   - `i18n/translations/en.json`: Added success messages
   - `i18n/translations/ar.json`: Added success messages (Arabic)

## Security Best Practices

1. **Never authenticate the email-clicking device**
   - Only the original browser should get a session
   - Email links can be intercepted or opened on shared devices

2. **Always validate token expiry**
   - Check expires_at before processing any token
   - Return appropriate error for expired tokens

3. **Use secure session tokens**
   - 64-character random strings
   - HttpOnly cookies prevent XSS
   - Secure cookies in production (HTTPS only)

4. **Limit polling duration**
   - Prevents unnecessary server load
   - Forces user to reload and verify token validity
   - Default 10 minutes is reasonable

5. **Soft delete tokens**
   - Keep records for audit trail
   - Use is_deleted flag instead of hard delete

## Future Enhancements

### Potential Improvements

1. **WebSocket for real-time updates**
   - Replace polling with WebSocket connections
   - More efficient for verification status
   - Requires infrastructure changes

2. **Multiple device authentication (optional)**
   - Allow users to authenticate multiple devices
   - Add user setting: "Allow multiple device login"
   - Requires session management updates

3. **Session management UI**
   - Show active sessions in user profile
   - Allow users to revoke specific sessions
   - Display device info (IP, user agent, location)

4. **Email link expiration warnings**
   - Send reminder email before link expires
   - Show countdown timer on verify page
   - Improve user experience

5. **Rate limiting**
   - Limit email resend attempts
   - Prevent abuse of signup/login endpoints
   - Implement IP-based throttling

## Support & Troubleshooting

For issues with authentication:
1. Check environment variables are set correctly
2. Verify database migrations are applied
3. Check browser console for JavaScript errors
4. Review server logs for API errors
5. Test with different browsers/devices

## References

- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables
- HTTP-Only Cookies: https://owasp.org/www-community/HttpOnly
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
