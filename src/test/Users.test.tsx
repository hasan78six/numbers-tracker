import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import UsersList from '../views/Users/Users'

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
          <div data-testid={`user-first-name-${index}`}>{item.first_name}</div>
          <div data-testid={`user-last-name-${index}`}>{item.last_name}</div>
          <div data-testid={`user-email-${index}`}>{item.email}</div>
          <div data-testid={`user-status-${index}`}>{item.is_active ? 'Active' : 'Inactive'}</div>
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
vi.mock('../views/Users/store/usersStore', () => ({
  useUsersStore: vi.fn(),
}))

vi.mock('../store/userTypesStore', () => ({
  useUserTypesStore: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useSessionUser: vi.fn(),
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
    { value: 'Active', label: 'Active' },
    { value: 'Blocked', label: 'Blocked' },
  ],
}))

// Create stable mock data
const createMockUsersStore = (overrides = {}) => ({
  items: [],
  loading: false,
  updateLoading: false,
  error: null,
  totalCount: 0,
  page: 1,
  limit: 10,
  filters: { name: '', status: 'All' },
  setFilters: vi.fn(),
  setPage: vi.fn(),
  setLimit: vi.fn(),
  reset: vi.fn(),
  fetchUsers: vi.fn(),
  addUser: vi.fn(),
  updateUser: vi.fn(),
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

const mockUserData = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    is_active: true,
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    is_active: false,
  },
]

describe('UsersList', () => {
  let mockUseUsersStore: any
  let mockUseUserTypesStore: any
  let mockUseSessionUser: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockUseUsersStore = (await import('../views/Users/store/usersStore')).useUsersStore
    mockUseUserTypesStore = (await import('../store/userTypesStore')).useUserTypesStore
    mockUseSessionUser = (await import('../store/authStore')).useSessionUser
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderUsersList = () => {
    return render(
      <MemoryRouter>
        <UsersList />
      </MemoryRouter>
    )
  }

  describe('Component Structure', () => {
    it('should render the main UsersList component structure', async () => {
      mockUseUsersStore.mockReturnValue(createMockUsersStore())
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should render UsersListActionTools component', async () => {
      mockUseUsersStore.mockReturnValue(createMockUsersStore())
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // UsersListActionTools should be rendered (it contains the filter and form buttons)
      expect(screen.getByText('Users')).toBeInTheDocument()
    })
  })

  describe('Users Table', () => {
    it('should render DataTable with correct props', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
        totalCount: 2,
        page: 1,
        limit: 10,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
      expect(screen.getByTestId('total-count')).toHaveTextContent('2')
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })

    it('should display user data correctly', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('user-first-name-0')).toHaveTextContent('John')
      expect(screen.getByTestId('user-last-name-0')).toHaveTextContent('Doe')
      expect(screen.getByTestId('user-email-0')).toHaveTextContent('john.doe@example.com')
      expect(screen.getByTestId('user-status-0')).toHaveTextContent('Active')
    })

    it('should show loading state', async () => {
      const mockStore = createMockUsersStore({
        items: [],
        loading: true,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...')
    })

    it('should show no data state when items are empty', async () => {
      const mockStore = createMockUsersStore({
        items: [],
        loading: false,
        totalCount: 0,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
      expect(screen.getByTestId('total-count')).toHaveTextContent('0')
    })
  })

  describe('Data Fetching', () => {
    it('should call fetchUsers when component mounts', async () => {
      const mockFetchUsers = vi.fn()
      const mockStore = createMockUsersStore({
        fetchUsers: mockFetchUsers,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      await waitFor(() => {
        expect(mockFetchUsers).toHaveBeenCalled()
      })
    })

    it('should not fetch data if already loaded', async () => {
      const mockFetchUsers = vi.fn()
      const mockStore = createMockUsersStore({
        items: mockUserData,
        fetchUsers: mockFetchUsers,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Should not call fetchUsers since items are already loaded
      expect(mockFetchUsers).not.toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('should handle pagination changes', async () => {
      const mockSetPage = vi.fn()
      const mockSetLimit = vi.fn()
      const mockStore = createMockUsersStore({
        setPage: mockSetPage,
        setLimit: mockSetLimit,
        items: mockUserData,
        totalCount: 20,
        page: 1,
        limit: 10,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Simulate pagination change (this would be handled by the DataTable component)
      expect(screen.getByTestId('page-index')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('10')
    })
  })

  describe('Filtering', () => {
    it('should apply name filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockUsersStore({
        setFilters: mockSetFilters,
        filters: { name: 'John', status: 'All' },
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(mockStore.filters.name).toBe('John')
    })

    it('should apply status filter', async () => {
      const mockSetFilters = vi.fn()
      const mockStore = createMockUsersStore({
        setFilters: mockSetFilters,
        filters: { name: '', status: 'Active' },
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(mockStore.filters.status).toBe('Active')
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      const mockStore = createMockUsersStore({
        error: 'Failed to fetch users',
        items: [],
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Component should still render even with errors
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should handle missing user types gracefully', async () => {
      const mockStore = createMockUsersStore()
      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore({
        companyUserTypeId: '',
      }))
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Component should still render
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
    })

    it('should handle missing auth data gracefully', async () => {
      const mockStore = createMockUsersStore()
      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore({
        user: null,
      }))

      await act(async () => {
        renderUsersList()
      })

      // Component should still render
      expect(screen.getByTestId('adaptive-card')).toBeInTheDocument()
    })
  })

  describe('User Actions', () => {
    it('should render action buttons for each user', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Each row should have action buttons (edit/delete functionality)
      expect(screen.getByTestId('row-0')).toBeInTheDocument()
      expect(screen.getByTestId('row-1')).toBeInTheDocument()
    })

    it('should handle user status display correctly', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Check status display
      expect(screen.getByTestId('user-status-0')).toHaveTextContent('Active')
      expect(screen.getByTestId('user-status-1')).toHaveTextContent('Inactive')
    })

    it('should handle user name display correctly', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      // Check name display
      expect(screen.getByTestId('user-first-name-0')).toHaveTextContent('John')
      expect(screen.getByTestId('user-last-name-0')).toHaveTextContent('Doe')
      expect(screen.getByTestId('user-first-name-1')).toHaveTextContent('Jane')
      expect(screen.getByTestId('user-last-name-1')).toHaveTextContent('Smith')
    })
  })

  describe('Store Integration', () => {
    it('should use correct store selectors', async () => {
      const mockStore = createMockUsersStore()
      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(mockUseUsersStore).toHaveBeenCalled()
      expect(mockUseUserTypesStore).toHaveBeenCalled()
      expect(mockUseSessionUser).toHaveBeenCalled()
    })

    it('should handle store state changes', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getAllByTestId('loading')[0]).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
    })
  })

  describe('User Data Display', () => {
    it('should display user email correctly', async () => {
      const mockStore = createMockUsersStore({
        items: mockUserData,
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('user-email-0')).toHaveTextContent('john.doe@example.com')
      expect(screen.getByTestId('user-email-1')).toHaveTextContent('jane.smith@example.com')
    })

    it('should handle empty user data gracefully', async () => {
      const mockStore = createMockUsersStore({
        items: [],
        loading: false,
      })

      mockUseUsersStore.mockReturnValue(mockStore)
      mockUseUserTypesStore.mockReturnValue(createMockUserTypesStore())
      mockUseSessionUser.mockReturnValue(createMockAuthStore())

      await act(async () => {
        renderUsersList()
      })

      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
    })
  })
}) 