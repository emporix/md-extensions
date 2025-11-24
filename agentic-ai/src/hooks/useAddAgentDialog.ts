import { useState, useEffect, useCallback } from 'react'
import { AgentTemplate } from '../types/Agent'
import { AgentService } from '../services/agentService'
import { AppState } from '../types/common'
import { getLocalizedValue } from '../utils/agentHelpers'
import { useToast } from '../contexts/ToastContext'

type Step = 'form' | 'loading' | 'success' | 'error'

interface UseAddAgentDialogProps {
  agentTemplate: AgentTemplate | null
  appState: AppState
  onSave: (name: string, description: string, templateId: string) => void
  onHide: () => void
}

export const useAddAgentDialog = ({
  agentTemplate,
  appState,
  onSave,
  onHide,
}: UseAddAgentDialogProps) => {
  const { showSuccess, showError } = useToast()
  const [step, setStep] = useState<Step>('form')
  const [agentId, setAgentId] = useState('')
  const [agentName, setAgentName] = useState('')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [userPrompt, setUserPrompt] = useState('')
  const [templatePrompt, setTemplatePrompt] = useState('')

  useEffect(() => {
    if (agentTemplate) {
      setAgentName(getLocalizedValue(agentTemplate.name, 'en'))
      setDescription(getLocalizedValue(agentTemplate.description, 'en'))
      setUserPrompt(agentTemplate.userPrompt || '')
      setTemplatePrompt(agentTemplate.templatePrompt)
    }
  }, [agentTemplate])

  const handleSave = useCallback(async () => {
    if (!agentTemplate) return

    setStep('loading')
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const agentService = new AgentService(appState)
      await agentService.copyTemplate(
        agentTemplate.id,
        agentId,
        agentName,
        description,
        userPrompt
      )

      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        setStep('success')
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create agent'
      setErrorMessage(errorMessage)
      showError(`Error creating agent: ${errorMessage}`)
      setStep('error')
    }
  }, [
    agentId,
    agentName,
    description,
    userPrompt,
    agentTemplate,
    appState,
    showError,
  ])

  const handleOk = useCallback(() => {
    if (step === 'success') {
      showSuccess('Agent created successfully!')
      onSave(agentName, description, agentTemplate?.id || '')
    }
    onHide()
    setStep('form')
    setProgress(0)
  }, [step, agentName, description, agentTemplate, onSave, onHide, showSuccess])

  const handleDiscard = useCallback(() => {
    onHide()
    setStep('form')
    setProgress(0)
    setAgentId('')
    setAgentName('')
    setDescription('')
  }, [onHide])

  const resetForm = useCallback(() => {
    setStep('form')
    setProgress(0)
    setAgentId('')
    setErrorMessage('')
    if (agentTemplate) {
      setAgentName(getLocalizedValue(agentTemplate.name, 'en'))
      setDescription(getLocalizedValue(agentTemplate.description, 'en'))
      setUserPrompt(agentTemplate.userPrompt || '')
      setTemplatePrompt(agentTemplate.templatePrompt || '')
    }
  }, [agentTemplate])

  return {
    step,
    agentId,
    agentName,
    description,
    userPrompt,
    templatePrompt,
    progress,
    errorMessage,
    setAgentId,
    setAgentName,
    setDescription,
    setUserPrompt,
    setTemplatePrompt,
    handleSave,
    handleOk,
    handleDiscard,
    resetForm,
  }
}
