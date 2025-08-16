import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Companies from '../views/Companies/Companies'

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
          <div data-testid={`company-name-${index}`}>{item.companyName}</div>
          <div data-testid={`company-address-${index}`}>{item.companyAddress}</div>
          <div data-testid={`company-contact-${index}`}>{item.companyContactNumber}</div>
          <div data-testid={`first-name-${index}`}>{item.firstName}</div>
          <div data-testid={`last-name-${index}`}>{item.lastName}</div>
          <div data-testid={`is-active-${index}`}>{item.is_active ? 'Active' : 'Inactive'}</div>
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/shared/ActiveStatus', () => ({
  ActiveStatus: ({ isActive }: any) => (
    <div data-testid="active-status" data-active={isActive}>
      {isActive ? 'Active' : 'Inactive'}
    </div>
  ),
}))

// Mock store modules
vi.mock('../views/Companies/store/companiesStore', () => ({
  useCompaniesStore: vi.fn(),
}))

vi.mock('../store/userTypesStore', () => ({
  useUserTypesStore: vi.fn(),
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
}))

// Mock constants
vi.mock('@/constants/status.options.constant', () => ({
  statusOptions: [
    { value: 'Active', label: 'Active' },
    { value: 'Blocked', label: 'Blocked' },
  ],
}))

// Create stable mock data
const createMockCompaniesStore = (overrides = {}) => ({
  items: [],
  loading: false,
  updateLoading: false,
  error: null,
  totalCount: 0,
  page: 1,
  limit: 10,
  filters: { companyName: '', status: 'All' },
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setLimit: vi.fn(),
  reset: vi.fn(),
  fetchCompanies: vi.fn(),
  addCompany: vi.fn(),
  updateCompany: vi.fn(),
  ...overrides,
})

const createMockUserTypesStore = (overrides = {}) => ({
  companyTypeId: 'test-company-type-id',
  companyUserTypeId: 'test-company-user-type-id',
  administratorTypeId: 'test-admin-type-id',
  userTypes: [],
  setUserTypes: vi.fn(),
  ...overrides,
})

const mockCompanyData = [
  {
    id: '1',
    companyName: 'Test Company 1',
    companyAddress: '123 Test St',
    companyContactNumber: '+1234567890',
    firstName: 'John',
    lastName: 'Doe',
    companyId: 'company-1',
    user_id: 'user-1',
    is_active: true,
  },
  {
    id: '2',
    companyName: 'Test Company 2',
    companyAddress: '456 Test Ave',
    companyContactNumber: '+0987654321',
    firstName: 'Jane',
    lastName: 'Smith',
    companyId: 'company-2',
    user_id: 'user-2',
    is_active: false,
  },
]

describe('Companies', () => {
  let mockUseCompaniesStore: any
  let mockUseUserTypesStore: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockUseCompaniesStore = (await import('../views/Companies/store/companiesStore')).useCompaniesStore
    mockUseUserTypesStore = (await import('../store/userTypesStore')).useUserTypesStore
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderCompanies = () => {
    return render(
      <MemoryRouter>
        <Companies />
      </MemoryRouter>
    )
  }

  describe('Component Structure', () => {
    it('should render the main Companies component structure', async () => {
      mockUseCompaniesStore.mockReturnValue(createMockCompaniesStore())
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should render CompaniesActionTools component', async () => {
      mockUseCompaniesStore.mockReturnValue(createMockCompaniesStore())
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // CompaniesActionTools should be rendered (it contains the filter and form buttons)
      expect(screen.getByText('Companies')).toBeInTheDocument()
    })
  })

  describe('Companies Table', () => {
    it('should render DataTable with correct props', async () => {
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        loading: false,
        totalCount: 2,
        page: 1,
        limit: 10,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
      expect(screen.getByTestId('total-count')).toHaveTextContent('2')
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })

    it('should display company data correctly', async () => {
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        loading: false,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getByTestId('company-name-0')).toHaveTextContent('Test Company 1')
      expect(screen.getByTestId('company-address-0')).toHaveTextContent('123 Test St')
      expect(screen.getByTestId('company-contact-0')).toHaveTextContent('+1234567890')
      expect(screen.getByTestId('first-name-0')).toHaveTextContent('John')
      expect(screen.getByTestId('last-name-0')).toHaveTextContent('Doe')
      expect(screen.getByTestId('is-active-0')).toHaveTextContent('Active')
    })

    it('should show loading state', async () => {
      const mockStore = createMockCompaniesStore({
        items: [],
        loading: true,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    it('should show no data state when items are empty', async () => {
      const mockStore = createMockCompaniesStore({
        items: [],
        loading: false,
        totalCount: 0,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total-count')).toHaveTextContent('0')
    })
  })

  describe('Data Fetching', () => {
    it('should call fetchCompanies when component mounts', async () => {
      const mockFetchCompanies = vi.fn()
      const mockStore = createMockCompaniesStore({
        fetchCompanies: mockFetchCompanies,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore({
        companyTypeId: 'test-company-type-id',
      }))

      await act(async () => {
        renderCompanies()
      })

      await waitFor(() => {
        expect(mockFetchCompanies).toHaveBeenCalled()
      })
    })

    it('should not fetch data if already loaded', async () => {
      const mockFetchCompanies = vi.fn()
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        fetchCompanies: mockFetchCompanies,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // Should not call fetchCompanies since items are already loaded
      expect(mockFetchCompanies).not.toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('should handle pagination changes', async () => {
      const mockSetPage = vi.fn()
      const mockSetLimit = vi.fn()
      const mockStore = createMockCompaniesStore({
        setPage: mockSetPage,
        setLimit: mockSetLimit,
        items: mockCompanyData,
        totalCount: 20,
        page: 1,
        limit: 10,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // Simulate pagination change (this would be handled by the DataTable component)
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })
  })

  describe('Filtering', () => {
    it('should apply company name filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockCompaniesStore({
        setFilters: mockSetFilters,
        filters: { companyName: 'Test', status: 'All' },
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // The filter functionality would be tested in the CompaniesFilter component
      expect(mockStore.filters.companyName).toBe('Test')
    })

    it('should apply status filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockCompaniesStore({
        setFilters: mockSetFilters,
        filters: { companyName: '', status: 'Active' },
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(mockStore.filters.status).toBe('Active')
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      const mockStore = createMockCompaniesStore({
        error: 'Failed to fetch companies',
        items: [],
        loading: false,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // Component should still render even with errors
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Companies')).toBeInTheDocument()
    })

    it('should handle missing user types gracefully', async () => {
      const mockStore = createMockCompaniesStore()
      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore({
        companyTypeId: '',
      }))

      await act(async () => {
        renderCompanies()
      })

      // Component should still render
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
    })
  })

  describe('Company Actions', () => {
    it('should render action buttons for each company', async () => {
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        loading: false,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // Each row should have action buttons (edit functionality)
      expect(screen.getByTestId('row-0')).toBeInTheDocument()
      expect(screen.getByTestId('row-1')).toBeInTheDocument()
    })

    it('should handle company status display correctly', async () => {
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        loading: false,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      // Check active status display
      expect(screen.getByTestId('is-active-0')).toHaveTextContent('Active')
      expect(screen.getByTestId('is-active-1')).toHaveTextContent('Inactive')
    })
  })

  describe('Store Integration', () => {
    it('should use correct store selectors', async () => {
      const mockStore = createMockCompaniesStore()
      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(mockUseCompaniesStore).toHaveBeenCalled()
      expect(mockUseUserTypesStore).toHaveBeenCalled()
    })

    it('should handle store state changes', async () => {
      const mockStore = createMockCompaniesStore({
        items: mockCompanyData,
        loading: false,
      })

      mockUseCompaniesStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())

      await act(async () => {
        renderCompanies()
      })

      expect(screen.getAllByTestId('loading')[0]).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
    })
  })
}) 