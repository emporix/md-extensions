import { describe, expect, it } from 'vitest'
import { realLlmStartedLogFixture } from './fixtures/llmStartedLog.compact'
import {
  buildLogAnalysisInitialMessage,
  normalizeLogMessageForAnalysis,
  truncateLlmStartedLogForAnalysis,
  truncateLogMessageForAnalysis,
  truncateToolEndedLogForAnalysis,
} from './logAnalysisAssistantHelpers'

describe('normalizeLogMessageForAnalysis', () => {
  it('converts escaped newlines to real newlines', () => {
    expect(normalizeLogMessageForAnalysis('line1\\nline2')).toBe('line1\nline2')
  })
})

describe('truncateLlmStartedLogForAnalysis', () => {
  it('leaves non-LLM-started logs unchanged', () => {
    const message = 'Tool send-invoice called by agent openai-complaint-agent'

    expect(truncateLlmStartedLogForAnalysis(message)).toBe(message)
  })

  it('keeps only the last AI turn and trailing Tool output', () => {
    const message =
      "LLM started (run #10) for agent: 'google-complaint-audit' with prompts: ['System: long system prompt', 'Human: complaint text', \"AI: [{'name': 'get_order'}]\", 'Tool: order payload', \"AI: [{'name': 'upsert_custom_type_instance'}]\", 'Tool: {\"is_success\": true}']"

    const result = truncateLlmStartedLogForAnalysis(message)

    expect(result).toBe(
      "LLM started (run #10) for agent: 'google-complaint-audit' (prompts truncated to last turn):\n" +
        "AI: [{'name': 'upsert_custom_type_instance'}]\", 'Tool: {\"is_success\": true}']"
    )
    expect(result).not.toContain('get_order')
    expect(result).not.toContain('System:')
    expect(result).not.toContain('Human:')
  })

  it('returns original log when no AI turn marker is found', () => {
    const message =
      "LLM started (run #2) for agent: 'google-complaint-categorization' with prompts: ['System: classify complaint', 'Human: missing invoice']"

    expect(truncateLlmStartedLogForAnalysis(message)).toBe(message)
  })

  it('truncates long LLM started logs without AI turn markers', () => {
    const message =
      "LLM started (run #1) for agent: 'complaint' with prompts: ['System: " +
      'x'.repeat(1200) +
      "', 'Human: complaint']"

    const result = truncateLlmStartedLogForAnalysis(message)

    expect(result).toContain('...[LLM prompts truncated for analysis]...')
    expect(result.length).toBeLessThan(message.length)
  })

  it('preserves run number and agent id in truncated header', () => {
    const message =
      "LLM started (run #9) for agent: 'google-complaint-audit' with prompts: ['System: audit', \"AI: first\", 'Tool: ok', \"AI: second\"]"

    const result = truncateLlmStartedLogForAnalysis(message)

    expect(
      result.startsWith(
        "LLM started (run #9) for agent: 'google-complaint-audit' (prompts truncated to last turn):\n"
      )
    ).toBe(true)
    expect(result).toContain('AI: second')
    expect(result).not.toContain('AI: first')
  })

  it('matches newline-bound AI turns inside serialized prompt strings', () => {
    const message =
      "LLM started (run #3) for agent: 'google-complaint-agent' with prompts: ['System: orchestrator\\nHuman: complaint\\nAI: [{'name': 'transfer_to_audit'}]\\nTool: ok\\nAI: [{'name': 'send_invoice'}]\\nTool: done']"

    const result = truncateLlmStartedLogForAnalysis(message)

    expect(result).toContain('prompts truncated to last turn')
    expect(result).toContain("AI: [{'name': 'send_invoice'}]")
    expect(result).not.toContain('transfer_to_audit')
  })

  it('does not treat inline AI mentions in system text as turn markers', () => {
    const message =
      "LLM started (run #4) for agent: 'google-complaint-agent' with prompts: ['System: You are an AI: assistant\\nHuman: hi\\nAI: final']"

    const result = truncateLlmStartedLogForAnalysis(message)

    expect(result).toContain('AI: final')
    expect(result).not.toContain('You are an')
  })

  it('truncates real backend LLM started log fixture with escaped newlines', () => {
    const result = truncateLlmStartedLogForAnalysis(realLlmStartedLogFixture)

    expect(result).toContain('prompts truncated to last turn')
    expect(result).toContain(
      "AI: [{'name': 'transfer_back_to_google_complaint_agent'}]"
    )
    expect(result).not.toContain('transfer_to_google_complaint_categorization')
    expect(result.length).toBeLessThan(realLlmStartedLogFixture.length)
  })
})

describe('truncateToolEndedLogForAnalysis', () => {
  it('keeps short tool outputs unchanged', () => {
    const message =
      'Tool ended (agent: complaint) with output: Retrieved order EON1002'

    expect(truncateToolEndedLogForAnalysis(message)).toBe(message)
  })

  it('keeps failure tool outputs unchanged even when long', () => {
    const message =
      'Tool ended (agent: complaint) with output: {"is_success": false, "status_code": 400, "description": "' +
      'x'.repeat(1200) +
      '"}'

    expect(truncateToolEndedLogForAnalysis(message)).toBe(message)
  })

  it('truncates large successful tool JSON payloads', () => {
    const message =
      'Tool ended (agent: complaint) with output: {"is_success": true, "data": "' +
      'x'.repeat(1200) +
      '"}'

    const result = truncateToolEndedLogForAnalysis(message)

    expect(result).toContain('...[tool output truncated for analysis]...')
    expect(result.length).toBeLessThan(message.length)
  })
})

describe('truncateLogMessageForAnalysis', () => {
  it('normalizes escaped newlines when no truncators apply', () => {
    const message = 'Agent step completed\\nnext line'

    expect(truncateLogMessageForAnalysis(message)).toBe(
      'Agent step completed\nnext line'
    )
  })
})

describe('buildLogAnalysisInitialMessage', () => {
  it('applies truncation before serializing logs for analysis', () => {
    const logs = [
      {
        severity: 'INFO' as const,
        message: 'Agent execution completed successfully',
      },
      {
        severity: 'INFO' as const,
        message:
          "LLM started (run #10) for agent: 'google-complaint-audit' with prompts: ['System: audit', \"AI: earlier\", 'Tool: x', \"AI: latest\", 'Tool: y']",
      },
    ]

    const message = buildLogAnalysisInitialMessage(logs)

    expect(message).toContain('Agent execution completed successfully')
    expect(message).toContain('"severity": "INFO"')
    expect(message).toContain('prompts truncated to last turn')
    expect(message).toContain('AI: latest')
    expect(message).not.toContain('AI: earlier')
    expect(message).not.toContain('System: audit')
  })

  it('includes severity for error and warning logs', () => {
    const logs = [
      { severity: 'ERROR' as const, message: 'Tool failed with HTTP 500' },
      { severity: 'WARNING' as const, message: 'Retrying request' },
    ]

    const message = buildLogAnalysisInitialMessage(logs)

    expect(message).toContain('"severity": "ERROR"')
    expect(message).toContain('"severity": "WARNING"')
    expect(message).toContain('Tool failed with HTTP 500')
    expect(message).toContain('Retrying request')
  })

  it('includes severity guidance and pre-counts errors and warnings', () => {
    const logs = [
      {
        severity: 'INFO' as const,
        message: 'Agent execution completed successfully',
      },
      {
        severity: 'WARNING' as const,
        message:
          "Tool ended (agent: complaint) with output: Inbound agent 'support-agent' was not found or is disabled",
      },
      {
        severity: 'ERROR' as const,
        message: 'Tool ended (agent: complaint) with output: handoff failed',
      },
    ]

    const message = buildLogAnalysisInitialMessage(logs)

    expect(message).toContain('Severity rules:')
    expect(message).toContain('1 ERROR, 1 WARNING, 1 INFO')
    expect(message).toContain(
      'Success completion lines do NOT cancel earlier WARNING/ERROR failures'
    )
    expect(message).toContain('support-agent')
  })
})
