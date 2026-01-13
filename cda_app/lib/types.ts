export type Locale = 'en' | 'ar'

export type TranslationKey = string
export type TranslationNamespace = string

export interface TranslationMessages {
  [key: string]: string | TranslationMessages
}

export interface Event {
  id: number
  title: string
  date: string
  time: string
  description: string
  attendees: string
  image: string
}

export interface Sponsor {
  id: number
  name: string
  image: string
  alt?: string
}

export interface Pillar {
  title: string
  description: string
}

export interface Benefit {
  text: string
}
