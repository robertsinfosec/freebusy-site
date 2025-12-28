import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AvailabilityCard } from '@/components/AvailabilityCard'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
}))

const weekSectionSpy = vi.fn()
vi.mock('@/components/WeekSection', () => ({
  WeekSection: (props: { startDate: Date }) => {
    weekSectionSpy(props)
    return <div data-testid="week-section">{props.startDate.toISOString()}</div>
  }
}))

describe('AvailabilityCard', () => {
  it('renders disabled state when disabledMessage present', () => {
    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busyBlocks={[]}
        disabledMessage="Free/busy time is not being shared right now."
        unavailableMessage={null}
        weekStarts={[new Date('2025-12-21T00:00:00Z'), new Date('2025-12-28T00:00:00Z')]}
      />
    )

    expect(screen.getByText(/free\/busy sharing is turned off/i)).toBeInTheDocument()
  })

  it('renders unavailable state when unavailableMessage present', () => {
    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busyBlocks={[]}
        disabledMessage={null}
        unavailableMessage="There was a problem getting availability. Please try again later."
        weekStarts={[new Date('2025-12-21T00:00:00Z'), new Date('2025-12-28T00:00:00Z')]}
      />
    )

    expect(screen.getByText(/couldn’t load availability/i)).toBeInTheDocument()
  })

  it('renders the expected number of weeks when available', () => {
    weekSectionSpy.mockClear()

    const weekStarts = [
      new Date('2025-12-21T00:00:00Z'),
      new Date('2025-12-28T00:00:00Z'),
      new Date('2026-01-04T00:00:00Z'),
      new Date('2026-01-11T00:00:00Z')
    ]

    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busyBlocks={[]}
        disabledMessage={null}
        unavailableMessage={null}
        weekStarts={weekStarts}
      />
    )

    expect(weekSectionSpy).toHaveBeenCalledTimes(4)
    expect(screen.getAllByTestId('week-section')).toHaveLength(4)
  })
})
