import { describe, it, expect } from 'vitest'
import { getModeSpecificConfig } from '../mode-config'

describe('Simple Grid Lottery Test', () => {
  it('should work', () => {
    const config = getModeSpecificConfig('grid-lottery', 6, false)
    expect(config.quantityValue).toBe(1)
  })
})