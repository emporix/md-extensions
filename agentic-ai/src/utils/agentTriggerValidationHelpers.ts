import { SLACK_TRIGGER } from './slackRoutingHelpers'
import { TEAMS_TRIGGER } from './teamsRoutingHelpers'

export const hasChannelTrigger = (triggerTypes: readonly string[]): boolean =>
  triggerTypes.includes(SLACK_TRIGGER) || triggerTypes.includes(TEAMS_TRIGGER)

export const isSlackTriggerToolValidationValid = (
  triggerTypes: readonly string[],
  selectedSlackToolCount: number
): boolean =>
  !triggerTypes.includes(SLACK_TRIGGER) || selectedSlackToolCount === 1

export const isTeamsTriggerToolValidationValid = (
  triggerTypes: readonly string[],
  selectedTeamsToolCount: number
): boolean =>
  !triggerTypes.includes(TEAMS_TRIGGER) || selectedTeamsToolCount === 1
