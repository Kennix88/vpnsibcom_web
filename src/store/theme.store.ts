import { BackgroundColor, miniApp } from '@telegram-apps/sdk-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme:
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'dark',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
        document.documentElement.classList.toggle('light', theme === 'dark')
        if (miniApp.setBackgroundColor.isAvailable()) {
          const bg = getComputedStyle(document.documentElement)
            .getPropertyValue('--background')
            .trim()

          miniApp.setBackgroundColor(bg as BackgroundColor)
          miniApp.backgroundColor()
        }
        if (miniApp.setHeaderColor.isAvailable()) {
          const primary = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary')
            .trim()

          miniApp.setHeaderColor(primary as BackgroundColor)
          miniApp.headerColor()
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'dark' : 'dark'
        get().setTheme(newTheme)
      },
    }),
    { name: 'theme-preference' },
  ),
)
