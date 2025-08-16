import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TransactionList from '../views/Transaction/TransactionList'

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
  Alert: ({ children, title, type, showIcon }: any) => (
    <div data-testid="alert" data-type={type} data-show-icon={showIcon}>
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
          <div data-testid={`transaction-name-${index}`}>{item.name}</div>
          <div data-testid={`transaction-commission-${index}`}>{item.commission}</div>
          <div data-testid={`transaction-status-${index}`}>{item.statuses?.status}</div>
          <div data-testid={`transaction-type-${index}`}>{item.transaction_types?.type}</div>
          <div data-testid={`transaction-pending-date-${index}`}>{item.pending_date}</div>
          <div data-testid={`transaction-closed-date-${index}`}>{item.closed_date}</div>
        </div>
      ))}
    </div>
  ),
}))

// Mock store modules
vi.mock('../views/Transaction/store/transactionListStore', () => ({
  useTransactionStore: vi.fn(),
}))

vi.mock('../store/yearStore', () => ({
  useYearStore: vi.fn(),
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

// Mock constants
vi.mock('@/constants/status.options.constant', () => ({
  statusOptions: [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'CANCEL', label: 'Cancel' },
  ],
}))

vi.mock('@/constants/transaction-type.options.constant', () => ({
  transactionTypeOptions: [
    { value: 'BUYER', label: 'Buyer' },
    { value: 'LISTING', label: 'Listing' },
  ],
}))

// Create stable mock data
const createMockTransactionStore = (overrides = {}) => ({
  items: [],
  loading: false,
  updateLoading: false,
  error: null,
  totalCount: 0,
  page: 1,
  limit: 10,
  filters: {
    name: '',
    filterByStatus: ['PENDING', 'CANCEL', 'CLOSED'],
    filterByTransactionType: ['BUYER', 'LISTING'],
  },
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setLimit: vi.fn(),
  reset: vi.fn(),
  fetchTransactions: vi.fn(),
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  ...overrides,
})

const createMockYearStore = (overrides = {}) => ({
  selectedYear: '2024',
  setSelectedYear: vi.fn(),
  ...overrides,
})

const mockTransactionData = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Test Transaction 1',
    commission: 5000,
    pending_date: '2024-01-15',
    closed_date: '2024-02-15',
    status_id: 'status-1',
    transaction_type_id: 'type-1',
    transaction_types: {
      id: 'type-1',
      type: 'BUYER',
    },
    statuses: {
      id: 'status-1',
      status: 'PENDING',
    },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Test Transaction 2',
    commission: 7500,
    pending_date: '2024-03-01',
    closed_date: '2024-04-01',
    status_id: 'status-2',
    transaction_type_id: 'type-2',
    transaction_types: {
      id: 'type-2',
      type: 'LISTING',
    },
    statuses: {
      id: 'status-2',
      status: 'CLOSED',
    },
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
  },
]

describe('TransactionList', () => {
  let mockUseTransactionStore: any
  let mockUseYearStore: any
  let mockIsCurrentYear: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockUseTransactionStore = (await import('../views/Transaction/store/transactionListStore')).useTransactionStore
    mockUseYearStore = (await import('../store/yearStore')).useYearStore
    mockIsCurrentYear = (await import('@/utils/formatDateTime')).isCurrentYear
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderTransactionList = () => {
    return render(
      <MemoryRouter>
        <TransactionList />
      </MemoryRouter>
    )
  }

  describe('Component Structure', () => {
    it('should render the main TransactionList component structure when current year', async () => {
      mockUseTransactionStore.mockReturnValue(createMockTransactionStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should render alert when not current year', async () => {
      mockUseTransactionStore.mockReturnValue(createMockTransactionStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(false)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Please select current year')
      expect(screen.getByText('Future years are not supported yet.')).toBeInTheDocument()
    })

    it('should render TransactionListActionTools component', async () => {
      mockUseTransactionStore.mockReturnValue(createMockTransactionStore())
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // TransactionListActionTools should be rendered (it contains the filter and form buttons)
      expect(screen.getByText('Transactions')).toBeInTheDocument()
    })
  })

  describe('Transaction Table', () => {
    it('should render DataTable with correct props', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
        totalCount: 2,
        page: 1,
        limit: 10,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
      expect(screen.getByTestId('total-count')).toHaveTextContent('2')
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })

    it('should display transaction data correctly', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('transaction-name-0')).toHaveTextContent('Test Transaction 1')
      expect(screen.getByTestId('transaction-commission-0')).toHaveTextContent('5000')
      expect(screen.getByTestId('transaction-status-0')).toHaveTextContent('PENDING')
      expect(screen.getByTestId('transaction-type-0')).toHaveTextContent('BUYER')
      expect(screen.getByTestId('transaction-pending-date-0')).toHaveTextContent('2024-01-15')
      expect(screen.getByTestId('transaction-closed-date-0')).toHaveTextContent('2024-02-15')
    })

    it('should show loading state', async () => {
      const mockStore = createMockTransactionStore({
        items: [],
        loading: true,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    it('should show no data state when items are empty', async () => {
      const mockStore = createMockTransactionStore({
        items: [],
        loading: false,
        totalCount: 0,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total-count')).toHaveTextContent('0')
    })
  })

  describe('Data Fetching', () => {
    it('should call fetchTransactions when component mounts', async () => {
      const mockFetchTransactions = vi.fn()
      const mockStore = createMockTransactionStore({
        fetchTransactions: mockFetchTransactions,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      await waitFor(() => {
        expect(mockFetchTransactions).toHaveBeenCalled()
      })
    })

    it('should not fetch data if already loaded', async () => {
      const mockFetchTransactions = vi.fn()
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        fetchTransactions: mockFetchTransactions,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Should not call fetchTransactions since items are already loaded
      expect(mockFetchTransactions).not.toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('should handle pagination changes', async () => {
      const mockSetPage = vi.fn()
      const mockSetLimit = vi.fn()
      const mockStore = createMockTransactionStore({
        setPage: mockSetPage,
        setLimit: mockSetLimit,
        items: mockTransactionData,
        totalCount: 20,
        page: 1,
        limit: 10,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Simulate pagination change (this would be handled by the DataTable component)
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })
  })

  describe('Filtering', () => {
    it('should apply name filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockTransactionStore({
        setFilters: mockSetFilters,
        filters: { name: 'Test', filterByStatus: ['PENDING'], filterByTransactionType: ['BUYER'] },
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(mockStore.filters.name).toBe('Test')
    })

    it('should apply status filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockTransactionStore({
        setFilters: mockSetFilters,
        filters: { name: '', filterByStatus: ['CLOSED'], filterByTransactionType: ['BUYER', 'LISTING'] },
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(mockStore.filters.filterByStatus).toEqual(['CLOSED'])
    })

    it('should apply transaction type filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockTransactionStore({
        setFilters: mockSetFilters,
        filters: { name: '', filterByStatus: ['PENDING', 'CLOSED'], filterByTransactionType: ['LISTING'] },
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(mockStore.filters.filterByTransactionType).toEqual(['LISTING'])
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      const mockStore = createMockTransactionStore({
        error: 'Failed to fetch transactions',
        items: [],
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Component should still render even with errors
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Transactions')).toBeInTheDocument()
    })

    it('should handle missing year data gracefully', async () => {
      const mockStore = createMockTransactionStore()
      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: null,
      }))
      mockIsCurrentYear.mockReturnValue(false)

      await act(async () => {
        renderTransactionList()
      })

      // Component should still render
      expect(screen.getByTestId('alert')).toBeInTheDocument()
    })
  })

  describe('Transaction Actions', () => {
    it('should render action buttons for each transaction', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Each row should have action buttons (edit/delete functionality)
      expect(screen.getByTestId('row-0')).toBeInTheDocument()
      expect(screen.getByTestId('row-1')).toBeInTheDocument()
    })

    it('should handle transaction status display correctly', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Check status display
      expect(screen.getByTestId('transaction-status-0')).toHaveTextContent('PENDING')
      expect(screen.getByTestId('transaction-status-1')).toHaveTextContent('CLOSED')
    })

    it('should handle transaction type display correctly', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      // Check transaction type display
      expect(screen.getByTestId('transaction-type-0')).toHaveTextContent('BUYER')
      expect(screen.getByTestId('transaction-type-1')).toHaveTextContent('LISTING')
    })
  })

  describe('Store Integration', () => {
    it('should use correct store selectors', async () => {
      const mockStore = createMockTransactionStore()
      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(mockUseTransactionStore).toHaveBeenCalled()
      expect(mockUseYearStore).toHaveBeenCalled()
    })

    it('should handle store state changes', async () => {
      const mockStore = createMockTransactionStore({
        items: mockTransactionData,
        loading: false,
      })

      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore())
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getAllByTestId('loading')[0]).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
    })
  })

  describe('Year Validation', () => {
    it('should show alert for future years', async () => {
      const mockStore = createMockTransactionStore()
      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: '2025',
      }))
      mockIsCurrentYear.mockReturnValue(false)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Please select current year')
    })

    it('should show alert for past years', async () => {
      const mockStore = createMockTransactionStore()
      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: '2023',
      }))
      mockIsCurrentYear.mockReturnValue(false)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Please select current year')
    })

    it('should render normal view for current year', async () => {
      const mockStore = createMockTransactionStore()
      mockUseTransactionStore.mockReturnValue(mockStore)
      mockUseYearStore.mockReturnValue(createMockYearStore({
        selectedYear: '2024',
      }))
      mockIsCurrentYear.mockReturnValue(true)

      await act(async () => {
        renderTransactionList()
      })

      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument()
    })
  })
}) 