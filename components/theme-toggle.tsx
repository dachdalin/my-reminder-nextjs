'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <button
      onClick={cycle}
      title={
        theme === 'light'
          ? 'ប្ដូរទៅ Dark Mode'
          : theme === 'dark'
            ? 'ប្ដូរទៅ System Mode'
            : 'ប្ដូរទៅ Light Mode'
      }
      className="relative p-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
      aria-label="ប្ដូររូបរាង"
    >
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          theme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <Sun className="w-5 h-5 text-amber-500" />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <Moon className="w-5 h-5 text-indigo-400" />
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          theme === 'system' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <Monitor className="w-5 h-5" />
      </span>
      {/* Invisible placeholder to maintain button size */}
      <Sun className="w-5 h-5 opacity-0" aria-hidden />
    </button>
  )
}
