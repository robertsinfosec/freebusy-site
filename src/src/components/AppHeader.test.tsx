import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AppHeader } from '@/components/AppHeader'

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />
}))

describe('AppHeader', () => {
  it('renders title and theme toggle', () => {
    render(<AppHeader loading={false} timeZone="America/New_York" calendarTimeZone="America/New_York" />)
    expect(screen.getByText('robertsinfosec Free/Busy')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })
})
