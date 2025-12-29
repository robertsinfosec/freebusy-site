import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false)
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: useIsMobileMock
}))

import { AvailabilityCard } from '@/components/AvailabilityCard'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
}))

const weekSectionSpy = vi.fn()
vi.mock('@/components/WeekSection', () => ({
  WeekSection: (props: { ownerDays: Array<{ ownerDate: string }> }) => {
    weekSectionSpy(props)
    return <div data-testid="week-section">{props.ownerDays[0]?.ownerDate ?? 'empty'}</div>
  }
}))

describe('AvailabilityCard', () => {
  it('renders disabled state when disabledMessage present', () => {
    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage="Free/busy time is not being shared right now."
        unavailableMessage={null}
        ownerWeeks={[[{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }]]}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={() => {}}
      />
    )

    expect(screen.getByText(/free\/busy sharing is turned off/i)).toBeInTheDocument()
  })

  it('renders unavailable state when unavailableMessage present', () => {
    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage={null}
        unavailableMessage="There was a problem getting availability. Please try again later."
        ownerWeeks={[[{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }]]}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={() => {}}
      />
    )

    expect(screen.getByText(/couldn’t load availability/i)).toBeInTheDocument()
  })

  it('renders the expected number of weeks when available', () => {
    weekSectionSpy.mockClear()

    const ownerWeeks = [
      [{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }],
      [{ ownerDate: '2025-12-28', dayOfWeek: 7, startUtcMs: 1, endUtcMs: 2 }],
      [{ ownerDate: '2026-01-04', dayOfWeek: 7, startUtcMs: 2, endUtcMs: 3 }],
      [{ ownerDate: '2026-01-11', dayOfWeek: 7, startUtcMs: 3, endUtcMs: 4 }]
    ]

    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage={null}
        unavailableMessage={null}
        ownerWeeks={ownerWeeks}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={() => {}}
      />
    )

    expect(screen.getAllByTestId('week-section')).toHaveLength(4)
  })

  it('calls onRefresh when refresh clicked', async () => {
    const onRefresh = vi.fn()

    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage={null}
        unavailableMessage={null}
        ownerWeeks={[[{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }]]}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={onRefresh}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('copies export text when Copy clicked', async () => {
    useIsMobileMock.mockReturnValueOnce(false)

    const writeText = vi.fn().mockResolvedValue(undefined)
    // @ts-expect-error - test shim
    globalThis.navigator.clipboard = { writeText }

    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage={null}
        unavailableMessage={null}
        ownerWeeks={[[{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }]]}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={() => {}}
        availabilityExportText={'hello availability'}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }))
    expect(writeText).toHaveBeenCalledWith('hello availability')
  })

  it('hides Copy/Download from mobile actions menu when no export is available', async () => {
    useIsMobileMock.mockReturnValueOnce(true)

    render(
      <AvailabilityCard
        today={new Date('2025-12-27T00:00:00Z')}
        busy={[]}
        disabledMessage="Free/busy time is not being shared right now."
        unavailableMessage={null}
        ownerWeeks={[[{ ownerDate: '2025-12-21', dayOfWeek: 7, startUtcMs: 0, endUtcMs: 1 }]]}
        viewTimeZone="Etc/UTC"
        ownerTimeZone="Etc/UTC"
        onRefresh={() => {}}
        availabilityExportText={null}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /availability actions/i }))
    expect(screen.queryByText(/^copy$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/download/i)).not.toBeInTheDocument()
    expect(screen.getByText(/refresh/i)).toBeInTheDocument()
  })
})
