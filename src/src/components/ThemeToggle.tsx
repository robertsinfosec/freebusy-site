import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, SunDim } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

type ThemeMode = 'system' | 'light' | 'dark'

export function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const resolved = theme === 'system'
      ? (systemTheme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
      : theme

    root.classList.remove('light', 'dark')
    if (resolved === 'dark') {
      root.classList.add('dark')
      root.dataset.theme = 'dark'
    } else {
      root.classList.add('light')
      root.dataset.theme = 'light'
    }
  }, [theme, systemTheme])

  const cycleTheme = () => {
    const order: ThemeMode[] = ['system', 'light', 'dark']
    const current: ThemeMode = (theme === 'light' || theme === 'dark' || theme === 'system') ? theme : 'system'
    const next = order[(order.indexOf(current) + 1) % order.length]
    setTheme(next)
  }

  const icon = theme === 'system'
    ? <Monitor size={18} />
    : theme === 'light'
      ? <SunDim size={18} />
      : <Moon size={18} />

  const label = theme === 'system'
    ? 'System'
    : theme === 'light'
      ? 'Light'
      : 'Dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10"
      onClick={cycleTheme}
      aria-label={`Theme: ${label}`}
      title={`Theme: ${label}`}
    >
      {icon}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
