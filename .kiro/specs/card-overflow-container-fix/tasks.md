# Implementation Plan

- [x] 1. Create available card space calculation system


  - Implement `calculateAvailableCardSpace` function to accurately determine usable area for cards
  - Add UI element height calculations for game info, status, buttons, and warnings
  - Include container padding and margin calculations in available space
  - Add validation for minimum space requirements and fallback handling
  - _Requirements: 1.1, 1.4, 2.1, 2.2_

- [x] 2. Fix core position calculation function and missing function reference



  - Replace broken `adaptiveCardAreaSpacing` reference with proper spacing calculations
  - Update `calculateCardPositions` to use `calculateAvailableCardSpace` instead of missing function
  - Add comprehensive error handling with try-catch blocks around all calculation steps
  - Implement input validation for container dimensions and card count
  - Fix TypeError: __webpack_require__(...).adaptiveCardAreaSpacing is not a function
  - _Requirements: 1.1, 1.2, 4.3, 4.4, 8.1, 8.3_

- [x] 3. Fix multi-row overflow issue for 4+ cards


  - Implement proper vertical space calculation to prevent second row overflow
  - Add row height validation to ensure all rows fit within container boundaries
  - Fix positioning logic for second row cards that currently overflow container bottom
  - Add multi-row layout validation to check total grid height against available space
  - Ensure 4-5 card layouts position second row within visible container area
  - _Requirements: 6.1, 6.2, 6.4, 10.1, 10.4_

- [x] 4. Fix 7+ cards dealing failure and undefined position errors



  - Implement `ensureValidPositionArray` function to guarantee valid positions for all card counts
  - Add `calculateSafePositionForIndex` function to generate safe positions for individual cards
  - Fix "Cannot read properties of undefined (reading 'x')" error in dealing animation
  - Add position array length validation to ensure array matches card count
  - Implement emergency fallback positions when calculation fails for high card counts
  - _Requirements: 7.1, 7.2, 7.3, 10.1, 10.3_

- [ ] 5. Implement boundary-aware position calculation
  - Create `calculateBoundaryAwarePositions` function that respects container limits
  - Add `determineOptimalLayout` function to choose best grid configuration for card count
  - Implement `calculateOptimalCardSize` to ensure cards fit within available space
  - Add `calculateSafeSpacing` to prevent overflow with appropriate card spacing
  - _Requirements: 1.1, 1.3, 2.1, 2.3_

- [ ] 7. Add real-time position boundary validation
  - Implement `validatePositionBoundaries` function to check all card positions against container edges
  - Create detailed violation reporting with specific overflow amounts and directions
  - Add `validateAndCorrectPositions` function to automatically fix boundary violations
  - Include comprehensive logging for debugging position validation issues
  - _Requirements: 1.4, 3.1, 3.2, 3.3_

- [ ] 8. Optimize 6-card specific layout logic
  - Add special handling for 6-card layouts in `determineOptimalLayout` function
  - Implement aspect ratio-based layout selection (2x3 vs 3x2) for 6 cards
  - Ensure 6-card layouts prioritize balanced distribution over maximum card size
  - Add single-row layout option for 6 cards when container width permits
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Create enhanced fallback system
  - Implement `createContainerAwareFallback` function for error recovery
  - Add `createSafeGridLayout` function as ultimate fallback with guaranteed container fit
  - Replace existing fallback logic with container-aware calculations
  - Ensure fallback layouts maintain card interactivity and visibility
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 11. Update window resize handler with corrected logic
  - Modify existing resize handler to use new position calculation functions
  - Add position validation before applying new positions during resize
  - Implement smooth transitions for position updates with boundary checking
  - Add fallback to maintain current positions if resize validation fails
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12. Add comprehensive error handling and logging
  - Wrap all position calculations in try-catch blocks with specific error messages
  - Add detailed console logging for debugging position calculation steps
  - Implement error context logging including container dimensions and card count
  - Add visual debugging indicators for development mode boundary checking
  - _Requirements: 3.4, 8.2, 8.4, 8.5_

- [ ] 13. Implement adaptive card sizing system
  - Add logic to reduce card size when container space is limited
  - Implement minimum size thresholds to maintain card readability
  - Add aspect ratio preservation during card size adjustments
  - Create size adaptation logging to track when and why cards are resized
  - _Requirements: 2.2, 2.4, 2.5_

- [ ] 15. Add visual debugging tools for development
  - Implement container boundary visualization in development mode
  - Add card position indicators showing calculated vs actual positions
  - Create overlay system to display available space boundaries
  - Add console group logging for organized position calculation debugging
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 16. Create unit tests for multi-row overflow scenarios
  - Test 4-card layout to ensure second row doesn't overflow container bottom
  - Test 5-card layout with proper second row positioning within boundaries
  - Test multi-row height calculation against available container space
  - Test row positioning logic for various card counts (4, 5, 6, 7+)
  - _Requirements: 6.1, 6.2, 6.4, 10.4_

- [ ] 17. Create integration tests for 7+ card dealing failures
  - Test dealing animation completion for 7, 8, 9, 10 card scenarios
  - Test position array generation to ensure no undefined values
  - Test error recovery when position calculation fails for high card counts
  - Test game interactivity after successful dealing of 7+ cards
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1_

- [ ] 18. Create function reference error tests
  - Test system behavior when `adaptiveCardAreaSpacing` function is missing
  - Test fallback activation when required functions are not available
  - Test error logging for missing function references
  - Test alternative spacing calculation methods when primary functions fail
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [ ] 19. Create comprehensive boundary violation testing
  - Create tests that intentionally generate positions outside container bounds
  - Test automatic position correction for various overflow scenarios
  - Test boundary validation performance with large numbers of cards
  - Test edge cases where correction might not be possible
  - _Requirements: 1.3, 3.1, 3.2_

- [ ] 20. Add performance optimization for position calculations
  - Optimize position calculation performance for frequent resize events
  - Add memoization for expensive layout calculations
  - Implement efficient boundary checking algorithms
  - Add performance monitoring for position calculation timing
  - _Requirements: 9.4, 9.5_

- [ ] 21. Create visual regression tests for all card counts
  - Test that all cards remain visible within container boundaries for 1-10 cards
  - Test multi-row layout visual balance and spacing consistency
  - Test fallback layout appearance and card distribution
  - Test position update smoothness during window resize operations
  - Test 6-card layout visual balance in different container aspect ratios
  - _Requirements: 1.1, 1.3, 5.2, 6.4, 10.4_