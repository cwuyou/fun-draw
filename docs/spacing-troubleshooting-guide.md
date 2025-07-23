# Card Layout Spacing Troubleshooting Guide

## Overview

This guide helps developers identify, diagnose, and resolve common spacing issues in the card layout system. It provides step-by-step troubleshooting procedures, common error patterns, and solutions.

## Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] Container dimensions are valid (> 0, finite numbers)
- [ ] Device type detection is working correctly
- [ ] Card count is a positive integer
- [ ] Spacing validation is enabled in development
- [ ] Debug tools are accessible and showing information
- [ ] No console errors related to spacing calculations

## Common Issues and Solutions

### Issue 1: Cards Too Close to Container Borders

**Symptoms:**
- Cards appear cramped against container edges
- Insufficient visual breathing room
- Layout looks unprofessional

**Diagnosis:**
```typescript
// Check current container margins
const spacing = useDynamicSpacing({ enableCardAreaSpacing: true })
console.log('Container margins:', spacing.cardAreaSpacing?.containerMargins)

// Validate against requirements
const validation = validateCardAreaSpacing('desktop', containerWidth, containerHeight, cardCount)
console.log('Margin validation:', validation.violations.containerMargins)
```

**Solutions:**

1. **Verify device detection:**
```typescript
const deviceType = detectDeviceType(containerWidth)
console.log('Detected device:', deviceType)

// Ensure correct device type is being used
if (deviceType !== expectedDeviceType) {
  // Check container width measurement
  console.log('Container width:', containerWidth)
}
```

2. **Check minimum margin requirements:**
```typescript
const cardAreaSpacing = getCardAreaSpacing(deviceType)
const minMargins = deviceType === 'mobile' ? 16 : deviceType === 'tablet' ? 24 : 32

if (cardAreaSpacing.containerMargins.left < minMargins) {
  console.warn('Left margin below minimum:', cardAreaSpacing.containerMargins.left)
}
```

3. **Apply manual margin override (temporary fix):**
```typescript
const customSpacing = {
  ...spacing.cardAreaSpacing,
  containerMargins: {
    ...spacing.cardAreaSpacing.containerMargins,
    left: Math.max(32, spacing.cardAreaSpacing.containerMargins.left),
    right: Math.max(32, spacing.cardAreaSpacing.containerMargins.right)
  }
}
```

### Issue 2: Unbalanced Multi-Row Layout

**Symptoms:**
- Last row with fewer cards is not centered
- Rows have inconsistent vertical spacing
- Cards appear misaligned

**Diagnosis:**
```typescript
const layoutResult = calculateEnhancedCardLayout(containerWidth, containerHeight, cardCount, deviceType)
const positions = calculateMultiRowCardPositions(cardCount, layoutResult)
const balance = validateMultiRowBalance(positions, layoutResult)

console.log('Layout balance:', balance)
if (!balance.isBalanced) {
  console.log('Balance issues:', balance.issues)
  console.log('Recommendations:', balance.recommendations)
}
```

**Solutions:**

1. **Verify row centering logic:**
```typescript
// Check if last row cards are marked as centered
const lastRowCards = positions.filter(pos => pos.isLastRow)
const allCentered = lastRowCards.every(pos => pos.isRowCentered)

if (!allCentered) {
  console.warn('Last row cards not properly centered')
  // Force recalculation with explicit centering
}
```

2. **Check row spacing consistency:**
```typescript
// Verify vertical spacing between rows
const rowGroups = positions.reduce((groups, pos) => {
  if (!groups[pos.row]) groups[pos.row] = []
  groups[pos.row].push(pos)
  return groups
}, {} as Record<number, typeof positions>)

Object.keys(rowGroups).forEach((rowKey, index) => {
  if (index > 0) {
    const currentRow = rowGroups[rowKey]
    const previousRow = rowGroups[String(index - 1)]
    const spacing = currentRow[0].y - previousRow[0].y - layoutResult.spacing.rowSpacing
    
    if (Math.abs(spacing - layoutResult.spacing.rowSpacing) > 2) {
      console.warn(`Row ${index} spacing inconsistent:`, spacing)
    }
  }
})
```

3. **Force layout recalculation:**
```typescript
// Clear any cached layout data and recalculate
const freshLayoutResult = calculateEnhancedCardLayout(
  containerWidth, 
  containerHeight, 
  cardCount, 
  deviceType
)

const freshPositions = calculateMultiRowCardPositions(cardCount, freshLayoutResult)
```

### Issue 3: Responsive Spacing Not Working

**Symptoms:**
- Spacing doesn't change when screen size changes
- Same spacing values across all device types
- Layout breaks on certain screen sizes

**Diagnosis:**
```typescript
// Test device detection across different widths
const testWidths = [375, 768, 1024, 1440]
testWidths.forEach(width => {
  const deviceType = detectDeviceType(width)
  const spacing = getCardAreaSpacing(deviceType)
  console.log(`Width ${width}: ${deviceType}`, spacing.containerMargins)
})
```

**Solutions:**

1. **Verify container width measurement:**
```typescript
// Ensure container width is being measured correctly
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const updateSize = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      console.log('Measured container width:', rect.width)
      setContainerWidth(rect.width)
    }
  }

  // Use ResizeObserver for accurate measurements
  const resizeObserver = new ResizeObserver(updateSize)
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current)
  }

  return () => resizeObserver.disconnect()
}, [])
```

2. **Check for cached values:**
```typescript
// Clear spacing cache if using cached configurations
if (typeof window !== 'undefined') {
  // Clear any cached spacing data
  sessionStorage.removeItem('spacing-cache')
  
  // Force fresh calculation
  const freshSpacing = useDynamicSpacing({
    containerWidth: currentWidth,
    useCache: false
  })
}
```

3. **Add responsive breakpoint debugging:**
```typescript
function DebugResponsiveSpacing() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      console.log('Window resized to:', window.innerWidth)
      
      const deviceType = detectDeviceType(window.innerWidth)
      console.log('New device type:', deviceType)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const spacing = useDynamicSpacing({
    containerWidth: windowWidth,
    enableDebug: true
  })

  return (
    <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs">
      Width: {windowWidth}px | Device: {spacing.deviceType}
    </div>
  )
}
```

### Issue 4: Performance Problems with Large Card Counts

**Symptoms:**
- Slow layout calculations with many cards
- UI freezing during spacing updates
- High memory usage

**Diagnosis:**
```typescript
// Measure spacing calculation performance
const { result, metrics } = measureSpacingPerformance(() => {
  return calculateEnhancedCardLayout(containerWidth, containerHeight, cardCount, deviceType)
}, 'calculation')

console.log('Calculation time:', metrics.calculationTime)
console.log('Memory usage:', metrics.memoryUsage)

if (metrics.calculationTime > 50) {
  console.warn('Spacing calculation is slow:', metrics.calculationTime + 'ms')
}
```

**Solutions:**

1. **Enable caching:**
```typescript
const spacing = useDynamicSpacing({
  useCache: true, // Enable caching
  enableValidation: false // Disable validation in production
})
```

2. **Implement memoization:**
```typescript
const memoizedPositions = useMemo(() => {
  return calculateMultiRowCardPositions(cardCount, layoutResult)
}, [cardCount, layoutResult.totalGridWidth, layoutResult.totalGridHeight])
```

3. **Use performance monitoring:**
```typescript
function PerformanceMonitoredSpacing({ cardCount }: { cardCount: number }) {
  const [performanceWarning, setPerformanceWarning] = useState(false)
  
  const spacing = useDynamicSpacing({
    cardCount,
    useCache: true
  })

  useEffect(() => {
    const startTime = performance.now()
    
    // Simulate spacing calculation
    calculateEnhancedCardLayout(1024, 768, cardCount, 'desktop')
    
    const endTime = performance.now()
    const calculationTime = endTime - startTime
    
    if (calculationTime > 100) {
      setPerformanceWarning(true)
      console.warn(`Slow spacing calculation: ${calculationTime}ms for ${cardCount} cards`)
    }
  }, [cardCount])

  return (
    <>
      {performanceWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Performance warning: Layout calculation is slow with {cardCount} cards
        </div>
      )}
      {/* Your component content */}
    </>
  )
}
```

### Issue 5: Validation Errors

**Symptoms:**
- Console warnings about spacing validation failures
- Fallback spacing being applied unexpectedly
- Layout not meeting requirements

**Diagnosis:**
```typescript
const validation = validateAllSpacing(
  deviceType,
  containerWidth,
  containerHeight,
  cardCount,
  {
    hasGameInfo: true,
    hasStartButton: true,
    hasResultDisplay: false
  }
)

console.log('Validation result:', validation)

if (!validation.isValid) {
  console.log('UI Element Issues:', validation.uiElementValidation.errors)
  console.log('Card Area Issues:', validation.cardAreaValidation.violations)
  console.log('Overall Issues:', validation.overallIssues)
  console.log('Recommendations:', validation.recommendations)
}
```

**Solutions:**

1. **Address specific validation failures:**
```typescript
// Fix container size issues
if (validation.overallIssues.includes('容器尺寸过小')) {
  console.log('Container too small, consider:')
  console.log('- Increasing container dimensions')
  console.log('- Reducing UI element count')
  console.log('- Using more compact spacing')
}

// Fix margin issues
if (validation.cardAreaValidation.violations.containerMargins) {
  const margins = getCardAreaSpacing(deviceType).containerMargins
  console.log('Current margins:', margins)
  console.log('Consider increasing container size or reducing margins')
}
```

2. **Implement graceful degradation:**
```typescript
function GracefulSpacingComponent() {
  const spacing = useDynamicSpacing({
    enableValidation: true,
    enableCardAreaSpacing: true
  })

  const [fallbackMode, setFallbackMode] = useState(false)

  useEffect(() => {
    if (spacing.validation && !spacing.validation.isValid) {
      if (spacing.validation.cardAreaValidation.fallbackRequired) {
        setFallbackMode(true)
        console.info('Switching to fallback spacing mode')
      }
    }
  }, [spacing.validation])

  if (fallbackMode) {
    return <FallbackSpacingLayout />
  }

  return <NormalSpacingLayout spacing={spacing} />
}
```

## Debug Tools and Commands

### Enable Debug Mode

```typescript
// Enable comprehensive debugging
const spacing = useDynamicSpacing({
  enableDebug: true,
  enableValidation: true,
  enableCardAreaSpacing: true
})

// Show debug overlay
displaySpacingDebugInfo(
  spacing.deviceType,
  containerWidth,
  containerHeight,
  cardCount,
  {
    enabled: true,
    showOverlay: true,
    showMeasurements: true,
    showViolations: true,
    logToConsole: true
  }
)
```

### Console Commands for Debugging

```typescript
// Check current spacing configuration
console.log('Spacing config:', getSpacingDebugInfo('desktop'))

// Generate comprehensive report
const report = generateSpacingDebugReport('desktop', 1024, 768, 8)
console.log('Debug report:', report)

// Validate specific measurements
const measuredSpacing = {
  containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
  rowSpacing: 20,
  cardSpacing: 16
}

const expectedSpacing = getCardAreaSpacing('desktop')
const measurementValidation = validateSpacingMeasurements(
  measuredSpacing,
  expectedSpacing,
  2 // 2px tolerance
)

console.log('Measurement validation:', measurementValidation)
```

### Browser DevTools Integration

```typescript
// Add to window for browser console access
if (process.env.NODE_ENV === 'development') {
  (window as any).spacingDebug = {
    getConfig: (deviceType: DeviceType) => getSpacingDebugInfo(deviceType),
    validate: (deviceType: DeviceType, width: number, height: number, cardCount: number) => 
      validateAllSpacing(deviceType, width, height, cardCount),
    generateReport: (deviceType: DeviceType, width: number, height: number, cardCount: number) =>
      generateSpacingDebugReport(deviceType, width, height, cardCount),
    showOverlay: () => displaySpacingDebugInfo('desktop', 1024, 768, 8, { 
      enabled: true, 
      showOverlay: true 
    })
  }
}

// Usage in browser console:
// spacingDebug.getConfig('desktop')
// spacingDebug.validate('desktop', 1024, 768, 8)
// spacingDebug.showOverlay()
```

## Error Recovery Patterns

### Pattern 1: Automatic Fallback

```typescript
function AutoFallbackSpacing({ children }: { children: React.ReactNode }) {
  const [spacingError, setSpacingError] = useState<Error | null>(null)
  const [fallbackSpacing, setFallbackSpacing] = useState<CardAreaSpacing | null>(null)

  const spacing = useDynamicSpacing({
    enableValidation: true,
    enableCardAreaSpacing: true
  })

  useEffect(() => {
    try {
      // Validate spacing configuration
      if (spacing.validation && !spacing.validation.isValid) {
        if (spacing.validation.cardAreaValidation.fallbackRequired) {
          const fallback = createFallbackSpacing(spacing.deviceType, {
            containerWidth: window.innerWidth,
            containerHeight: window.innerHeight
          })
          setFallbackSpacing(fallback)
        }
      }
    } catch (error) {
      setSpacingError(error as Error)
      console.error('Spacing configuration error:', error)
    }
  }, [spacing])

  if (spacingError || fallbackSpacing) {
    return (
      <div className="p-4">
        {spacingError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Spacing error: {spacingError.message}
          </div>
        )}
        <div style={{ 
          margin: fallbackSpacing ? 
            `${fallbackSpacing.containerMargins.top}px ${fallbackSpacing.containerMargins.right}px ${fallbackSpacing.containerMargins.bottom}px ${fallbackSpacing.containerMargins.left}px` : 
            '16px'
        }}>
          {children}
        </div>
      </div>
    )
  }

  return <div className={spacing.cssClasses.container.padding}>{children}</div>
}
```

### Pattern 2: Error Boundary with Spacing Recovery

```typescript
class SpacingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Spacing error caught by boundary:', error, errorInfo)
    
    // Report error to monitoring service
    if (error.message.includes('spacing') || error.message.includes('layout')) {
      console.warn('Spacing-related error detected, applying fallback')
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <strong>Layout Error:</strong> Using fallback spacing configuration
            </div>
            <div className="bg-white p-6 rounded shadow">
              {this.props.children}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage
function App() {
  return (
    <SpacingErrorBoundary>
      <CardFlipGame />
    </SpacingErrorBoundary>
  )
}
```

## Prevention Best Practices

### 1. Input Validation

```typescript
function validateSpacingInputs(
  containerWidth: number,
  containerHeight: number,
  cardCount: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    errors.push(`Invalid container width: ${containerWidth}`)
  }

  if (!Number.isFinite(containerHeight) || containerHeight <= 0) {
    errors.push(`Invalid container height: ${containerHeight}`)
  }

  if (!Number.isInteger(cardCount) || cardCount < 0) {
    errors.push(`Invalid card count: ${cardCount}`)
  }

  if (containerWidth > 10000 || containerHeight > 10000) {
    errors.push('Container dimensions suspiciously large')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### 2. Defensive Programming

```typescript
function safeCalculateSpacing(
  containerWidth: number,
  containerHeight: number,
  cardCount: number
) {
  try {
    // Validate inputs
    const validation = validateSpacingInputs(containerWidth, containerHeight, cardCount)
    if (!validation.isValid) {
      console.warn('Invalid spacing inputs:', validation.errors)
      return createFallbackSpacing('desktop')
    }

    // Attempt normal calculation
    const deviceType = detectDeviceType(containerWidth)
    return getCardAreaSpacing(deviceType)
    
  } catch (error) {
    console.error('Spacing calculation failed:', error)
    return createFallbackSpacing('desktop', {
      containerWidth,
      containerHeight,
      originalError: error as Error
    })
  }
}
```

### 3. Monitoring and Alerting

```typescript
function useSpacingMonitoring() {
  useEffect(() => {
    const monitorSpacing = () => {
      try {
        const spacing = useDynamicSpacing({
          enableValidation: true
        })

        if (spacing.validation && !spacing.validation.isValid) {
          // Log to monitoring service
          console.warn('Spacing validation failed', {
            issues: spacing.validation.overallIssues,
            deviceType: spacing.deviceType,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Spacing monitoring error:', error)
      }
    }

    // Monitor spacing every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(monitorSpacing, 30000)
      return () => clearInterval(interval)
    }
  }, [])
}
```

This troubleshooting guide provides comprehensive coverage of common spacing issues and their solutions, helping developers maintain robust and reliable card layout spacing.