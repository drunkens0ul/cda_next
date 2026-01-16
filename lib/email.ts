import sgMail from '@sendgrid/mail'
import { getVerificationEmailTemplate, getMagicLinkEmailTemplate, getEventRegistrationEmailTemplate } from './email-templates'
import { defaultLocale } from '@/i18n/config'

// Lazy initialization to avoid build-time errors
let isInitialized = false

function initSendGrid() {
  if (!isInitialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    isInitialized = true
  }
}

function getFromEmail() {
  return process.env.SENDGRID_FROM_EMAIL || 'no-reply@nihilbabu.com'
}

function getFromName() {
  return process.env.SENDGRID_FROM_NAME || 'Dubai Communicates'
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  try {
    initSendGrid()

    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured')
      return false
    }

    await sgMail.send({
      to,
      from: {
        email: getFromEmail(),
        name: getFromName(),
      },
      subject,
      html,
      text,
    })
    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string,
  lang: 'en' | 'ar' = defaultLocale
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/${lang}/verify?token=${token}&type=signup`

  const { subject, html, text } = getVerificationEmailTemplate({
    firstName,
    verificationUrl,
    lang,
  })

  return sendEmail({ to: email, subject, html, text })
}

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  lang: 'en' | 'ar' = defaultLocale
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLinkUrl = `${baseUrl}/${lang}/verify?token=${token}&type=login`

  const { subject, html, text } = getMagicLinkEmailTemplate({
    email,
    magicLinkUrl,
    lang,
  })

  return sendEmail({ to: email, subject, html, text })
}

interface EventDetails {
  title: string
  titleAr?: string
  date: string
  time: string
  isVirtual: boolean
  location?: string
  locationAr?: string
}

export async function sendEventRegistrationEmail(
  email: string,
  firstName: string,
  eventDetails: EventDetails
): Promise<boolean> {
  const { subject, html, text } = getEventRegistrationEmailTemplate({
    email,
    firstName,
    eventTitle: eventDetails.title,
    eventTitleAr: eventDetails.titleAr,
    eventDate: eventDetails.date,
    eventTime: eventDetails.time,
    isVirtual: eventDetails.isVirtual,
    location: eventDetails.location,
    locationAr: eventDetails.locationAr,
  })

  return sendEmail({ to: email, subject, html, text })
}
