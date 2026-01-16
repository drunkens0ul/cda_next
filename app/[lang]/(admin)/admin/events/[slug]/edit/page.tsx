'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ArrowLeftIcon } from '@/components/icons'
import { toLocalDateString, toLocalTimeString, combineDateAndTime, getGSTOffset } from '@/lib/time'
import type { UpdateEventData, EventWithRegistrationCount } from '@/lib/types/events'
import { defaultLocale } from '@/i18n/config'

export default function EditEventPage() {
  const t = useTranslations('admin')
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string || defaultLocale
  const slug = params.slug as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<EventWithRegistrationCount | null>(null)

  const [formData, setFormData] = useState<UpdateEventData>({
    slug: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    locationAr: '',
    isVirtual: false,
    maxAttendees: undefined,
    imageUrl: '',
    status: 'upcoming',
    showJoinButton: false,
    meetingUrl: '',
    isHighlighted: false,
    registrationDeadlineDate: '',
    registrationDeadlineTime: '',
  })

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${slug}`)
        const data = await response.json()
        if (data.success && data.event) {
          const event = data.event
          setEvent(event)

          // Always use GST offset - convert stored UTC times to GST for display
          const timezoneOffset = getGSTOffset()

          // Convert date string to Date object if needed
          const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date

          setFormData({
            slug: event.slug,
            title: event.title,
            titleAr: event.titleAr || '',
            description: event.description || '',
            descriptionAr: event.descriptionAr || '',
            date: toLocalDateString(eventDate, timezoneOffset),
            startTime: event.startTime ? toLocalTimeString(combineDateAndTime(eventDate, event.startTime), timezoneOffset) : '',
            endTime: event.endTime ? toLocalTimeString(combineDateAndTime(eventDate, event.endTime), timezoneOffset) : '',
            location: event.location || '',
            locationAr: event.locationAr || '',
            isVirtual: event.isVirtual,
            maxAttendees: event.maxAttendees || undefined,
            imageUrl: event.imageUrl || '',
            status: event.status,
            showJoinButton: event.showJoinButton || false,
            meetingUrl: event.meetingUrl || '',
            isHighlighted: event.isHighlighted || false,
            registrationDeadlineDate: event.registrationDeadline
              ? toLocalDateString(new Date(event.registrationDeadline), timezoneOffset)
              : '',
            registrationDeadlineTime: event.registrationDeadline
              ? toLocalTimeString(new Date(event.registrationDeadline), timezoneOffset)
              : '',
          })
        } else {
          setError('Event not found')
        }
      } catch (error) {
        console.error('Failed to fetch event:', error)
        setError('Failed to load event')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvent()
  }, [slug])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? (value ? parseInt(value) : undefined) : value,
    }))
  }

  const generateSlug = () => {
    const slug = formData.title || ''
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Always use GST offset - admin inputs are treated as GST times
      const timezoneOffset = getGSTOffset()
      const response = await fetch(`/api/admin/events/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timezoneOffset }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/${lang}/admin/events`)
      } else {
        setError(data.message || 'Failed to update event')
      }
    } catch (error) {
      console.error('Failed to update event:', error)
      setError('Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${lang}/admin/events`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{t('editEvent')}</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : !event ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Event not found'}</p>
          <Link
            href={`/${lang}/admin/events`}
            className="mt-4 inline-block text-primary hover:underline"
          >
            {t('backToEvents')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('slug')} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="event-url-slug"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('generateFromTitle')}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('titleEn')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('titleAr')}
              </label>
              <input
                type="text"
                name="titleAr"
                value={formData.titleAr}
                onChange={handleChange}
                dir="rtl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('descriptionEn')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('descriptionAr')}
              </label>
              <textarea
                name="descriptionAr"
                value={formData.descriptionAr}
                onChange={handleChange}
                rows={4}
                dir="rtl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('date')} *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('startTime')}
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('endTime')}
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Registration Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('registrationDeadline') || 'Registration Deadline'} ({t('date') || 'Date'})
              </label>
              <input
                type="date"
                name="registrationDeadlineDate"
                value={formData.registrationDeadlineDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('registrationDeadline') || 'Registration Deadline'} ({t('time') || 'Time'})
              </label>
              <input
                type="time"
                name="registrationDeadlineTime"
                value={formData.registrationDeadlineTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 -mt-4">
            {t('registrationDeadlineHelp') || 'Leave empty for no deadline. Registration will close at this date and time.'}
          </p>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('locationEn')}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('locationAr')}
              </label>
              <input
                type="text"
                name="locationAr"
                value={formData.locationAr}
                onChange={handleChange}
                dir="rtl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Virtual, Max Attendees, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isVirtual"
                name="isVirtual"
                checked={formData.isVirtual}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isVirtual" className="text-sm font-medium text-gray-700">
                {t('virtualEvent')}
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('maxAttendees')}
              </label>
              <input
                type="number"
                name="maxAttendees"
                value={formData.maxAttendees || ''}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('status')}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="upcoming">{t('statusUpcoming')}</option>
                <option value="ongoing">{t('statusOngoing')}</option>
                <option value="completed">{t('statusCompleted')}</option>
                <option value="cancelled">{t('statusCancelled')}</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('imageUrl')}
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Meeting Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('meetingSettings') || 'Meeting Settings'}</h3>

            <div className="space-y-4">
              {/* Meeting URL - only show for virtual events */}
              {formData.isVirtual && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('meetingUrl') || 'Meeting URL'}
                  </label>
                  <input
                    type="url"
                    name="meetingUrl"
                    value={formData.meetingUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('meetingUrlHelp') || 'Enter the Zoom, Teams, or other meeting link'}
                  </p>
                </div>
              )}

              {/* Show Join Button */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showJoinButton"
                  name="showJoinButton"
                  checked={formData.showJoinButton}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="showJoinButton" className="text-sm font-medium text-gray-700">
                  {t('showJoinButton') || 'Show Join Button'}
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-7">
                {t('showJoinButtonHelp') || 'Enable this just before the meeting starts so registered users can join'}
              </p>
            </div>
          </div>

          {/* Display Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('displaySettings') || 'Display Settings'}</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isHighlighted"
                name="isHighlighted"
                checked={formData.isHighlighted}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isHighlighted" className="text-sm font-medium text-gray-700">
                {t('highlightEvent') || 'Highlight this Event'}
              </label>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              {t('highlightEventHelp') || 'Show this event in the "Join the Movement" section on the homepage. Only one event can be highlighted at a time.'}
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href={`/${lang}/admin/events`}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <SpinnerIcon className="animate-spin w-4 h-4" />}
              {t('saveChanges')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
