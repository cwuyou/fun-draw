# Requirements Document

## Introduction

This feature addresses critical bugs in the card flip lottery system where the card display count, positioning, winner selection logic, and animation/audio feedback are not working correctly. The system currently shows incorrect card counts, has positioning issues that cause UI overlap, incorrectly marks all cards as winners regardless of the configured quantity, lacks proper shuffling and dealing animations, and has no audio feedback during game phases.

## Requirements

### Requirement 1

**User Story:** As a user setting up a card flip lottery with quantity 1, I want to see exactly 1 card during shuffling and dealing, so that the visual representation matches my configuration.

#### Acceptance Criteria

1. WHEN the user configures quantity as 1 THEN the system SHALL display exactly 1 card during shuffling phase
2. WHEN the user configures quantity as N THEN the system SHALL display exactly N cards during all game phases
3. WHEN the shuffling phase begins THEN the card deck component SHALL use the actual configured quantity instead of a minimum of 3 cards
4. WHEN the dealing phase begins THEN the system SHALL create exactly the configured quantity of game cards

### Requirement 2

**User Story:** As a user playing the card flip lottery, I want the cards to maintain proper positioning throughout all game phases, so that they don't overlap with UI text or other elements.

#### Acceptance Criteria

1. WHEN cards are in shuffling phase THEN they SHALL maintain consistent positioning relative to game information text
2. WHEN shuffling completes and dealing begins THEN cards SHALL NOT shift position in a way that covers UI text
3. WHEN cards are positioned THEN they SHALL have adequate spacing from game status information below
4. WHEN the game layout is calculated THEN it SHALL account for proper margins to prevent text overlap
5. WHEN cards transition between phases THEN positioning SHALL be smooth and not cause layout jumps

### Requirement 3

**User Story:** As a user who configured the lottery to select 1 winner, I want only 1 card to show as a winner when flipped, so that the results match my configuration.

#### Acceptance Criteria

1. WHEN the user configures quantity as 1 THEN exactly 1 card SHALL be marked as winner
2. WHEN the user configures quantity as N THEN exactly N cards SHALL be marked as winners
3. WHEN winner selection occurs THEN the system SHALL respect the allowRepeat setting for winner distribution
4. WHEN cards are created THEN only the first N cards (where N is quantity) SHALL have winner content
5. WHEN cards beyond the quantity limit are created THEN they SHALL be marked as empty/non-winner cards

### Requirement 4

**User Story:** As a user viewing the game information display, I want the "抽取数量" (draw quantity) to show the actual configured quantity, so that the display is consistent with my settings.

#### Acceptance Criteria

1. WHEN the game displays draw quantity THEN it SHALL show the user-configured quantity value
2. WHEN the game displays total cards THEN it SHALL show the actual number of cards being displayed
3. WHEN the header shows draw quantity THEN it SHALL match the game information display
4. WHEN quantity is 1 THEN all quantity displays SHALL consistently show 1
5. WHEN the game state changes THEN quantity displays SHALL remain accurate and consistent

### Requirement 5

**User Story:** As a user with "不允许重复中奖" (no repeat winners) enabled, I want the system to properly handle winner selection logic, so that the lottery results are fair and follow the configured rules.

#### Acceptance Criteria

1. WHEN allowRepeat is false AND quantity is 1 THEN exactly 1 unique winner SHALL be selected
2. WHEN winner selection occurs THEN the system SHALL use the configured quantity for selection logic
3. WHEN cards are distributed THEN winner cards SHALL be randomly positioned among all displayed cards
4. WHEN the game creates cards THEN it SHALL properly distinguish between winner and non-winner cards
5. WHEN multiple rounds are played THEN previously selected winners SHALL be excluded if allowRepeat is false

### Requirement 6

**User Story:** As a user starting a card flip lottery, I want to see a proper shuffling animation that shows all my uploaded cards being shuffled, so that I can visually confirm the lottery process is working correctly.

#### Acceptance Criteria

1. WHEN the user clicks "开始抽奖" THEN the system SHALL display a shuffling animation showing all uploaded cards
2. WHEN shuffling begins THEN the system SHALL show the exact number of cards matching the uploaded list count
3. WHEN cards are shuffling THEN they SHALL move in a realistic shuffling pattern with proper timing
4. WHEN shuffling animation plays THEN it SHALL have a minimum duration to be visually perceptible
5. WHEN shuffling completes THEN the system SHALL smoothly transition to the dealing phase

### Requirement 7

**User Story:** As a user watching the card dealing process, I want to see cards being dealt one by one according to my configured quantity, so that the dealing process feels realistic and engaging.

#### Acceptance Criteria

1. WHEN dealing phase begins THEN cards SHALL be dealt one at a time with visible animation
2. WHEN dealing cards THEN each card SHALL appear with a staggered timing interval
3. WHEN the configured quantity is N THEN exactly N cards SHALL be dealt with individual animations
4. WHEN dealing animation plays THEN each card SHALL have a smooth appearance transition
5. WHEN all cards are dealt THEN the system SHALL be ready for user interaction

### Requirement 8

**User Story:** As a user playing the card flip lottery, I want to hear appropriate sound effects during shuffling and dealing phases, so that the experience feels more engaging and provides audio feedback.

#### Acceptance Criteria

1. WHEN shuffling animation begins THEN the system SHALL play shuffling sound effects
2. WHEN cards are being dealt THEN the system SHALL play card dealing sound effects
3. WHEN sound effects play THEN they SHALL be synchronized with the visual animations
4. WHEN user has sound enabled THEN all game phase transitions SHALL have appropriate audio feedback
5. WHEN user has sound disabled THEN the game SHALL function normally without audio
