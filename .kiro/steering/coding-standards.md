# Coding Standards & Architecture

## Project Structure
```
app/                    # Next.js App Router pages
components/            # Reusable React components
  ui/                 # Base UI components (shadcn/ui)
  __tests__/          # Component tests
lib/                   # Utility functions and shared logic
types/                 # TypeScript type definitions
hooks/                 # Custom React hooks
styles/                # Global styles and themes
public/                # Static assets
```

## Code Style Guidelines

### TypeScript
- Use strict TypeScript configuration
- Define interfaces in `types/index.ts` for shared types
- Use proper type annotations for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use generic types where appropriate

### React Components
- Use functional components with hooks
- Prefer named exports over default exports for components
- Use `React.forwardRef` for components that need ref forwarding
- Implement proper error boundaries for complex components

### File Naming
- Use kebab-case for file names: `card-flip-game.tsx`
- Use PascalCase for component names: `CardFlipGame`
- Use camelCase for functions and variables
- Use UPPER_CASE for constants

### Import Organization
```typescript
// 1. React and Next.js imports
import { useState, useEffect } from 'react'
import Link from 'next/link'

// 2. Third-party libraries
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

// 3. Internal imports
import { ListItem, GameCard } from '@/types'
import { cn } from '@/lib/utils'
```

## Component Patterns

### Props Interface
```typescript
interface ComponentProps {
  items: ListItem[]
  onComplete: (winners: ListItem[]) => void
  className?: string
  children?: React.ReactNode
}
```

### State Management
- Use `useState` for local component state
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Use `useEffect` for side effects with proper cleanup
- Use custom hooks for reusable stateful logic

### Error Handling
- Implement proper error boundaries
- Use try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors to console for debugging

### Performance
- Use `React.memo` for expensive components
- Implement proper cleanup in `useEffect`
- Use `useCallback` and `useMemo` judiciously
- Optimize animations with performance hooks

## Styling Guidelines

### Tailwind CSS
- Use utility classes for styling
- Create component variants with CVA
- Use responsive prefixes: `sm:`, `md:`, `lg:`
- Prefer semantic color names from design system

### CSS Custom Properties
- Use CSS variables for theme colors
- Implement dark mode support
- Use consistent spacing scale
- Follow design system tokens

## Testing Standards
- Write unit tests for utility functions
- Test component behavior, not implementation
- Use descriptive test names
- Mock external dependencies
- Aim for good test coverage on critical paths

## Accessibility
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast ratios