export interface I18nString {
  default: string | null
  eng?: string
  swe?: string
}

export interface I18nStringArray {
  default?: string[]
  eng?: string[]
  swe?: string[]
}

export type SupportedLanguage = 'default' | 'eng' | 'swe'
