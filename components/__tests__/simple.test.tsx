import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Simple component for testing
function TestComponent() {
  return <div>Test Component</div>
}

describe('Simple Test', () => {
  it('should render test component', () => {
    render(<TestComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })
})