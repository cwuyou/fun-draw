# Implementation Plan

- [x] 1. Fix CardFlipGame component quantity logic





  - Remove forced minimum card count logic that overrides user configuration
  - Update actualQuantity calculation to respect user-configured quantity
  - Ensure quantity 1 displays exactly 1 card instead of forcing 3 cards minimum
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Fix winner selection algorithm


  - Update selectWinners function to select exactly the configured quantity of winners
  - Fix winner distribution logic to randomly place winners among all displayed cards
  - Ensure non-winner cards are properly marked as empty/non-winner
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix card creation and distribution logic

  - Update createGameCards function to properly distribute winners among total cards
  - Implement random winner positioning instead of sequential winner placement
  - Ensure cards beyond quantity limit are marked as non-winners with null content
  - _Requirements: 3.4, 3.5_

- [x] 4. Fix card positioning calculations


  - Update calculateCardPositions to include proper spacing for UI text
  - Add margins to prevent cards from overlapping with game information text
  - Ensure consistent positioning between shuffling and dealing phases
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_




- [x] 5. Update CardDeck component to respect actual quantity















  - Remove any minimum card forcing logic in CardDeck component
  - Ensure CardDeck uses the passed totalCards parameter without modification
  - Fix card initialization to handle single card scenarios properly
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6. Fix game information display consistency








  - Ensure "抽取数量" displays the actual configured quantity value
  - Update all quantity-related displays to show consistent values
  - Verify header quantity display matches game information display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Add validation and error handling




  - Add quantity validation to prevent invalid configurations
  - Implement proper error handling for edge cases
  - Add validation for position calculations to prevent layout overflow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Write unit tests for fixed logic












  - Create tests for quantity logic to verify actualQuantity equals configured quantity
  - Write tests for winner selection to ensure exact quantity of winners
  - Add tests for card positioning to prevent UI text overlap
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 2.3_

- [x] 9. Write integration tests for game flow







  - Test complete game flow with quantity 1 to verify single card behavior
  - Test game flow with various quantities (1-10) to ensure consistency
  - Test UI consistency across all quantity displays
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Implement shuffling animation system


















































  - Add proper shuffling animation to CardDeck component that shows all uploaded cards
  - Implement realistic card movement patterns during shuffle phase
  - Add minimum duration for shuffling animation to be visually perceptible
  - Ensure smooth transition from shuffling to dealing phase
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Implement dealing animation system













  - Add staggered card dealing animation that shows cards appearing one by one
  - Implement proper timing intervals between each card appearance
  - Ensure dealing animation respects the configured quantity
  - Add smooth appearance transitions for each dealt card
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Implement audio system integration



  - Add shuffling sound effects synchronized with shuffling animation
  - Add card dealing sound effects for each card being dealt
  - Implement card flip sound effects for user interactions
  - Add winner reveal sound effects with proper timing
  - Ensure audio system respects user sound preferences
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 13. Write unit tests for animation and audio systems



  - Test shuffling animation timing and card movement
  - Test dealing animation sequence and card appearance
  - Test audio system integration and sound synchronization
  - Test animation system with different card quantities
  - _Requirements: 6.3, 6.4, 7.2, 7.3, 8.3_

- [x] 14. Write integration tests for enhanced game flow


  - Test complete game flow with shuffling and dealing animations
  - Test audio feedback during all game phases
  - Test animation performance with various quantities
  - Test user interaction during animated phases
  - _Requirements: 6.5, 7.5, 8.4_




- [x] 15. Perform visual regression testing


  - Create screenshot tests for different quantity configurations
  - Test layout consistency across device sizes
  - Verify position consistency between game phases
  - Test animation smoothness and timing
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 6.4, 7.4_

- [x] 16. Fix shuffle timing and user control issues











  - Add "开始抽奖" button to card flip lottery page instead of auto-starting shuffle
  - Prevent automatic shuffle on page load - wait for user interaction
  - Remove automatic shuffle after card flip completion
  - Add proper delay between game completion and result modal display
  - Prevent automatic shuffle after closing result modal
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_