import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import {
  Dialog,
  Dropdown,
  InputText,
  PrimaryButton,
  ProgressSpinner,
  RadioButton,
  SecondaryButton,
  useToast,
} from '@emporix/component-library'
import { useConfiguration } from '../../context/ConfigurationProvider'
import InputField from '../shared/InputField'
import { useAiApi } from '../../hooks/api/ai'
import type { AiTextResponse } from '../../models/Ai.model'
import type Localized from '../../models/Localized.model'
import styles from './AssistantBox.module.scss'

interface AssistantBoxProps {
  readonly productName: Localized
  readonly productDescription?: Localized
  readonly visible: boolean
  readonly onAccept: (description: Localized | undefined) => void
  readonly onReject: () => void
  readonly loading?: boolean
  readonly buttonClassName?: string
  readonly title?: string
}

interface AiAssistantBoxRowProps {
  readonly language: string
  readonly row?: DescriptionRow
}

interface DescriptionRow {
  prompt: string
  originalDescription: string
  aiSuggestion: string
  aiSuggestionSelected: boolean
}

const AiAssistantBoxRow = ({ language, row }: AiAssistantBoxRowProps) => {
  const methods = useForm<DescriptionRow>()
  const { control, reset } = methods
  const { t } = useTranslation()

  useEffect(() => {
    reset(row)
  }, [row, reset])

  // MD writes edits straight into the shared prompts map entry.
  const setRowValue = <K extends keyof DescriptionRow>(
    propertyName: K,
    value: DescriptionRow[K]
  ) => {
    if (row) {
      row[propertyName] = value
    }
  }

  const languageAddon = (
    <span className={styles.addon}>{language.toUpperCase()}</span>
  )

  return (
    <div className={styles.row}>
      <div className={styles.column}>
        <div className={styles.header}>{t('assistantBox.headers.prompt')}</div>
        <div className={styles.inputGroup}>
          {languageAddon}
          <Controller
            name="prompt"
            control={control}
            render={({ field }) => (
              <InputText
                textarea
                className={styles.textarea}
                onChange={(event) => {
                  field.onChange(event)
                  setRowValue('prompt', event.target.value)
                }}
                value={field.value ?? ''}
              />
            )}
          />
        </div>
      </div>
      <div className={styles.column}>
        <Controller
          name="aiSuggestionSelected"
          control={control}
          render={({ field }) => (
            <RadioButton
              inputId={`originalDescription${language}`}
              name={`aiSuggestionSelected-${language}`}
              value={false}
              className={styles.radio}
              checked={!field.value}
              label={t('assistantBox.headers.originalDescription')}
              onChange={() => {
                field.onChange(false)
                setRowValue('aiSuggestionSelected', false)
              }}
            />
          )}
        />
        <div className={styles.inputGroup}>
          {languageAddon}
          <InputText
            textarea
            className={styles.textarea}
            value={row?.originalDescription ?? ''}
            readOnly
          />
        </div>
      </div>
      <div className={styles.column}>
        <Controller
          name="aiSuggestionSelected"
          control={control}
          render={({ field }) => (
            <RadioButton
              inputId={`aiSuggestion${language}`}
              name={`aiSuggestionSelected-${language}`}
              value={true}
              className={styles.radio}
              checked={!!field.value}
              label={t('assistantBox.headers.aiSuggestion')}
              onChange={() => {
                field.onChange(true)
                setRowValue('aiSuggestionSelected', true)
              }}
            />
          )}
        />
        <div className={styles.inputGroup}>
          {languageAddon}
          <InputText
            textarea
            className={styles.textarea}
            value={row?.aiSuggestion ?? ''}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}

const AssistantBox = ({
  productName,
  productDescription = {},
  visible,
  onAccept,
  onReject,
  loading = false,
  buttonClassName,
  title = 'assistantBox.title',
}: AssistantBoxProps) => {
  const { t } = useTranslation()
  const { configuration } = useConfiguration()
  const { generateText } = useAiApi()
  const [languages, setLanguages] = useState<string[]>([])
  const [prompts, setPrompts] = useState(new Map<string, DescriptionRow>())
  const [aiExecuted, setAiExecuted] = useState(false)
  const [aiExecutionInProgress, setAiExecutionInProgress] = useState(false)
  const toast = useToast()

  const languageOptions = useMemo(
    () =>
      (configuration?.languages ?? []).map((language) => ({
        id: language.id,
        label: language.label,
      })),
    [configuration?.languages]
  )

  const getProductName = (lang: string) => {
    if (productName?.[lang]) return productName[lang]
    return productName ? productName['en'] : ''
  }

  const preparePrompts = (langs: string[]) => {
    const promptTemplates = new Map<string, DescriptionRow>()
    for (const lang of langs) {
      promptTemplates.set(lang, {
        prompt: `Provide a long description of '${getProductName(
          lang
        )}' in language: ${lang}`,
        aiSuggestion: '',
        originalDescription: productDescription?.[lang] ?? '',
        aiSuggestionSelected: false,
      })
    }
    setPrompts(promptTemplates)
  }

  const initialize = () => {
    setLanguages([])
    preparePrompts([])
  }

  const generateDescriptions = async () => {
    const promptsRequests = Array.from(prompts.entries())
      .map(([id, row]) => ({ id, prompt: row.prompt }))
      .map((prompt) => generateText(prompt))
    try {
      setAiExecutionInProgress(true)
      const generatedDescriptions: AiTextResponse[] =
        await Promise.all(promptsRequests)
      generatedDescriptions.forEach((generatedDescription) => {
        const prompt = prompts.get(generatedDescription.id)
        if (prompt) prompt.aiSuggestion = generatedDescription.result
      })
      setAiExecuted(true)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.showError(t('assistantBox.error.generateText'), t(message ?? ''))
    } finally {
      setAiExecutionInProgress(false)
    }
  }

  const applyAiSuggestions = () => {
    const description: Localized = { ...productDescription }
    Array.from(prompts.entries()).forEach(([lang, row]) => {
      description[lang] = row.aiSuggestionSelected
        ? row.aiSuggestion
        : row.originalDescription
    })
    onAccept(description)
    initialize()
  }

  const onHide = () => {
    onReject()
    initialize()
  }

  return (
    <Dialog
      className={styles.dialog}
      visible={visible}
      onHide={onHide}
      header={t(title)}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onHide} disabled={loading}>
            {t('assistantBox.buttons.cancel')}
          </SecondaryButton>
          <PrimaryButton
            className={buttonClassName}
            loading={loading}
            disabled={loading || !aiExecuted}
            onClick={applyAiSuggestions}
          >
            {t('assistantBox.buttons.done')}
          </PrimaryButton>
        </div>
      }
    >
      <div className={styles.content}>
        {aiExecutionInProgress && (
          <div className={styles.overlay}>
            <div className={styles.progress}>
              <ProgressSpinner />
            </div>
          </div>
        )}
        <InputField
          label={t('assistantBox.languages')}
          name="mixins.productCustomAttributes.brand"
          className={styles.languages}
          noInheritance
        >
          <Dropdown
            multiple
            display="chip"
            options={languageOptions}
            value={languages}
            optionLabel="label"
            optionValue="id"
            onChange={(event) => {
              const langs = Array.isArray(event.value)
                ? event.value.filter((v): v is string => typeof v === 'string')
                : []
              setLanguages(langs)
              preparePrompts(langs)
            }}
          />
        </InputField>
        <div>
          {languages.map((language) => (
            <AiAssistantBoxRow
              key={`ai-assistantbox-row-${language}`}
              language={language}
              row={prompts.get(language)}
            />
          ))}
        </div>
        <PrimaryButton
          className={buttonClassName}
          loading={loading}
          disabled={loading || languages.length < 1}
          onClick={generateDescriptions}
        >
          {t('assistantBox.buttons.generateDescriptions')}
        </PrimaryButton>
      </div>
    </Dialog>
  )
}

export default AssistantBox
