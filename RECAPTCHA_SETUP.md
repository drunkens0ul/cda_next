# reCAPTCHA v2 Invisible Setup

This project is configured to use reCAPTCHA v2 invisible mode for bot protection.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"
```

## Getting reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create)
2. Sign in with your Google account
3. Fill in the form:
   - **Label**: Your project name (e.g., "CDA App")
   - **reCAPTCHA type**: Choose "reCAPTCHA v2" and then "Invisible reCAPTCHA Badge"
   - **Domains**: Add your domain (e.g., "localhost" for development, your production domain)
4. Accept the terms of service
5. Submit the form
6. Copy the **Site Key** and **Secret Key** to your environment variables

## Usage

### Frontend Component

```tsx
import Recaptcha, { RecaptchaRef } from '@/components/Recaptcha'

function MyForm() {
  const recaptchaRef = useRef<RecaptchaRef>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Execute reCAPTCHA
    const token = await recaptchaRef.current?.execute()
    
    if (token) {
      // Submit form with token
      await submitForm({ ...formData, recaptchaToken: token })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <Recaptcha
        ref={recaptchaRef}
        onVerify={(token) => console.log('Verified:', token)}
        onError={() => console.error('reCAPTCHA error')}
        onExpire={() => console.warn('reCAPTCHA expired')}
      />
    </form>
  )
}
```

### Backend Verification

```typescript
import { verifyRecaptchaToken } from '@/lib/recaptcha'

// In your API route
const isValid = await verifyRecaptchaToken(recaptchaToken)

if (!isValid) {
  return { error: 'reCAPTCHA verification failed' }
}
```

## Files Created/Modified

- `lib/recaptcha.ts` - Server-side verification function
- `components/Recaptcha.tsx` - React component for reCAPTCHA
- `lib/types/auth.ts` - Updated auth interfaces with recaptchaToken field
- `i18n/translations/en.json` - Added English error message
- `i18n/translations/ar.json` - Added Arabic error message

## Notes

- The reCAPTCHA badge will appear in the bottom-right corner of your site
- For development, you can use "localhost" as a domain
- The invisible reCAPTCHA will only trigger when you programmatically execute it
- Make sure to handle the token verification on the server side for security
