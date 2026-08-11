import { describe, expect, it } from 'vitest'
import {
  hasChannelTrigger,
  isSlackTriggerToolValidationValid,
  isTeamsTriggerToolValidationValid,
} from './agentTriggerValidationHelpers'

describe('agentTriggerValidationHelpers', () => {
  describe('isSlackTriggerToolValidationValid', () => {
    it('requires exactly one slack tool when slack trigger is selected', () => {
      expect(isSlackTriggerToolValidationValid(['slack'], 0)).toBe(false)
      expect(isSlackTriggerToolValidationValid(['slack'], 2)).toBe(false)
      expect(isSlackTriggerToolValidationValid(['slack'], 1)).toBe(true)
    })

    it('ignores slack tool count when slack trigger is not selected', () => {
      expect(isSlackTriggerToolValidationValid(['endpoint'], 0)).toBe(true)
      expect(isSlackTriggerToolValidationValid(['endpoint'], 2)).toBe(true)
    })
  })

  describe('isTeamsTriggerToolValidationValid', () => {
    it('requires exactly one teams tool when teams trigger is selected', () => {
      expect(isTeamsTriggerToolValidationValid(['teams'], 0)).toBe(false)
      expect(isTeamsTriggerToolValidationValid(['teams'], 2)).toBe(false)
      expect(isTeamsTriggerToolValidationValid(['teams'], 1)).toBe(true)
    })

    it('ignores teams tool count when teams trigger is not selected', () => {
      expect(isTeamsTriggerToolValidationValid(['endpoint'], 0)).toBe(true)
      expect(isTeamsTriggerToolValidationValid(['endpoint'], 2)).toBe(true)
    })
  })

  describe('hasChannelTrigger', () => {
    it('detects slack or teams triggers', () => {
      expect(hasChannelTrigger(['slack'])).toBe(true)
      expect(hasChannelTrigger(['teams'])).toBe(true)
      expect(hasChannelTrigger(['endpoint'])).toBe(false)
      expect(hasChannelTrigger(['teams', 'endpoint'])).toBe(true)
    })
  })
})
