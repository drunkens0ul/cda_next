'use client'

import { memo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  CalendarIcon,
  ClockIcon,
  LocationIcon,
  UsersIcon,
  CheckCircleIcon,
  ShareIcon,
  ChevronLeftIcon
} from '@/components/icons'
import Link from 'next/link'

// Mock event data - will be replaced with dynamic data later
const mockEvent = {
  slug: 'tech-innovation-summit',
  title: 'Tech Innovation Summit',
  titleAr: 'قمة الابتكار التقني',
  date: 'January 15, 2026',
  dateAr: '١٥ يناير ٢٠٢٦',
  time: '9:00 AM - 5:00 PM PST',
  timeAr: '٩:٠٠ ص - ٥:٠٠ م',
  location: 'Virtual Event (Microsoft Teams)',
  locationAr: 'فعالية افتراضية (مايكروسوفت تيمز)',
  registered: 1250,
  spotsLeft: 750,
  image: '/assets/event1.jpg',
  description: `The Tech Innovation Summit 2024 brings together the brightest minds in technology to discuss emerging trends, share insights, and explore the future of innovation. This full-day virtual event features keynote presentations, interactive workshops, and networking opportunities with industry leaders.

Whether you're a seasoned professional or just starting your tech journey, this summit offers valuable perspectives on AI, cloud computing, cybersecurity, and digital transformation. Join us to learn, connect, and be inspired by the possibilities of tomorrow's technology.`,
  descriptionAr: `تجمع قمة الابتكار التقني 2024 ألمع العقول في مجال التكنولوجيا لمناقشة الاتجاهات الناشئة، ومشاركة الرؤى، واستكشاف مستقبل الابتكار. تتضمن هذه الفعالية الافتراضية ليوم كامل عروضاً رئيسية، وورش عمل تفاعلية، وفرص للتواصل مع قادة الصناعة.

سواء كنت محترفاً متمرساً أو في بداية رحلتك التقنية، تقدم هذه القمة رؤى قيمة حول الذكاء الاصطناعي، والحوسبة السحابية، والأمن السيبراني، والتحول الرقمي. انضم إلينا للتعلم والتواصل والإلهام بإمكانيات تكنولوجيا الغد.`,
  speakers: [
    { name: 'Sara Chen', role: 'CTO, Tech Ventures', image: '/assets/event1.jpg' },
    { name: 'Sara Chen', role: 'CTO, Tech Ventures', image: '/assets/event2.jpg' },
    { name: 'Sara Chen', role: 'CTO, Tech Ventures', image: '/assets/event3.jpg' },
  ],
  agenda: [
    { time: '9:00 AM', title: 'Opening Keynote', description: 'Welcome and vision for the future technology' },
    { time: '10:30 AM', title: 'Opening Keynote', description: 'Welcome and vision for the future technology' },
    { time: '10:30 AM', title: 'Opening Keynote', description: 'Welcome and vision for the future technology' },
    { time: '10:30 AM', title: 'Opening Keynote', description: 'Welcome and vision for the future technology' },
    { time: '10:30 AM', title: 'Opening Keynote', description: 'Welcome and vision for the future technology' },
  ],
  agendaAr: [
    { time: '٩:٠٠ ص', title: 'الكلمة الافتتاحية', description: 'الترحيب ورؤية لتكنولوجيا المستقبل' },
    { time: '١٠:٣٠ ص', title: 'الكلمة الافتتاحية', description: 'الترحيب ورؤية لتكنولوجيا المستقبل' },
    { time: '١٠:٣٠ ص', title: 'الكلمة الافتتاحية', description: 'الترحيب ورؤية لتكنولوجيا المستقبل' },
    { time: '١٠:٣٠ ص', title: 'الكلمة الافتتاحية', description: 'الترحيب ورؤية لتكنولوجيا المستقبل' },
    { time: '١٠:٣٠ ص', title: 'الكلمة الافتتاحية', description: 'الترحيب ورؤية لتكنولوجيا المستقبل' },
  ],
  benefits: [
    'Access to live',
    'Q&A with speakers',
    'Event recordings',
    'Participation certificate',
    'Networking opportunity',
  ],
  benefitsAr: [
    'الوصول المباشر',
    'أسئلة وأجوبة مع المتحدثين',
    'تسجيلات الفعالية',
    'شهادة مشاركة',
    'فرصة للتواصل',
  ],
}

function EventDetailPage() {
  const t = useTranslations('eventDetail')
  const locale = useLocale()
  const isRtl = locale === 'ar'

  // Use locale-specific data
  const eventTitle = isRtl ? mockEvent.titleAr : mockEvent.title
  const eventDate = isRtl ? mockEvent.dateAr : mockEvent.date
  const eventTime = isRtl ? mockEvent.timeAr : mockEvent.time
  const eventLocation = isRtl ? mockEvent.locationAr : mockEvent.location
  const eventDescription = isRtl ? mockEvent.descriptionAr : mockEvent.description
  const eventAgenda = isRtl ? mockEvent.agendaAr : mockEvent.agenda
  const eventBenefits = isRtl ? mockEvent.benefitsAr : mockEvent.benefits

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Section with Image - Full Width */}
        <div className="relative">
          {/* Back Button - positioned absolutely */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center w-10 h-10 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors absolute top-6 left-6 z-20"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>

          {/* Hero Image - Full Width */}
          <div className="relative h-[350px] md:h-[450px] lg:h-[500px] w-full overflow-hidden">
            <Image
              src={mockEvent.image}
              alt={eventTitle}
              fill
              className="object-cover"
              priority
            />
            {/* Fade effect at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
        </div>

        {/* Content Section */}
        <div className="container-custom -mt-24 relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark mb-6">
                  {eventTitle}
                </h1>

                <div className="prose prose-gray max-w-none">
                  {eventDescription.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-text-gray leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Featured Speakers */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-text-dark mb-6">
                  {t('featuredSpeakers')}
                </h2>

                <div className="flex flex-wrap gap-8">
                  {mockEvent.speakers.map((speaker, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-gray-100">
                        <Image
                          src={speaker.image}
                          alt={speaker.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-semibold text-text-dark">{speaker.name}</h3>
                      <p className="text-sm text-text-gray">{speaker.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Agenda */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-text-dark mb-6">
                  {t('eventAgenda')}
                </h2>

                <div className="space-y-4">
                  {eventAgenda.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <span className="text-primary font-bold min-w-[80px]">{item.time}</span>
                      <div>
                        <h3 className="font-semibold text-text-dark">{item.title}</h3>
                        <p className="text-sm text-text-gray">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
                {/* Event Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-text-gray">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{eventDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-gray">
                    <ClockIcon className="w-5 h-5 text-primary" />
                    <span>{eventTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-gray">
                    <LocationIcon className="w-5 h-5 text-primary" />
                    <span>{eventLocation}</span>
                  </div>
                </div>

                {/* Registration Stats */}
                <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-2 text-text-gray">
                    <UsersIcon className="w-5 h-5" />
                    <span className="text-sm">{mockEvent.registered} {t('registered')}</span>
                  </div>
                  <span className="text-primary font-semibold">
                    {mockEvent.spotsLeft} {t('spotsLeft')}
                  </span>
                </div>

                {/* Register Button */}
                <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4">
                  {t('registerNow')}
                </button>

                {/* Share Button */}
                <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-text-gray py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  <ShareIcon className="w-5 h-5" />
                  {t('shareEvent')}
                </button>

                {/* What You'll Get */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-text-dark mb-4">{t('whatYouGet')}</h3>
                  <div className="space-y-3">
                    {eventBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm text-text-gray">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default memo(EventDetailPage)
