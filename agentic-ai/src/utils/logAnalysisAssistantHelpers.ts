import { formatErrorPayloadMessage } from './errorHelpers'
import { normalizeEscapedNewlines } from './formatHelpers'

export type LogAnalysisEntry = {
  readonly severity: 'INFO' | 'ERROR' | 'WARNING'
  readonly message: string
}

export const LOG_ANALYSIS_ASSISTANT_I18N_KEYS = {
  emptyResponse: 'log_analysis_assistant_empty_response',
  templateNotFound: 'log_analysis_assistant_template_not_found',
} as const

export const LOG_ANALYSIS_ASSISTANT_I18N_MESSAGES = Object.values(
  LOG_ANALYSIS_ASSISTANT_I18N_KEYS
) as readonly string[]

const LLM_STARTED_HEADER_PATTERN =
  /LLM started\s*\(run\s*#(\d+)\)\s*for agent:\s*'([^']+)'/i
const WITH_PROMPTS_PATTERN = /with prompts:\s*/i
// Turn markers: newline-bound or Python list string entries ('AI: / "AI:)
const LAST_AI_TURN_PATTERN = /(?:^|[\n\r]|,\s*['"]|\[\s*['"])(?:AI|ai):/gi
const TOOL_ENDED_OUTPUT_PATTERN =
  /^(Tool ended \(agent: [^)]+\) with output: )([\s\S]*)$/i
const MAX_LLM_PROMPT_WITHOUT_AI_CHARS = 800
const MAX_TOOL_OUTPUT_CHARS = 600
const MAX_ANALYSIS_LOG_CHARS = 1200

const FAILURE_OUTPUT_PATTERN =
  /is_success":\s*false|status_code":\s*[45]\d{2}|not found|disabled|failed|exception/i

export const normalizeLogMessageForAnalysis = normalizeEscapedNewlines

const enforceMaxAnalysisLength = (message: string): string => {
  if (message.length <= MAX_ANALYSIS_LOG_CHARS) {
    return message
  }

  return (
    message.slice(0, MAX_ANALYSIS_LOG_CHARS) +
    '\n...[log truncated for analysis]...'
  )
}

/** Shrink large MCP/tool JSON payloads while keeping failure details intact. */
export const truncateToolEndedLogForAnalysis = (message: string): string => {
  const normalizedMessage = normalizeLogMessageForAnalysis(message)
  const match = normalizedMessage.match(TOOL_ENDED_OUTPUT_PATTERN)
  if (!match) {
    return message
  }

  const [, prefix, output] = match
  if (
    output.length <= MAX_TOOL_OUTPUT_CHARS ||
    FAILURE_OUTPUT_PATTERN.test(output)
  ) {
    return message
  }

  return (
    prefix +
    output.slice(0, MAX_TOOL_OUTPUT_CHARS) +
    '\n...[tool output truncated for analysis]...'
  )
}

/** Strip duplicated transcript history from LLM started logs before analysis. */
export const truncateLlmStartedLogForAnalysis = (message: string): string => {
  const normalizedMessage = normalizeLogMessageForAnalysis(message)

  if (
    !/LLM started/i.test(normalizedMessage) ||
    !WITH_PROMPTS_PATTERN.test(normalizedMessage)
  ) {
    return message
  }

  const headerMatch = normalizedMessage.match(LLM_STARTED_HEADER_PATTERN)
  const promptsMatch = normalizedMessage.match(WITH_PROMPTS_PATTERN)
  if (!promptsMatch || promptsMatch.index === undefined) {
    return message
  }

  const promptsBody = normalizedMessage.slice(
    promptsMatch.index + promptsMatch[0].length
  )

  LAST_AI_TURN_PATTERN.lastIndex = 0
  let lastAiStart = -1
  let match: RegExpExecArray | null = LAST_AI_TURN_PATTERN.exec(promptsBody)
  while (match !== null) {
    const aiMarkerOffset = match[0].search(/\bai:/i)
    if (aiMarkerOffset >= 0) {
      lastAiStart = match.index + aiMarkerOffset
    }
    match = LAST_AI_TURN_PATTERN.exec(promptsBody)
  }

  if (lastAiStart < 0) {
    if (normalizedMessage.length <= MAX_LLM_PROMPT_WITHOUT_AI_CHARS) {
      return message
    }

    return (
      normalizedMessage.slice(0, MAX_LLM_PROMPT_WITHOUT_AI_CHARS) +
      '\n...[LLM prompts truncated for analysis]...'
    )
  }

  const truncatedTail = promptsBody.slice(lastAiStart)
  const runNumber = headerMatch?.[1] ?? '?'
  const agentId = headerMatch?.[2] ?? 'unknown'

  return (
    `LLM started (run #${runNumber}) for agent: '${agentId}' (prompts truncated to last turn):\n` +
    truncatedTail
  )
}

/** Apply all analysis-only truncations for a single log message. */
export const truncateLogMessageForAnalysis = (message: string): string =>
  normalizeLogMessageForAnalysis(
    enforceMaxAnalysisLength(
      truncateToolEndedLogForAnalysis(truncateLlmStartedLogForAnalysis(message))
    )
  )

export const buildLogAnalysisInitialMessage = (
  logs: readonly LogAnalysisEntry[]
): string => {
  const analysisLogs = logs.map(({ severity, message }) => ({
    severity,
    message: truncateLogMessageForAnalysis(message),
  }))

  const errorCount = analysisLogs.filter(
    (log) => log.severity === 'ERROR'
  ).length
  const warningCount = analysisLogs.filter(
    (log) => log.severity === 'WARNING'
  ).length

  return (
    `Review the following ${analysisLogs.length} platform log entries for runtime/technical failures only ` +
    `(exceptions, failed tools, HTTP errors, missing/disabled resources).\n\n` +
    `Severity rules:\n` +
    `- Each log has severity INFO, WARNING, or ERROR.\n` +
    `- Treat WARNING and ERROR as primary failure signals.\n` +
    `- Report runtime errors when any WARNING/ERROR log indicates tool/MCP/HTTP failure, ` +
    `even if later INFO logs say "Agent execution completed successfully".\n` +
    `- Success completion lines do NOT cancel earlier WARNING/ERROR failures.\n\n` +
    `Failure indicators: severity WARNING/ERROR; "is_success": false; status_code 4xx/5xx; ` +
    `"not found"; "disabled"; "failed"; Exception.\n` +
    `Ignore customer complaint text and normal successful business steps.\n\n` +
    `Session summary before review: ${errorCount} ERROR, ${warningCount} WARNING, ` +
    `${analysisLogs.length - errorCount - warningCount} INFO log entries.\n\n` +
    `Logs (JSON array):\n${JSON.stringify(analysisLogs, null, 2)}`
  )
}

/** Prefer plain text from structured agent/error JSON (incl. SSE data: lines). */
export const extractLogAnalysisDisplayText = (content: string): string =>
  formatErrorPayloadMessage(content) || content

export const createChatMessageId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
