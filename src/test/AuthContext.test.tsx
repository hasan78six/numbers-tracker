import AuthContext from '../auth/AuthContext'
import { useContext } from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

function TestComponent() {
    const context = useContext(AuthContext)
    return <div>{context === undefined ? 'undefined' : 'defined'}</div>
}

describe('AuthContext', () => {
    it('is undefined when used without a Provider', () => {
        const { getByText } = render(<TestComponent />)
        expect(getByText('undefined')).toBeInTheDocument()
    })
}) 