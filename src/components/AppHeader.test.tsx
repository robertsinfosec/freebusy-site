import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { AppHeader } from '@/components/AppHeader'

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />
}))

describe('AppHeader', () => {
  it('renders title and theme toggle', () => {
    render(<AppHeader loading={false} onRefresh={() => {}} timeZone="America/New_York" calendarTimeZone="America/New_York" />)
    expect(screen.getByText('robertsinfosec Free/Busy')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('disables refresh button when loading', () => {
    render(<AppHeader loading={true} onRefresh={() => {}} timeZone="America/New_York" calendarTimeZone="America/New_York" />)
    const refresh = screen.getByRole('button', { name: /refresh/i })
    expect(refresh).toBeDisabled()
  })

  it('disables refresh button when rate limited', () => {
    // Far-future timestamp ensures disabled regardless of local clock
    render(
      <AppHeader
        loading={false}
        onRefresh={() => {}}
        timeZone="America/New_York"
        calendarTimeZone="America/New_York"
        refreshDisabledUntil="2999-01-01T00:00:00.000Z"
      />
    )
    const refresh = screen.getByRole('button', { name: /refresh/i })
    expect(refresh).toBeDisabled()
  })

  it('calls onRefresh when refresh clicked', () => {
    const onRefresh = vi.fn()
    render(<AppHeader loading={false} onRefresh={onRefresh} timeZone="America/New_York" calendarTimeZone="America/New_York" />)

    fireEvent.click(screen.getByRole('button', { name: /refresh/i }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
