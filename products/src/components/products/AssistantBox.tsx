import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { useConfiguration } from '../../context/ConfigurationProvider'
import {
  InputTextarea,
  MultiSelect,
  ProgressSpinner,
  RadioButton,
} from 'primereact'
import InputField from '../shared/InputField'
import { useAiApi } from '../../api/ai'
import { Controller, useForm } from 'react-hook-form'
import { useToast } from '../../context/ToastProvider'
import './AssistantBox.scss'
import Localized from '../../models/Localized.ts'

interface AssistantBoxProps {
  productName: Localized
  productDescription: Localized
  visible: boolean
  onAccept: (description: Localized | undefined) => void
  onReject: () => void
  loading: boolean
  buttonClassName?: string
  title: string
}

interface AiAssistantBoxRowProps {
  language: string
  row?: DescriptionRow
}

interface DescriptionRow {
  prompt: string
  originalDescription: string
  aiSuggestion: string
  aiSuggestionSelected: boolean
}

const AiAssistantBoxRow = (props: AiAssistantBoxRowProps) => {
  const methods = useForm<DescriptionRow>()
  const { control, reset } = methods
  const { t } = useTranslation()

  useEffect(() => {
    reset(props.row)
  }, [props.row])

  const setValue = (
    field: DescriptionRow | undefined,
    propertyName: string,
    value: string | boolean
  ) => {
    if (field) {
      //@ts-ignore
      field[propertyName] = value
    }
  }

  return (
    <div className={'grid assistant-box-row'}>
      <div className={'col-4'}>
        <div className={'font-bold'}>{t('assistantBox.headers.prompt')}</div>
        <div key={props.language} className="p-inputgroup mt-2">
          <span className="card p-inputgroup-addon font-bold">
            {props.language?.toUpperCase()}
          </span>
          <Controller
            name="prompt"
            control={control}
            render={({ field }) => (
              <InputTextarea
                style={{ height: '60px', borderTopLeftRadius: '0' }}
                onChange={(val) => {
                  field.onChange(val)
                  setValue(props.row, 'prompt', val.target.value)
                }}
                value={field.value}
              ></InputTextarea>
            )}
          />
        </div>
      </div>
      <div className={'col-4'}>
        <Controller
          name="aiSuggestionSelected"
          control={control}
          render={({ field }) => (
            <RadioButton
              inputId={'originalDescription' + props.language}
              checked={!field.value}
              onChange={(e) => {
                field.onChange(!e.checked)
                setValue(props.row, 'aiSuggestionSelected', !e.checked)
              }}
            />
          )}
        />
        <label
          htmlFor={'originalDescription' + props.language}
          className={'ml-1 font-bold'}
        >
          {t('assistantBox.headers.originalDescription')}
        </label>
        <div key={props.language} className="p-inputgroup mt-1">
          <span className="card p-inputgroup-addon font-bold">
            {props.language?.toUpperCase()}
          </span>
          <InputTextarea
            style={{ height: '60px', borderTopLeftRadius: '0' }}
            value={props.row?.originalDescription}
            readOnly={true}
          ></InputTextarea>
        </div>
      </div>
      <div className={'col-4'}>
        <Controller
          name="aiSuggestionSelected"
          control={control}
          render={({ field }) => (
            <RadioButton
              inputId={'aiSuggestion' + props.language}
              checked={field.value}
              onChange={(e) => {
                field.onChange(e.checked)
                setValue(props.row, 'aiSuggestionSelected', e.checked)
              }}
            />
          )}
        />
        <label
          htmlFor={'aiSuggestion' + props.language}
          className={'ml-1 font-bold'}
        >
          {t('assistantBox.headers.aiSuggestion')}
        </label>
        <div key={props.language} className="p-inputgroup mt-1">
          <span className="card p-inputgroup-addon font-bold">
            {props.language?.toUpperCase()}
          </span>

          <Controller
            name="aiSuggestion"
            control={control}
            render={({ field }) => (
              <>
                <InputTextarea
                  style={{ height: '60px', borderTopLeftRadius: '0' }}
                  onChange={(val) => {
                    field.onChange(val)
                    setValue(props.row, 'aiSuggestion', field.value)
                  }}
                  value={props.row?.aiSuggestion}
                  readOnly={true}
                ></InputTextarea>
              </>
            )}
          />
        </div>
      </div>
    </div>
  )
}

const AssistantBox = (props: AssistantBoxProps) => {
  const { t } = useTranslation()
  const { configuration } = useConfiguration()
  const { generateText } = useAiApi()
  const [languages, setLanguages] = useState([] as string[])
  const [prompts, setPrompts] = useState({} as Map<string, DescriptionRow>)
  const [aiExecuted, setAiExecuted] = useState(false)
  const [aiExecutionInProgress, setAiExecutionInProgress] = useState(false)
  const toast = useToast()

  const initialize = () => {
    setLanguages([])
    preparePrompts([])
  }

  const generateDesciptions = async () => {
    const promptsRequests = Array.from(prompts.entries())
      .map((entry) => ({
        id: entry[0],
        prompt: entry[1].prompt,
      }))
      .map((prompt) => generateText(prompt))
    try {
      setAiExecutionInProgress(true)
      await Promise.all(promptsRequests).then((generateDesciptions) => {
        generateDesciptions.forEach((generateDescription: any) => {
          const prompt = prompts.get(generateDescription.id)
          if (prompt) prompt.aiSuggestion = generateDescription.result
        })
      })
      setAiExecuted(true)
    } catch (error: any) {
      toast.showError(
        t('assistantBox.error.generateText'),
        t(error.response.data.message)
      )
    } finally {
      setAiExecutionInProgress(false)
    }
  }

  const applyAiSuggestions = () => {
    Array.from(prompts.entries()).forEach((prompt) => {
      props.productDescription[prompt[0]] = prompt[1].aiSuggestionSelected
        ? prompt[1].aiSuggestion
        : prompt[1].originalDescription
    })
    props.onAccept(props.productDescription)
    initialize()
  }

  const preparePrompts = (langs: string[]) => {
    const promptTemplates = new Map<string, DescriptionRow>()
    for (const lang of langs) {
      promptTemplates.set(lang, {
        prompt: `Provide a long description of '${getProductName(
          lang
        )}' in language: ${lang}`,
        aiSuggestion: '',
        originalDescription:
          props.productDescription && props.productDescription[lang]
            ? props.productDescription[lang]
            : '',
        aiSuggestionSelected: false,
      })
    }
    setPrompts(promptTemplates)
  }

  const getProductName = (lang: string) => {
    return props.productName && props.productName[lang]
      ? props.productName[lang]
      : props.productName
        ? props.productName['en']
        : ''
  }

  const onHide = () => {
    props.onReject()
    initialize()
  }

  return (
    <Dialog
      style={{ height: '60vh', width: '70vw' }}
      visible={props.visible}
      onHide={onHide}
      header={t(props.title)}
      footer={
        <>
          <div className="footer">
            <Button
              className="mr-2 p-button-secondary"
              onClick={onHide}
              label={t('assistantBox.buttons.cancel')}
              disabled={props.loading}
            />
            <Button
              className={props.buttonClassName}
              loading={props.loading}
              disabled={props.loading || !aiExecuted}
              onClick={applyAiSuggestions}
              label={t('assistantBox.buttons.done')}
            />
          </div>
        </>
      }
    >
      {aiExecutionInProgress && (
        <div className="overlay">
          <div className="progress">
            <ProgressSpinner />
          </div>
        </div>
      )}
      <div className="grid">
        <div className={'mb-3 col-12'}>
          <InputField
            label={t('assistantBox.languages')}
            name="mixins.productCustomAttributes.brand"
            className={'mb-3 col-12'}
          >
            <MultiSelect
              options={configuration?.languages}
              value={languages}
              optionLabel="label"
              optionValue="id"
              showClear
              appendTo="self"
              onChange={(event) => {
                setLanguages(event.value ? event.value : [])
                preparePrompts(event.value ? event.value : [])
              }}
            />
          </InputField>
        </div>
      </div>
      <div>
        {languages &&
          languages.map((language) => {
            return (
              <AiAssistantBoxRow
                key={`ai-assistantbox-row-${language}`}
                language={language}
                row={prompts.get(language)}
              />
            )
          })}
      </div>
      <Button
        className={props.buttonClassName}
        loading={props.loading}
        disabled={props.loading || (languages && languages.length < 1)}
        onClick={generateDesciptions}
        label={t('assistantBox.buttons.generateDescriptions')}
      />
    </Dialog>
  )
}

AssistantBox.defaultProps = {
  title: 'assistantBox.title',
  loading: false,
  productDescription: {} as Localized,
}

export default AssistantBox
