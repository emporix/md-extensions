import { useEffect, useState } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import {
  RECOMMENDED_PROMPTS_AGENT_ID,
  chatWithAgentOnce,
  fetchEventSubscriptions,
} from '../services/agentService'
import { isAbortError } from '../utils/errorHelpers'
import {
  buildRecommendationMessage,
  parseChatRecommendations,
  selectCommerceEventSchemas,
  type ChatRecommendation,
  type CommerceEventSchema,
} from '../utils/chatRecommendations'

type RecommendationTarget = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly prompt: string
  readonly templatePrompt?: string
  readonly commerceEventTypes: readonly string[]
}

const loadEventSchemas = async (
  appState: Parameters<typeof fetchEventSubscriptions>[0],
  eventTypes: readonly string[],
  signal: AbortSignal
): Promise<readonly CommerceEventSchema[]> => {
  if (eventTypes.length === 0) {
    return []
  }
  const subscriptions = await fetchEventSubscriptions(appState, signal)
  return selectCommerceEventSchemas(subscriptions, eventTypes)
}

type RecommendationState = {
  readonly targetId: string | null
  readonly recommendations: readonly ChatRecommendation[]
}

export const useChatRecommendations = (
  target: RecommendationTarget | null,
  enabled = false
): {
  readonly recommendations: readonly ChatRecommendation[]
  readonly loading: boolean
} => {
  const appState = useAppState()
  const [state, setState] = useState<RecommendationState>({
    targetId: null,
    recommendations: [],
  })

  const targetId = target?.id ?? null
  const targetName = target?.name ?? ''
  const targetDescription = target?.description ?? ''
  const targetPrompt = target?.prompt ?? ''
  const targetTemplatePrompt = target?.templatePrompt
  const commerceEventTypesKey = (target?.commerceEventTypes ?? []).join('\n')

  useEffect(() => {
    if (!enabled || !targetId || targetId === RECOMMENDED_PROMPTS_AGENT_ID) {
      setState({ targetId: null, recommendations: [] })
      return
    }

    const controller = new AbortController()
    const commerceEventTypes = commerceEventTypesKey
      ? commerceEventTypesKey.split('\n')
      : []

    const load = async () => {
      let eventSchemas: readonly CommerceEventSchema[] = []
      if (commerceEventTypes.length > 0) {
        try {
          eventSchemas = await loadEventSchemas(
            appState,
            commerceEventTypes,
            controller.signal
          )
        } catch (err: unknown) {
          if (isAbortError(err)) {
            return
          }
          console.error('Failed to load commerce event schemas', err)
        }
      }
      if (controller.signal.aborted) {
        return
      }

      const reply = await chatWithAgentOnce(
        appState,
        RECOMMENDED_PROMPTS_AGENT_ID,
        buildRecommendationMessage({
          agentName: targetName,
          agentDescription: targetDescription,
          agentPrompt: targetPrompt,
          templatePrompt: targetTemplatePrompt,
          eventSchemas,
        }),
        {
          signal: controller.signal,
          emptyResponseKey: 'chat_error',
        }
      )
      if (controller.signal.aborted) {
        return
      }
      setState({
        targetId,
        recommendations: parseChatRecommendations(reply),
      })
    }

    void load().catch((err: unknown) => {
      if (isAbortError(err) || controller.signal.aborted) {
        return
      }
      console.error('Failed to load chat recommendations', err)
      setState({ targetId, recommendations: [] })
    })

    return () => {
      controller.abort()
    }
  }, [
    appState,
    commerceEventTypesKey,
    enabled,
    targetDescription,
    targetId,
    targetName,
    targetPrompt,
    targetTemplatePrompt,
  ])

  const recommendations =
    state.targetId === targetId ? state.recommendations : []
  const loading = Boolean(
    enabled &&
      targetId &&
      targetId !== RECOMMENDED_PROMPTS_AGENT_ID &&
      state.targetId !== targetId
  )

  return { recommendations, loading }
}
