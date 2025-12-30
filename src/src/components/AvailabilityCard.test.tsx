import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
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

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError
  }
}))

beforeEach(() => {
  useIsMobileMock.mockReset()
  useIsMobileMock.mockReturnValue(false)

  // Ensure we don't leak clipboard stubs across tests.
  // @ts-expect-error - test shim
  globalThis.navigator.clipboard = undefined

  toastSuccess.mockClear()
  toastError.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

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

  it('falls back to execCommand copy when clipboard API is unavailable', async () => {
    // @ts-expect-error - test shim
    globalThis.navigator.clipboard = undefined
    const execSpy = vi.fn(() => true)
    // jsdom doesn't always define this API.
    ;(document as unknown as { execCommand: (cmd: string) => boolean }).execCommand = execSpy

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
    expect(execSpy).toHaveBeenCalledWith('copy')
    expect(toastSuccess).toHaveBeenCalledWith('Copied to clipboard')
  })

  it('disables refresh and shows rate limit title when refreshDisabledUntil is in the future', () => {
    useIsMobileMock.mockReturnValueOnce(false)

    const future = new Date(Date.now() + 60_000).toISOString()

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
        refreshDisabledUntil={future}
      />
    )

    const refresh = screen.getByRole('button', { name: /refresh/i })
    expect(refresh).toBeDisabled()
    expect(refresh.getAttribute('title') ?? '').toMatch(/rate limited until/i)
  })

  it('downloads export text from the desktop Copy options menu when available', async () => {
    useIsMobileMock.mockReturnValueOnce(false)

    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

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
        availabilityExportFileName={'availability-test.txt'}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /copy options/i }))
    await userEvent.click(screen.getByText(/download \(\.txt\)/i))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
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
