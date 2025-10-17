'use client'

import { useThemeStore } from '@app/store/theme.store'
import { useEffect } from 'react'

export const ThemeToggle = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore()

  useEffect(() => {
    setTheme(theme)
  }, [setTheme, theme])

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌞 Light Mode' : '🌙 Dark Mode'}
    </button>
  )
}
