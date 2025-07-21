# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type-safe development
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Radix UI** - Headless UI components for accessibility
- **Lucide React** - Icon library
- **Class Variance Authority (CVA)** - Component variant management
- **Tailwind Merge & CLSX** - Conditional styling utilities

## State & Data Management
- **Local Storage** - Client-side data persistence
- **React Hooks** - State management (useState, useEffect, useCallback)
- **Custom hooks** - Reusable logic (use-mobile, use-toast)

## Testing
- **Vitest** - Fast unit testing framework
- **Testing Library** - React component testing
- **JSDOM** - DOM simulation for tests

## Build & Development
- **PNPM** - Package manager
- **PostCSS** - CSS processing
- **ESLint** - Code linting (build errors ignored)

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Testing
```bash
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm test:ui      # Run tests with UI
```

## Performance Optimizations
- Animation performance management with custom hooks
- Responsive design with mobile-first approach
- Image optimization disabled for static builds
- Build errors ignored for rapid prototyping