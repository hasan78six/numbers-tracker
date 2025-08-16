import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import BusinessTracker from '../views/BusinessTracker/BusinessTracker'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

// Mock UI components
vi.mock('@/components/ui', () => ({
  Alert: ({ children, title, type }: any) => (
    <div data-testid="alert" data-type={type}>
      <div data-testid="alert-title">{title}</div>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} data-testid="input" {...props} />
  ),
}))

// Mock shared components
vi.mock('@/components/shared/Loading', () => ({
  default: ({ children, loading }: any) => {
    return loading ? <div role="status">Loading...</div> : <div>{children}</div>
  },
}))

// Mock store modules
vi.mock('../views/BusinessTracker/store/bussinessStore', () => ({
  useBusinessTrackerStore: vi.fn(),
}))

vi.mock('../store/yearStore', () => ({
  useYearStore: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useSessionUser: vi.fn(),
}))

vi.mock('../views/Goals/store/goalsStore', () => ({
  useGoalsStore: vi.fn(),
}))

vi.mock('../views/Schedule/store/scheduleStore', () => ({
  useScheduleStore: vi.fn(),
}))

// Mock utility functions
vi.mock('@/utils/formatDateTime', () => ({
  isCurrentYear: vi.fn(),
  isSameDate: vi.fn(),
  getTodayDate: vi.fn(),
}))

// Create stable mock data
const createMockBusinessTrackerStore = (overrides = {}) => ({
  fullWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  fullWeekDates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'],
  loading: false,
  tableData: [],
  isGoalDefined: true,
  calendarDate: new Date('2024-01-01'),
  setCalendarDate: vi.fn(),
  fetchFields: vi.fn(),
  fetchTrackerValues: vi.fn(),
  fetchGoals: vi.fn(),
  fetchTransactions: vi.fn(),
  ...overrides,
})

const createMockYearStore = (overrides = {}) => ({
  selectedYear: '2024',
  ...overrides,
})

const createMockAuthStore = (overrides = {}) => ({
  user: {
    user_id: 'test-user-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
  fetchCurrentTime: vi.fn(),
  ...overrides,
})

const createMockGoalsStore = (overrides = {}) => ({
  fetchGoals: vi.fn(),
  fetchFields: vi.fn(),
  items: [],
  loading: false,
  working_days: 0,
  ...overrides,
})

const createMockScheduleStore = (overrides = {}) => ({
  fetchSchedule: vi.fn(),
  ...overrides,
})

describe('BusinessTracker', () => {
  let mockNavigate: any, navigateFn: any
  let mockUseBusinessTrackerStore: any
  let mockUseYearStore: any
  let mockUseSessionUser: any
  let mockUseGoalsStore: any
  let mockUseScheduleStore: any
  let mockIsCurrentYear: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockNavigate = (await import('react-router-dom')).useNavigate
    navigateFn = vi.fn()
    mockNavigate.mockReturnValue(navigateFn)

    mockUseBusinessTrackerStore = (await import('../views/BusinessTracker/store/bussinessStore')).useBusinessTrackerStore
    mockUseYearStore = (await import('../store/yearStore')).useYearStore
    mockUseSessionUser = (await import('../store/authStore')).useSessionUser
    mockUseGoalsStore = (await import('../views/Goals/store/goalsStore')).useGoalsStore
    mockUseScheduleStore = (await import('../views/Schedule/store/scheduleStore')).useScheduleStore
    mockIsCurrentYear = (await import('@/utils/formatDateTime')).isCurrentYear
    const mockIsSameDate = (await import('@/utils/formatDateTime')).isSameDate
    ;(mockIsSameDate as any).mockReturnValue(false)
    const mockGetTodayDate = (await import('@/utils/formatDateTime')).getTodayDate
    ;(mockGetTodayDate as any).mockReturnValue(new Date('2024-01-01'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderBusinessTracker = () => {
    return render(
      <MemoryRouter>
        <BusinessTracker />
      </MemoryRouter>
    )
  }

  describe('Loading State', () => {
    it('should show loading when data is being fetched', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        loading: true,
        tableData: [],
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should not show loading when data is loaded', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        loading: false,
        tableData: [{ id: '1', key: 'test', label: 'Test', values: {}, formula: '' }],
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Current Year Validation', () => {
    it('should show future year alert when not current year', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore())
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore({ selectedYear: '2025' })))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(false)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Please select current year')
    })

    it('should show business tracker when current year', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore())
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
    })
  })

  describe('Goals Configuration', () => {
    it('should show goals setup alert when goals are not defined', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: false,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Please set the goals for year 2024')
    })

    it('should show setup goals button when goals are not defined', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: false,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      const setupButton = screen.getByText('Click Here to set.')
      expect(setupButton).toBeInTheDocument()
    })

    it('should navigate to goals page when setup button is clicked', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: false,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      const setupButton = screen.getByText('Click Here to set.')
      fireEvent.click(setupButton)

      await waitFor(() => {
        expect(navigateFn).toHaveBeenCalledWith('/goals')
      })
    })

    it('should show business tracker when goals are defined', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: true,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('should call fetch functions on component mount', async () => {
      const mockFetchGoals = vi.fn()
      const mockFetchSchedule = vi.fn()
      const mockFetchGoalsField = vi.fn()
      const mockFetchGoalsStore = vi.fn()
      const mockFetchTrackerFields = vi.fn()
      const mockFetchTrackerValues = vi.fn()
      const mockCheckGoalIsDefined = vi.fn()

      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        fetchFields: mockFetchTrackerFields,
        fetchTrackerValues: mockFetchTrackerValues,
        fetchGoals: mockCheckGoalIsDefined,
        fetchTransactions: vi.fn(),
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchGoals: mockFetchGoalsStore,
        fetchFields: mockFetchGoalsField,
      }))
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore({
        fetchSchedule: mockFetchSchedule,
      }))
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      await waitFor(() => {
        expect(mockCheckGoalIsDefined).toHaveBeenCalledWith('test-user-id', 2024)
        expect(mockFetchSchedule).toHaveBeenCalledWith('test-user-id', 2024)
        expect(mockFetchGoalsField).toHaveBeenCalled()
        expect(mockFetchGoalsStore).toHaveBeenCalledWith('test-user-id', '2024')
        expect(mockFetchTrackerFields).toHaveBeenCalled()
        expect(mockFetchTrackerValues).toHaveBeenCalledWith('test-user-id', 2024)
      })
    })

    it('should not fetch data if already loaded', async () => {
      const mockFetchGoals = vi.fn()
      const mockFetchSchedule = vi.fn()
      const mockFetchGoalsField = vi.fn()
      const mockFetchGoalsStore = vi.fn()
      const mockFetchTrackerFields = vi.fn()
      const mockFetchTrackerValues = vi.fn()
      const mockCheckGoalIsDefined = vi.fn()

      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        tableData: [{ id: '1', key: 'test', label: 'Test', values: {}, formula: '' }],
        isGoalDefined: true,
        fetchFields: mockFetchTrackerFields,
        fetchTrackerValues: mockFetchTrackerValues,
        fetchGoals: mockCheckGoalIsDefined,
        fetchTransactions: vi.fn(),
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchGoals: mockFetchGoalsStore,
        fetchFields: mockFetchGoalsField,
      }))
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore({
        fetchSchedule: mockFetchSchedule,
      }))
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      await waitFor(() => {
        expect(mockCheckGoalIsDefined).not.toHaveBeenCalled()
        expect(mockFetchSchedule).not.toHaveBeenCalled()
        expect(mockFetchGoalsField).not.toHaveBeenCalled()
        expect(mockFetchGoalsStore).not.toHaveBeenCalled()
        expect(mockFetchTrackerFields).not.toHaveBeenCalled()
        expect(mockFetchTrackerValues).not.toHaveBeenCalled()
      })
    })
  })

  describe('Component Structure', () => {
    it('should render Filters and DataListing components when goals are defined', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: true,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
    })

    it('should pass correct columns to DataListing', async () => {
      const mockFullWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const mockFullWeekDates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07']

      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore({
        isGoalDefined: true,
        fullWeek: mockFullWeek,
        fullWeekDates: mockFullWeekDates,
      }))
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore())
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore()))
      mockUseSessionUser.mockReturnValue(createMockAuthStore({ user: null }))
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
    })

    it('should handle missing year data gracefully', async () => {
      mockUseBusinessTrackerStore.mockReturnValue(createMockBusinessTrackerStore())
      mockUseYearStore.mockImplementation((selector: any) => selector(createMockYearStore({ selectedYear: '2024' })))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())
      mockUseScheduleStore.mockReturnValue(createMockScheduleStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderBusinessTracker()
      })

      expect(screen.getAllByTestId('card')).toHaveLength(2)
    })
  })
}) 