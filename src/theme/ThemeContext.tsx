import * as React from 'react'
import {
  AppThemeId,
  ViewerBgId,
  readAppTheme,
  readViewerBg,
  writeAppTheme,
  writeViewerBg,
} from './themeStore'

type ThemeContextValue = {
  appTheme: AppThemeId
  viewerBg: ViewerBgId
  setAppTheme: (t: AppThemeId) => void
  setViewerBg: (b: ViewerBgId) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appTheme, setAppThemeState] = React.useState<AppThemeId>(() => {
    const t = readAppTheme()
    writeAppTheme(t)
    return t
  })
  const [viewerBg, setViewerBgState] = React.useState<ViewerBgId>(() =>
    readViewerBg()
  )

  const setAppTheme = (t: AppThemeId) => {
    writeAppTheme(t)
    setAppThemeState(t)
  }

  const setViewerBg = (b: ViewerBgId) => {
    writeViewerBg(b)
    setViewerBgState(b)
  }

  return (
    <ThemeContext.Provider
      value={{ appTheme, viewerBg, setAppTheme, setViewerBg }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
