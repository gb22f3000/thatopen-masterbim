export type AppThemeId = 'dark' | 'sky' | 'light'
export type ViewerBgId = 'dark' | 'sky' | 'mist' | 'white'

export const THEME_STORAGE_KEY = 'thatopen-masterbim-theme'
export const VIEWER_BG_STORAGE_KEY = 'thatopen-masterbim-viewer-bg'

export const APP_THEMES: Record<
  AppThemeId,
  { label: string; description: string }
> = {
  dark: { label: 'Dark', description: 'Graphite workspace' },
  sky: { label: 'Sky', description: 'Cool blue panels' },
  light: { label: 'Light', description: 'Bright drafting board' },
}

export const VIEWER_BACKGROUNDS: Record<
  ViewerBgId,
  { label: string; hex: number; css: string }
> = {
  dark: { label: 'Dark', hex: 0x202124, css: '#202124' },
  sky: { label: 'Sky blue', hex: 0xb8d4f0, css: '#b8d4f0' },
  mist: { label: 'Mist', hex: 0xd9e2ec, css: '#d9e2ec' },
  white: { label: 'White', hex: 0xf4f6f8, css: '#f4f6f8' },
}

export function readAppTheme(): AppThemeId {
  const raw = localStorage.getItem(THEME_STORAGE_KEY)
  if (raw === 'sky' || raw === 'light' || raw === 'dark') return raw
  return 'dark'
}

export function writeAppTheme(theme: AppThemeId) {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  document.documentElement.dataset.theme = theme
  document.documentElement.classList.toggle('bim-ui-dark', theme !== 'light')
  document.documentElement.classList.toggle('bim-ui-light', theme === 'light')
}

export function readViewerBg(): ViewerBgId {
  const raw = localStorage.getItem(VIEWER_BG_STORAGE_KEY)
  if (raw === 'sky' || raw === 'mist' || raw === 'white' || raw === 'dark') {
    return raw
  }
  return 'dark'
}

export function writeViewerBg(id: ViewerBgId) {
  localStorage.setItem(VIEWER_BG_STORAGE_KEY, id)
}
