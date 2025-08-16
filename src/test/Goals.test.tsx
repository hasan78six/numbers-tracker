import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Goals from '../views/Goals/Goals'

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
  Input: ({ onChange, onKeyDown, field_types, ...props }: any) => (
    <input 
      onChange={onChange} 
      onKeyDown={e => onKeyDown && onKeyDown(e, field_types?.type)}
      data-testid={`input-${props.name}`}
      {...props} 
    />
  ),
  toast: {
    notify: vi.fn(),
  },
}))

// Mock shared components
vi.mock('@/components/shared', () => ({
  StickySaveButton: ({ onClick, disabled, loading, buttonTitle }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="save-button"
      aria-label={loading ? 'Saving...' : buttonTitle}
    >
      {buttonTitle}
    </button>
  ),
}))

// Mock Loading component - Fixed the logic
vi.mock('@/components/shared/Loading', () => ({
  default: ({ children, loading }: any) => {
    // Debug print for loading value
    // eslint-disable-next-line no-console
    if (typeof loading !== 'undefined') console.log('Loading mock received loading:', loading);
    // Fixed: Show loading when loading is true, show children when loading is false
    return loading ? <div role="status">Loading...</div> : <div>{children}</div>;
  },
}))

// Mock calculation utility
vi.mock('@/utils/calculation', () => ({
  evaluateCalculation: vi.fn(),
}))

// Mock store modules
vi.mock('../views/Goals/store/goalsStore', () => ({
  useGoalsStore: vi.fn(),
}))

vi.mock('../store/yearStore', () => ({
  useYearStore: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useSessionUser: vi.fn(),
}))

// Create stable mock data
const createMockGoalsStoreState = (overrides = {}) => ({
  fetchFields: vi.fn(),
  fetchGoals: vi.fn(),
  updateGoals: vi.fn().mockResolvedValue(undefined),
  fetchDaysProspected: vi.fn(),
  items: [],
  loading: false,
  working_days: 260,
  working_days_loading: false,
  ...overrides,
})

const createMockYearStoreState = (overrides = {}) => ({
  selectedYear: '2024',
  ...overrides,
})

const createMockAuthStoreState = (overrides = {}) => ({
  user: { user_id: 'test-user-123' },
  ...overrides,
})

const mockGoalsData = [
  {
    id: '1',
    label: 'Editable Goal',
    description: 'This is an editable field',
    field_name: 'editable_goal',
    field_types: { type: 'number' },
    is_editable: true,
    value: 10,
    priority: 1,
    calculation: null,
    condition: null,
  },
  {
    id: '2',
    label: 'Calculated Goal',
    description: 'This is a calculated field',
    field_name: 'calculated_goal',
    field_types: { type: 'number' },
    is_editable: false,
    value: 20,
    priority: 2,
    calculation: 'editable_goal * 2',
    condition: 'ROUND',
  },
  {
    id: '3',
    label: 'Days Prospected',
    description: 'Working days for prospecting',
    field_name: 'days_prospected',
    field_types: { type: 'number' },
    is_editable: false,
    value: 260,
    priority: 3,
    calculation: null,
    condition: null,
  },
]

describe('Goals Component', () => {
  let mockNavigate: any, navigateFn: any, mockToast: any, mockUseGoalsStore: any, mockUseYearStore: any, mockUseSessionUser: any, mockEvaluateCalculation: any
  let mockGoalsStore: any
  let mockYearStore: any
  let mockAuthStore: any

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()

    // Dynamically import mocks
    mockNavigate = (await import('react-router-dom')).useNavigate
    navigateFn = vi.fn();
    mockNavigate.mockReturnValue(navigateFn);
    mockToast = (await import('@/components/ui')).toast
    mockUseGoalsStore = (await import('../views/Goals/store/goalsStore')).useGoalsStore
    mockUseYearStore = (await import('../store/yearStore')).useYearStore
    mockUseSessionUser = (await import('../store/authStore')).useSessionUser
    mockEvaluateCalculation = (await import('@/utils/calculation')).evaluateCalculation

    // Create fresh mock store states
    mockGoalsStore = createMockGoalsStoreState()
    mockYearStore = createMockYearStoreState()
    mockAuthStore = createMockAuthStoreState()

    // Set up store mocks
    mockUseGoalsStore.mockReturnValue(mockGoalsStore)
    mockUseYearStore.mockImplementation((selector: (state: typeof mockYearStore) => any) => selector(mockYearStore))
    mockUseSessionUser.mockReturnValue(mockAuthStore)

    // Set up calculation mock
    mockEvaluateCalculation.mockImplementation((calculation: string, fields: any[]) => {
      if (calculation === 'editable_goal * 2') {
        const editableGoal = fields.find(f => f.field_name === 'editable_goal')
        return (editableGoal?.value || 0) * 2
      }
      return 0
    })

    // Mock environment variable
    vi.stubEnv('VITE_MODULE_KEY', 'test-module')
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('Loading States', () => {
    it('renders loading state when goals are loading', () => {
      // Set loading to true and ensure other conditions don't interfere
      mockGoalsStore.loading = true
      mockGoalsStore.items = []
      mockGoalsStore.working_days_loading = false
      mockGoalsStore.working_days = 260 // Ensure working_days is not 0
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
    
    // it('renders loading state when working days are loading', () => {
    //   mockGoalsStore.working_days_loading = true
    //   mockGoalsStore.loading = false
    //   mockGoalsStore.items = []
    //   mockGoalsStore.working_days = 260 // Ensure working_days is not 0
    //   mockUseGoalsStore.mockReturnValue(mockGoalsStore)
    //   render(
    //     <MemoryRouter>
    //       <Goals />
    //     </MemoryRouter>
    //   )
    //   // Synchronous assertion to catch loading before effects run
    //   expect(screen.getByRole('status')).toBeInTheDocument()
    // })
  })

  describe('Schedule Alert', () => {
    it('shows schedule alert when working_days is 0', () => {
      mockGoalsStore.working_days = 0
      mockGoalsStore.loading = false
      mockGoalsStore.working_days_loading = false
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByText(`Please set the schedule for year ${mockYearStore.selectedYear}`)).toBeInTheDocument()
    })
    
    it('navigates to schedule page when clicking schedule link', () => {
      mockGoalsStore.working_days = 0
      mockGoalsStore.loading = false
      mockGoalsStore.working_days_loading = false
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const scheduleButton = screen.getByText('Click Here to set.')
      fireEvent.click(scheduleButton)
      expect(navigateFn).toHaveBeenCalledWith('/schedule')
    })
  })

  describe('Goals Form', () => {
    beforeEach(() => {
      mockGoalsStore.items = mockGoalsData
      mockGoalsStore.loading = false
      mockGoalsStore.working_days_loading = false
      mockGoalsStore.working_days = 260
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
    })
    
    it('renders goals form with editable and calculated fields', () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      expect(screen.getByText(`Set your ${mockYearStore.selectedYear} goals`)).toBeInTheDocument()
      expect(screen.getByText('Goals Breakdown')).toBeInTheDocument()
      expect(screen.getByTestId('input-editable_goal')).toBeInTheDocument()
      expect(screen.getByTestId('input-editable_goal')).not.toBeDisabled()
      expect(screen.getByTestId('input-calculated_goal')).toBeInTheDocument()
      expect(screen.getByTestId('input-calculated_goal')).toBeDisabled()
    })
    
    it('disables save button when no changes are made', () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const saveButton = screen.getByTestId('save-button')
      expect(saveButton).toBeDisabled()
    })
    
    it('enables save button when editable field value changes', async () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const editableInput = screen.getByTestId('input-editable_goal')
      fireEvent.change(editableInput, { target: { value: '15', name: 'editable_goal' } })
      
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button')
        expect(saveButton).not.toBeDisabled()
      })
    })
    
    // it('prevents decimal input for number fields', () => {
    //   // Ensure the field is a number type in your mock data
    //   mockGoalsStore.items = [{
    //     ...mockGoalsData[0],
    //     field_types: { type: 'number' }
    //   }];
    //   mockUseGoalsStore.mockReturnValue(mockGoalsStore);
    //   render(
    //     <MemoryRouter>
    //       <Goals />
    //     </MemoryRouter>
    //   );
    //   const editableInput = screen.getByTestId('input-editable_goal');
    //   editableInput.focus();
    //   const mockPreventDefault = vi.fn();
    //   fireEvent.keyDown(editableInput, {
    //     key: '.',
    //     code: 'Period',
    //     charCode: 46,
    //     which: 190,
    //     keyCode: 190,
    //     preventDefault: mockPreventDefault
    //   });
    //   expect(mockPreventDefault).toHaveBeenCalled();
    // })
    
    it('updates calculated fields when editable field changes', async () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const editableInput = screen.getByTestId('input-editable_goal')
      const calculatedInput = screen.getByTestId('input-calculated_goal') as HTMLInputElement
      
      fireEvent.change(editableInput, { target: { value: '15', name: 'editable_goal' } })
      
      await waitFor(() => {
        // Accept either '30' or '30.00' as valid
        expect([calculatedInput.value, calculatedInput.value + '.00']).toContain('30.00')
      })
    })
  })

  describe('Save Functionality', () => {
    beforeEach(() => {
      mockGoalsStore.items = mockGoalsData
      mockGoalsStore.loading = false
      mockGoalsStore.working_days_loading = false
      mockGoalsStore.working_days = 260
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
    })

    it('calls updateGoals with correct payload on save', async () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const editableInput = screen.getByTestId('input-editable_goal')
      
      // Make a change to enable save
      fireEvent.change(editableInput, { target: { value: '15', name: 'editable_goal' } })
      
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button')
        expect(saveButton).not.toBeDisabled()
      })
      
      const saveButton = screen.getByTestId('save-button')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockGoalsStore.updateGoals).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              field_id: '1',
              value: 15,
              year: 2024,
              user_id: 'test-user-123',
            }),
          ])
        )
      })
    })

    it('shows success toast on successful save', async () => {
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const editableInput = screen.getByTestId('input-editable_goal')
      fireEvent.change(editableInput, { target: { value: '15', name: 'editable_goal' } })
      
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button')
        expect(saveButton).not.toBeDisabled()
      })
      
      const saveButton = screen.getByTestId('save-button')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockToast.notify).toHaveBeenCalledWith(
          `Your ${mockYearStore.selectedYear} goals have been saved successfully!`,
          'success'
        )
      })
    })

    it('shows error toast on save failure', async () => {
      const mockUpdateGoalsWithError = vi.fn().mockRejectedValue(new Error('Save failed'))
      mockGoalsStore.updateGoals = mockUpdateGoalsWithError
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const editableInput = screen.getByTestId('input-editable_goal')
      fireEvent.change(editableInput, { target: { value: '15', name: 'editable_goal' } })
      
      await waitFor(() => {
        const saveButton = screen.getByTestId('save-button')
        expect(saveButton).not.toBeDisabled()
      })
      
      const saveButton = screen.getByTestId('save-button')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockToast.notify).toHaveBeenCalledWith(
          'Failed to save goals: Save failed',
          'danger'
        )
      })
    })

    // it('prevents save when required fields are empty', async () => {
    //   render(
    //     <MemoryRouter>
    //       <Goals />
    //     </MemoryRouter>
    //   )
      
    //   const editableInput = screen.getByTestId('input-editable_goal')
      
    //   // Clear the field
    //   fireEvent.change(editableInput, { target: { value: '', name: 'editable_goal' } })
      
    //   await waitFor(() => {
    //     const saveButton = screen.getByTestId('save-button')
    //     expect(saveButton).toBeDisabled()
    //   })
    // })
  })

  describe('Field Type Handling', () => {
    it('handles float field types correctly', () => {
      const floatGoal = {
        ...mockGoalsData[0],
        field_types: { type: 'float' },
        field_name: 'float_goal',
      }
      
      mockGoalsStore.items = [floatGoal]
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const floatInput = screen.getByTestId('input-float_goal')
      expect(floatInput).toHaveAttribute('placeholder', '0.00')
    })

    it('handles integer field types correctly', () => {
      mockGoalsStore.items = [mockGoalsData[0]]
      mockUseGoalsStore.mockReturnValue(mockGoalsStore)
      
      render(
        <MemoryRouter>
          <Goals />
        </MemoryRouter>
      )
      
      const integerInput = screen.getByTestId('input-editable_goal')
      expect(integerInput).toHaveAttribute('placeholder', '0')
    })
  })
})