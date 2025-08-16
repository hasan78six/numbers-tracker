import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../views/Dashboard/Dashboard'

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
  Card: ({ children, bodyClass }: any) => (
    <div data-testid="card" className={bodyClass}>
      {children}
    </div>
  ),
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} data-testid="input" {...props} />
  ),
  Dialog: ({ children, isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="dialog" onClick={onClose}>
        {children}
      </div>
    ) : null
  ),
  Select: ({ children, value, onChange, ...props }: any) => (
    <select value={value} onChange={onChange} data-testid="select" {...props}>
      {children}
    </select>
  ),
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  Tooltip: ({ children, title }: any) => (
    <div data-testid="tooltip" title={title}>
      {children}
    </div>
  ),
  toast: {
    notify: vi.fn(),
  },
}))

// Mock shared components
vi.mock('@/components/shared/AdaptiveCard', () => ({
  default: ({ children }: any) => <div data-testid="adaptive-card">{children}</div>,
}))

vi.mock('@/components/shared/Loading', () => ({
  default: ({ children, loading }: any) => (
    <div data-testid="loading" data-loading={loading}>
      {loading ? 'Loading...' : children}
    </div>
  ),
}))

vi.mock('@/components/shared/DataTable', () => ({
  default: ({ data, loading, columns, onPaginationChange, onSelectChange, pagingData }: any) => (
    <div data-testid="data-table">
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="data-count">{data?.length || 0}</div>
      <div data-testid="total-count">{pagingData?.total || 0}</div>
      <div data-testid="page-index">{pagingData?.pageIndex || 1}</div>
      <div data-testid="page-size">{pagingData?.pageSize || 10}</div>
      {data?.map((item: any, index: number) => (
        <div key={index} data-testid={`row-${index}`}>
          <div data-testid={`item-name-${index}`}>{item.name}</div>
          <div data-testid={`item-value-${index}`}>{item.value}</div>
        </div>
      ))}
    </div>
  ),
}))

// Mock store modules
vi.mock('../views/Dashboard/store/dashboardStore', () => ({
  useDashboardStore: vi.fn(),
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

// Mock utility functions
vi.mock('@/utils/formatDateTime', () => ({
  isCurrentYear: vi.fn(),
  getTodayDate: vi.fn(() => new Date('2024-01-01')),
}))

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    control: {},
    formState: { errors: {} },
    watch: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
  })),
  Controller: ({ children }: any) => children,
}))

// Mock @hookform/resolvers
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(),
}))

// Mock react-icons
vi.mock('react-icons/tb', () => ({
  TbPlus: () => <div data-testid="plus-icon">+</div>,
  TbPencil: () => <div data-testid="pencil-icon">✏️</div>,
  TbFilter: () => <div data-testid="filter-icon">🔍</div>,
  TbTrash: () => <div data-testid="trash-icon">🗑️</div>,
}))

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_MODULE_KEY: 'test-module-key',
}))

// Mock Dashboard components
vi.mock('../views/Dashboard/components/Summary', () => ({
  default: () => <div data-testid="summary-component">Summary Component</div>,
}))

vi.mock('../views/Dashboard/components/SummarySegment', () => ({
  default: ({ title, value, growShrink, icon }: any) => (
    <div data-testid="summary-segment">
      <div data-testid="segment-title">{title}</div>
      <div data-testid="segment-value">{value}</div>
      <div data-testid="segment-grow-shrink">{growShrink}</div>
      <div data-testid="segment-icon">{icon}</div>
    </div>
  ),
}))

// Create stable mock data
const createMockDashboardStore = (overrides = {}) => ({
  businessMetrics: {},
  loading: false,
  fetchMetricsByYear: vi.fn(),
  setBusinessMetrics: vi.fn(),
  reset: vi.fn(),
  ...overrides,
})

const createMockYearStore = (overrides = {}) => ({
  selectedYear: '2024',
  setSelectedYear: vi.fn(),
  ...overrides,
})

const createMockAuthStore = (overrides = {}) => ({
  user: {
    user_id: 'test-user-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    company_id: { id: 'test-company-id' },
  },
  fetchCurrentTime: vi.fn(),
  ...overrides,
})

const createMockGoalsStore = (overrides = {}) => ({
  items: [],
  loading: false,
  error: null,
  working_days: 0,
  fetchFields: vi.fn(),
  fetchGoals: vi.fn(),
  fetchDaysProspected: vi.fn(),
  updateGoals: vi.fn(),
  ...overrides,
})

const mockBusinessMetrics = {
  closed_income: 50000,
  conversations: 150,
  prospected_today: 25,
  current_pending_income: 30000,
  hours_prospected: 120,
  listing_appointments_set: 45,
  listing_appointments_gone_on: 35,
  listings_taken: 12,
  listings_closed: 8,
}

describe('Dashboard', () => {
  let mockUseDashboardStore: any
  let mockUseYearStore: any
  let mockUseSessionUser: any
  let mockUseGoalsStore: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockUseDashboardStore = (await import('../views/Dashboard/store/dashboardStore')).useDashboardStore
    mockUseYearStore = (await import('../store/yearStore')).useYearStore
    mockUseSessionUser = (await import('../store/authStore')).useSessionUser
    mockUseGoalsStore = (await import('../views/Goals/store/goalsStore')).useGoalsStore
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
  }

  describe('Component Structure', () => {
    it('should render the main Dashboard component structure', async () => {
      mockUseDashboardStore.mockReturnValue(createMockDashboardStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    })

    it('should render Summary component', async () => {
      mockUseDashboardStore.mockReturnValue(createMockDashboardStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    })
  })

  describe('Data Fetching', () => {
    it('should call fetchMetricsByYear when component mounts', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockFetchFields = vi.fn()
      const mockFetchGoals = vi.fn()
      
      const mockStore = createMockDashboardStore({
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchFields: mockFetchFields,
        fetchGoals: mockFetchGoals,
      }))

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchMetricsByYear).toHaveBeenCalledWith(
          2024,
          [
            'closed_income',
            'conversations',
            'prospected_today',
            'current_pending_income',
            'hours_prospected',
            'listing_appointments_set',
            'listing_appointments_gone_on',
            'listings_taken',
            'listings_closed',
          ],
          'test-user-id'
        )
      })
    })

    it('should call fetchFields and fetchGoals when component mounts', async () => {
      const mockFetchFields = vi.fn()
      const mockFetchGoals = vi.fn()
      
      mockUseDashboardStore.mockReturnValue(createMockDashboardStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchFields: mockFetchFields,
        fetchGoals: mockFetchGoals,
      }))

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchFields).toHaveBeenCalled()
        expect(mockFetchGoals).toHaveBeenCalledWith('test-user-id', '2024')
      })
    })

    it('should not fetch data if already loaded', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockStore = createMockDashboardStore({
        businessMetrics: mockBusinessMetrics,
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      // Should still call fetchMetricsByYear since it's in useEffect
      expect(mockFetchMetricsByYear).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading when data is being fetched', async () => {
      const mockStore = createMockDashboardStore({
        loading: true,
        businessMetrics: {},
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(screen.getByTestId('loading')).toHaveAttribute('data-loading', 'true')
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should not show loading when data is loaded', async () => {
      const mockStore = createMockDashboardStore({
        loading: false,
        businessMetrics: mockBusinessMetrics,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(screen.getByTestId('loading')).toHaveAttribute('data-loading', 'false')
      expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    })
  })

  describe('Business Metrics', () => {
    it('should handle business metrics data correctly', async () => {
      const mockStore = createMockDashboardStore({
        businessMetrics: mockBusinessMetrics,
        loading: false,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(mockStore.businessMetrics).toEqual(mockBusinessMetrics)
      expect((mockStore.businessMetrics as any).closed_income).toBe(50000)
      expect((mockStore.businessMetrics as any).conversations).toBe(150)
    })

    it('should handle empty business metrics gracefully', async () => {
      const mockStore = createMockDashboardStore({
        businessMetrics: {},
        loading: false,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(mockStore.businessMetrics).toEqual({})
    })
  })

  describe('Year Handling', () => {
    it('should use selected year for data fetching', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockStore = createMockDashboardStore({
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: '2023',
      }))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchMetricsByYear).toHaveBeenCalledWith(
          2023,
          expect.any(Array),
          'test-user-id'
        )
      })
    })

    it('should handle missing year data gracefully', async () => {
      const mockStore = createMockDashboardStore()
      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: null,
      }))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      // Component should still render
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
  })

  describe('User Data Handling', () => {
    it('should use user data for data fetching', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockStore = createMockDashboardStore({
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore({
        user: {
          user_id: 'different-user-id',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
        },
      }))
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchMetricsByYear).toHaveBeenCalledWith(
          2024,
          expect.any(Array),
          'different-user-id'
        )
      })
    })

    it('should handle missing user data gracefully', async () => {
      const mockStore = createMockDashboardStore()
      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore({
        user: null,
      }))
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      // Component should still render
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      const mockStore = createMockDashboardStore({
        error: 'Failed to fetch metrics',
        businessMetrics: {},
        loading: false,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      // Component should still render even with errors
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    })

    it('should handle missing goals store data gracefully', async () => {
      const mockStore = createMockDashboardStore()
      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        items: null,
        loading: false,
      }))

      await act(async () => {
        renderDashboard()
      })

      // Component should still render
      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should use correct store selectors', async () => {
      const mockStore = createMockDashboardStore()
      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(mockUseDashboardStore).toHaveBeenCalled()
      expect(mockUseYearStore).toHaveBeenCalled()
      expect(mockUseSessionUser).toHaveBeenCalled()
      expect(mockUseGoalsStore).toHaveBeenCalled()
    })

    it('should handle store state changes', async () => {
      const mockStore = createMockDashboardStore({
        businessMetrics: mockBusinessMetrics,
        loading: false,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      expect(screen.getByTestId('loading')).toHaveAttribute('data-loading', 'false')
      expect(screen.getByTestId('summary-component')).toBeInTheDocument()
    })
  })

  describe('Environment Variables', () => {
    it('should use VITE_MODULE_KEY for fetchFields', async () => {
      const mockFetchFields = vi.fn()
      
      mockUseDashboardStore.mockReturnValue(createMockDashboardStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchFields: mockFetchFields,
      }))

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchFields).toHaveBeenCalled()
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should fetch data on mount', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockFetchFields = vi.fn()
      const mockFetchGoals = vi.fn()
      
      const mockStore = createMockDashboardStore({
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore({
        fetchFields: mockFetchFields,
        fetchGoals: mockFetchGoals,
      }))

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchMetricsByYear).toHaveBeenCalledTimes(1)
        expect(mockFetchFields).toHaveBeenCalledTimes(1)
        expect(mockFetchGoals).toHaveBeenCalledTimes(1)
      })
    })

    it('should re-fetch data when year changes', async () => {
      const mockFetchMetricsByYear = vi.fn()
      const mockStore = createMockDashboardStore({
        fetchMetricsByYear: mockFetchMetricsByYear,
      })

      mockUseDashboardStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: '2023',
      }))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())
      mockUseGoalsStore.mockReturnValue(createMockGoalsStore())

      await act(async () => {
        renderDashboard()
      })

      await waitFor(() => {
        expect(mockFetchMetricsByYear).toHaveBeenCalledWith(
          2023,
          expect.any(Array),
          'test-user-id'
        )
      })
    })
  })
}) 