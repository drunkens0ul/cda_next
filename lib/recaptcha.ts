export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('ReCAPTCHA secret key is not configured')
    return false
  }

  if (!token) {
    console.error('ReCAPTCHA token is missing')
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    })

    const data = await response.json()

    if (!data.success) {
      console.error('ReCAPTCHA verification failed:', data['error-codes'])
      return false
    }

    // For reCAPTCHA v2 invisible, we check if success is true
    // You can also add additional checks like hostname if needed
    return true
  } catch (error) {
    console.error('Error verifying reCAPTCHA token:', error)
    return false
  }
}
