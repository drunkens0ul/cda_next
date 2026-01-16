// HTML escape function to prevent XSS in email templates
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

interface VerificationEmailParams {
  firstName: string
  verificationUrl: string
  lang: 'en' | 'ar'
}

interface MagicLinkEmailParams {
  email: string
  magicLinkUrl: string
  lang: 'en' | 'ar'
}

interface EventRegistrationEmailParams {
  email: string
  firstName: string
  eventTitle: string
  eventTitleAr?: string
  eventDate: string
  eventTime: string
  isVirtual: boolean
  location?: string
  locationAr?: string
}

const translations = {
  en: {
    verification: {
      subject: 'Verify your email - Dubai Communicates in Emirati Sign Language',
      greeting: 'Hello',
      thanks: 'Thank you for signing up for Dubai Communicates in Emirati Sign Language.',
      instruction: 'Please click the button below to verify your email address:',
      button: 'Verify Email',
      expiry: 'This link will expire in 30 minutes.',
      ignore: "If you didn't create an account, you can safely ignore this email.",
      footer: 'Dubai Communicates in Emirati Sign Language\nCommunity Development Authority',
    },
    magicLink: {
      subject: 'Your login link - Dubai Communicates in Emirati Sign Language',
      greeting: 'Hello',
      instruction: 'Click the button below to log in to your Dubai Communicates account:',
      button: 'Log In',
      expiry: 'This link will expire in 15 minutes.',
      ignore: "If you didn't request this login link, you can safely ignore this email.",
      footer: 'Dubai Communicates in Emirati Sign Language\nCommunity Development Authority',
    },
    eventRegistration: {
      subject: 'Registration Confirmed - Dubai Communicates in Emirati Sign Language',
      greeting: 'Dear Participant',
      thanks: 'Thank you for registering for Dubai Communicates Emirati Sign Language, an initiative dedicated to promoting inclusive communication and strengthening community connection through sign language.',
      detailsTitle: 'Event Details:',
      date: 'Date',
      time: 'Time',
      format: 'Format',
      virtualSession: 'Virtual session',
      inPerson: 'In-person event',
      location: 'Location',
      accessLink: 'Access Link',
      accessLinkNote: 'The session link will be shared prior to the event',
      keepEmail: 'Please keep this email for your reference.',
      lookForward: 'We look forward to your participation in this meaningful initiative and to your contribution in fostering an inclusive and accessible society.',
      inquiries: 'For any inquiries, please contact us at:',
      regards: 'Warm regards,',
      team: 'The Organizing Team',
      initiative: 'Dubai Communicates Emirati Sign Language',
      organization: 'Community Development Authority',
    },
  },
  ar: {
    verification: {
      subject: 'تحقق من بريدك الإلكتروني - دبي تتواصل بلغة الإشارة الإماراتية',
      greeting: 'مرحباً',
      thanks: 'شكراً لتسجيلك في دبي تتواصل بلغة الإشارة الإماراتية.',
      instruction: 'يرجى النقر على الزر أدناه للتحقق من عنوان بريدك الإلكتروني:',
      button: 'تحقق من البريد الإلكتروني',
      expiry: 'ستنتهي صلاحية هذا الرابط خلال 30 دقيقة.',
      ignore: 'إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
      footer: 'دبي تتواصل بلغة الإشارة الإماراتية\nهيئة تنمية المجتمع',
    },
    magicLink: {
      subject: 'رابط تسجيل الدخول - دبي تتواصل بلغة الإشارة الإماراتية',
      greeting: 'مرحباً',
      instruction: 'انقر على الزر أدناه لتسجيل الدخول إلى حسابك في دبي تتواصل:',
      button: 'تسجيل الدخول',
      expiry: 'ستنتهي صلاحية هذا الرابط خلال 15 دقيقة.',
      ignore: 'إذا لم تطلب رابط تسجيل الدخول هذا، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
      footer: 'دبي تتواصل بلغة الإشارة الإماراتية\nهيئة تنمية المجتمع',
    },
    eventRegistration: {
      subject: 'تأكيد التسجيل - دبي تتواصل بلغة الإشارة الإماراتية',
      greeting: 'عزيزي المشارك',
      thanks: 'يسعدنا تأكيد تسجيلكم في مبادرة دبي تتواصل بلغة الإشارة الإماراتية، والتي تهدف إلى تعزيز ثقافة التواصل الشامل وترسيخ قيم الدمج المجتمعي.',
      detailsTitle: 'تفاصيل الفعالية:',
      date: 'التاريخ',
      time: 'الوقت',
      format: 'النوع',
      virtualSession: 'فعالية افتراضية (عن بُعد)',
      inPerson: 'فعالية حضورية',
      location: 'الموقع',
      accessLink: 'رابط المشاركة',
      accessLinkNote: 'سيتم إرسال رابط الدخول قبل موعد الفعالية',
      keepEmail: 'يرجى الاحتفاظ بهذه الرسالة للرجوع إليها عند الحاجة.',
      lookForward: 'نترقب مشاركتكم في هذه التجربة المجتمعية الهادفة، ومساهمتكم في دعم لغة الإشارة كوسيلة للتواصل الإنساني.',
      inquiries: 'للاستفسارات، يمكنكم التواصل معنا عبر:',
      regards: 'مع خالص التحية،',
      team: 'فريق العمل',
      initiative: 'دبي تتواصل بلغة الإشارة الإماراتية',
      organization: 'هيئة تنمية المجتمع',
    },
  },
}

const baseStyles = `
  body {
    font-family: 'Dubai', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .container {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .logo {
    text-align: center;
    margin-bottom: 30px;
  }
  .logo img {
    max-width: 150px;
  }
  h1 {
    color: #0066CC;
    font-size: 24px;
    margin-bottom: 20px;
  }
  p {
    margin-bottom: 16px;
  }
  .button {
    display: inline-block;
    background-color: #0066CC;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
  }
  .button:hover {
    background-color: #004C99;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #666;
    white-space: pre-line;
  }
  .expiry {
    background-color: #f8f9fa;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    color: #666;
  }
`

export function getVerificationEmailTemplate({
  firstName,
  verificationUrl,
  lang,
}: VerificationEmailParams): { subject: string; html: string; text: string } {
  const t = translations[lang].verification
  const isRtl = lang === 'ar'

  const html = `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h2 style="color: #0066CC;">Dubai Communicates</h2>
    </div>
    <h1>${t.greeting}, ${escapeHtml(firstName)}!</h1>
    <p>${t.thanks}</p>
    <p>${t.instruction}</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">${t.button}</a>
    </div>
    <p class="expiry">${t.expiry}</p>
    <p style="font-size: 14px; color: #666;">${t.ignore}</p>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>
`

  const text = `${t.greeting}, ${firstName}!

${t.thanks}

${t.instruction}

${verificationUrl}

${t.expiry}

${t.ignore}

---
${t.footer}`

  return { subject: t.subject, html, text }
}

export function getMagicLinkEmailTemplate({
  magicLinkUrl,
  lang,
}: MagicLinkEmailParams): { subject: string; html: string; text: string } {
  const t = translations[lang].magicLink
  const isRtl = lang === 'ar'

  const html = `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h2 style="color: #0066CC;">Dubai Communicates</h2>
    </div>
    <h1>${t.greeting}!</h1>
    <p>${t.instruction}</p>
    <div style="text-align: center;">
      <a href="${magicLinkUrl}" class="button">${t.button}</a>
    </div>
    <p class="expiry">${t.expiry}</p>
    <p style="font-size: 14px; color: #666;">${t.ignore}</p>
    <div class="footer">${t.footer}</div>
  </div>
</body>
</html>
`

  const text = `${t.greeting}!

${t.instruction}

${magicLinkUrl}

${t.expiry}

${t.ignore}

---
${t.footer}`

  return { subject: t.subject, html, text }
}

export function getEventRegistrationEmailTemplate({
  email,
  firstName,
  eventTitle: _eventTitle,
  eventTitleAr: _eventTitleAr,
  eventDate,
  eventTime,
  isVirtual,
  location,
  locationAr,
}: EventRegistrationEmailParams): { subject: string; html: string; text: string } {
  // Note: _eventTitle and _eventTitleAr are available but not currently used in template
  const tAr = translations.ar.eventRegistration
  const tEn = translations.en.eventRegistration

  const formatType = isVirtual
    ? { en: tEn.virtualSession, ar: tAr.virtualSession }
    : { en: tEn.inPerson, ar: tAr.inPerson }

  // Add GST suffix to time
  const eventTimeGST = `${eventTime} (GST)`
  const eventTimeGSTAr = `${eventTime} (توقيت الخليج)`

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f4f8;
      line-height: 1.6;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #f0f4f8;
    }
    .header {
      background-color: #f0f4f8;
      padding: 24px 32px;
      text-align: center;
    }
    .header-logos {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }
    .logo-text {
      font-size: 12px;
      font-weight: 600;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .logo-divider {
      width: 1px;
      height: 40px;
      background-color: #cbd5e1;
      margin: 0 16px;
    }
    .content-card {
      background-color: #ffffff;
      margin: 0 16px 24px 16px;
      border-radius: 8px;
      padding: 40px 32px;
    }
    h1 {
      color: #1e293b;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 24px 0;
    }
    p {
      color: #475569;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .section-title {
      color: #1e293b;
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 16px 0;
    }
    .details-list {
      margin: 0 0 24px 0;
      padding: 0;
    }
    .details-item {
      display: flex;
      margin-bottom: 8px;
    }
    .details-label {
      font-weight: 600;
      color: #1e293b;
      min-width: 100px;
    }
    .details-value {
      color: #475569;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
    }
    .signature {
      margin-top: 32px;
      color: #475569;
    }
    .signature strong {
      color: #1e293b;
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .divider {
      border-top: 2px solid #e2e8f0;
      margin: 32px 0;
    }
    .rtl-section {
      direction: rtl;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header with Logos -->
    <div class="header">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 16px; border-right: 1px solid #cbd5e1; vertical-align: middle;">
                  <img src="https://dcsl.cda.gov.ae/assets/logo.png" alt="Dubai Communicates - دبي تتواصل بلغة الإشارة الإماراتية" style="height: 65px; width: auto;" />
                </td>
                <td style="padding-left: 16px; vertical-align: middle;">
                  <img src="https://dcsl.cda.gov.ae/assets/logo_newsvg.png" alt="Community Development Authority - هيئة تنمية المجتمع" style="height: 55px; width: auto;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Content Card -->
    <div class="content-card">
      <!-- Arabic Section -->
      <div class="rtl-section">
        <h1>${tAr.greeting}${firstName ? ` ${escapeHtml(firstName)}` : ''}،</h1>
        <p>${tAr.thanks}</p>

        <div class="section-title">${tAr.detailsTitle}</div>
        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; width: 120px;">${tAr.date}:</td>
            <td style="padding: 8px 0; color: #475569;"><span dir="ltr" style="unicode-bidi: embed;">${escapeHtml(eventDate)}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tAr.time}:</td>
            <td style="padding: 8px 0; color: #475569;"><span dir="ltr" style="unicode-bidi: embed;">${escapeHtml(eventTimeGSTAr)}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tAr.format}:</td>
            <td style="padding: 8px 0; color: #475569;">${formatType.ar}</td>
          </tr>
          ${isVirtual ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tAr.accessLink}:</td>
            <td style="padding: 8px 0; color: #475569;">${tAr.accessLinkNote}</td>
          </tr>
          ` : locationAr ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tAr.location}:</td>
            <td style="padding: 8px 0; color: #475569;">${escapeHtml(locationAr)}</td>
          </tr>
          ` : ''}
        </table>

        <p>${tAr.keepEmail}</p>
        <p>${tAr.lookForward}</p>

        <p style="margin-top: 24px;">${tAr.inquiries}<br/>
        <a href="mailto:dcslsupport@cda.gov.ae" style="color: #3b82f6;">dcslsupport@cda.gov.ae</a></p>

        <div class="signature">
          ${tAr.regards}<br/>
          <strong>${tAr.team}</strong><br/>
          ${tAr.initiative}<br/>
          <strong>${tAr.organization}</strong>
        </div>
      </div>

      <div class="divider"></div>

      <!-- English Section -->
      <div style="direction: ltr; text-align: left;">
        <h1>${tEn.greeting}${firstName ? ` ${escapeHtml(firstName)}` : ''},</h1>
        <p>${tEn.thanks}</p>

        <div class="section-title">${tEn.detailsTitle}</div>
        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b; width: 120px;">${tEn.date}:</td>
            <td style="padding: 8px 0; color: #475569;">${escapeHtml(eventDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tEn.time}:</td>
            <td style="padding: 8px 0; color: #475569;">${escapeHtml(eventTimeGST)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tEn.format}:</td>
            <td style="padding: 8px 0; color: #475569;">${formatType.en}</td>
          </tr>
          ${isVirtual ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tEn.accessLink}:</td>
            <td style="padding: 8px 0; color: #475569;">${tEn.accessLinkNote}</td>
          </tr>
          ` : location ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${tEn.location}:</td>
            <td style="padding: 8px 0; color: #475569;">${escapeHtml(location)}</td>
          </tr>
          ` : ''}
        </table>

        <p>${tEn.keepEmail}</p>
        <p>${tEn.lookForward}</p>

        <p style="margin-top: 24px;">${tEn.inquiries}<br/>
        <a href="mailto:dcslsupport@cda.gov.ae" style="color: #3b82f6;">dcslsupport@cda.gov.ae</a></p>

        <div class="signature">
          ${tEn.regards}<br/>
          <strong>${tEn.team}</strong><br/>
          ${tEn.initiative}<br/>
          <strong>${tEn.organization}</strong>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This email was sent to <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>.
    </div>
  </div>
</body>
</html>
`

  const text = `${tAr.greeting}${firstName ? ` ${firstName}` : ''}،

${tAr.thanks}

${tAr.detailsTitle}
${tAr.date}: ${eventDate}
${tAr.time}: ${eventTimeGSTAr}
${tAr.format}: ${formatType.ar}
${isVirtual ? `${tAr.accessLink}: ${tAr.accessLinkNote}` : locationAr ? `${tAr.location}: ${locationAr}` : ''}

${tAr.keepEmail}
${tAr.lookForward}

${tAr.inquiries}
Email: dcslsupport@cda.gov.ae

${tAr.regards}
${tAr.team}
${tAr.initiative}
${tAr.organization}

---

${tEn.greeting}${firstName ? ` ${firstName}` : ''},

${tEn.thanks}

${tEn.detailsTitle}
${tEn.date}: ${eventDate}
${tEn.time}: ${eventTimeGST}
${tEn.format}: ${formatType.en}
${isVirtual ? `${tEn.accessLink}: ${tEn.accessLinkNote}` : location ? `${tEn.location}: ${location}` : ''}

${tEn.keepEmail}
${tEn.lookForward}

${tEn.inquiries}
Email: dcslsupport@cda.gov.ae

${tEn.regards}
${tEn.team}
${tEn.initiative}
${tEn.organization}

---
This email was sent to ${email}.`

  // Use Arabic subject with English in parentheses
  const subject = `${tAr.subject} | ${tEn.subject}`

  return { subject, html, text }
}
