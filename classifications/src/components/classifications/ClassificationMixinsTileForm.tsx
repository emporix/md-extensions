import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'
import {
  DataTable,
  Dropdown,
  FieldLabel,
  InputSwitch,
  InputText,
  PrimaryButton,
  RadioButton,
  SecondaryButton,
  SectionBox,
} from '@emporix/component-library'
import FormGridRow from '../shared/FormGridRow'
import InputField from '../shared/InputField'
import { useClassificationSchemasData } from '../../context/ClassificationSchemas.provider'
import { useClassificationVersionData } from '../../context/ClassificationVersion.provider'
import { useSchemaApi } from '../../hooks/api/schema'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import useClassificationMixinsColumns from '../../hooks/useClassificationMixinsColumns'
import { ClassificationFormFields } from '../../helpers/classificationForm.helpers'
import {
  diffSchemaAttributes,
  findSchemaByUrl,
  getSchemaIdAndVersion,
  isSchemaUrlValid,
  mapOwnSchemaToAttributes,
  mapToTableAttribute,
  TableAttribute,
} from '../../helpers/classificationSchema.helpers'
import { ClassificationMixin } from '../../models/Mixins.model'
import { Schema, SchemaAttribute } from '../../models/Schema.model'
import columnStyles from '../shared/FormColumns.module.scss'
import styles from './ClassificationMixins.module.scss'

const MIXIN_NAME_CHARCLASS = 'a-zA-Z0-9_'
const MIXIN_NAME_REGEX = new RegExp(`^[${MIXIN_NAME_CHARCLASS}]+$`)

const sanitizeMixinName = (value: string) =>
  value.replace(new RegExp(`[^${MIXIN_NAME_CHARCLASS}]`, 'g'), '')

enum SchemaSource {
  EMPORIX = 'emporix',
  OWN = 'own',
}

type ClassificationMixinsTileFormProps = {
  readonly tileIdx: number
  readonly tileId: string
  readonly canManage: boolean
  readonly className?: string
}

/** Ported from management-dashboard `modules/classifications/components/ClassificationMixinsTileForm`. */
const ClassificationMixinsTileForm = ({
  className = '',
  tileIdx,
  tileId,
  canManage,
}: ClassificationMixinsTileFormProps) => {
  const { t } = useTranslation()
  const { schemas } = useClassificationSchemasData()
  const { getUiLangValue } = useLocalizedValue()
  const { columns } = useClassificationMixinsColumns()
  const { getSchema } = useSchemaApi()
  const { addSchemaVersion, removeSchemaVersion } =
    useClassificationVersionData()
  const { control, setValue, watch, getValues } =
    useFormContext<ClassificationFormFields>()

  const nameField = `ownClassificationMixins.${tileIdx}.name` as const
  const urlField = `ownClassificationMixins.${tileIdx}.schemaUrl` as const
  const testId = `classification-schema-${tileIdx}`

  const [pickedSchema, setPickedSchema] = useState<Schema>()
  const [oldSchema, setOldSchema] = useState<Schema>()
  const [schemaSource, setSchemaSource] = useState(SchemaSource.EMPORIX)
  const [lastOwn, setLastOwn] = useState<Partial<ClassificationMixin>>()
  const [lastEmporix, setLastEmporix] = useState<Partial<ClassificationMixin>>()
  const currentUrl = watch(urlField)
  const [attributes, setAttributes] = useState<Partial<TableAttribute>[]>([])
  const [showOldAttributes, setShowOldAttributes] = useState(false)

  const setTableAttributes = (schemaAttributes: SchemaAttribute[]) => {
    setAttributes(schemaAttributes.map((a) => mapToTableAttribute(a)))
  }

  useEffect(() => {
    // The abort flag settles the initial race between the own schema (URL
    // known at once) and the Emporix schemas (loaded later), and between two
    // URLs typed one after the other.
    const abortController = new AbortController()
    const { signal } = abortController

    const handleEmptyUrl = () => {
      setPickedSchema(undefined)
      setOldSchema(undefined)
      setAttributes([])
      removeSchemaVersion(tileId)
    }

    const handleEmporixSchemaWithDifferentVersion = async (
      emporixSchema: Schema
    ) => {
      if (showOldAttributes) {
        setTableAttributes(oldSchema?.attributes || [])
      } else {
        const { id, version } = getSchemaIdAndVersion(currentUrl)
        if (!id || !version) return
        try {
          const fetchedOldSchema = oldSchema || (await getSchema(id, version))
          if (signal.aborted) return
          setOldSchema(fetchedOldSchema)
          setAttributes(
            diffSchemaAttributes(
              emporixSchema.attributes || [],
              fetchedOldSchema.attributes || []
            )
          )
          const newVersion = emporixSchema.metadata?.version
          if (newVersion) addSchemaVersion(tileId, newVersion)
        } catch (e) {
          if (signal.aborted) return
          console.error(e)
          setTableAttributes(emporixSchema.attributes || [])
        }
      }
      setSchemaSource(SchemaSource.EMPORIX)
      setPickedSchema(emporixSchema)
    }

    const handleEmporixSchema = (emporixSchema: Schema) => {
      setSchemaSource(SchemaSource.EMPORIX)
      setPickedSchema(emporixSchema)
      removeSchemaVersion(tileId)
      setTableAttributes(emporixSchema.attributes || [])
    }

    const handleOwnSchema = async () => {
      setSchemaSource(SchemaSource.OWN)
      setPickedSchema(undefined)
      removeSchemaVersion(tileId)
      if (!isSchemaUrlValid(currentUrl)) {
        setAttributes([])
        return
      }
      try {
        const schema = await fetch(currentUrl, { signal }).then((res) =>
          res.json()
        )
        if (signal.aborted) return
        setAttributes(mapOwnSchemaToAttributes(schema))
      } catch (e) {
        if (signal.aborted) return
        console.error(e)
        setAttributes([])
      }
    }

    if (!currentUrl) {
      handleEmptyUrl()
    } else {
      const { emporixSchema, versionMatch } = findSchemaByUrl(
        currentUrl,
        schemas
      )
      if (!emporixSchema) {
        void handleOwnSchema()
      } else if (versionMatch) {
        handleEmporixSchema(emporixSchema)
      } else {
        void handleEmporixSchemaWithDifferentVersion(emporixSchema)
      }
    }
    return () => {
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas, currentUrl, showOldAttributes])

  // A removed tile must not keep the alert on the tab.
  useEffect(
    () => () => removeSchemaVersion(tileId),
    [removeSchemaVersion, tileId]
  )

  const setTileValue = (
    field: typeof nameField | typeof urlField,
    value: string
  ) => setValue(field, value, { shouldDirty: true, shouldValidate: true })

  const currentValues = () => ({
    name: getValues(nameField),
    schemaUrl: getValues(urlField),
  })

  const handleOwnSchemaSelect = () => {
    setLastEmporix(currentValues())
    setSchemaSource(SchemaSource.OWN)
    setTileValue(urlField, lastOwn?.schemaUrl || '')
    setTileValue(nameField, lastOwn?.name || '')
  }

  const handleEmporixSchemaSelect = () => {
    setLastOwn(currentValues())
    setSchemaSource(SchemaSource.EMPORIX)
    setTileValue(urlField, lastEmporix?.schemaUrl || '')
    setTileValue(nameField, lastEmporix?.name || '')
  }

  const handleEmporixSchemaChange = (schemaId: unknown) => {
    const schema = schemas?.find((s) => s.id === schemaId)
    if (!schema) return
    setPickedSchema(schema)
    setOldSchema(undefined)
    setTileValue(nameField, schema.id)
    setTileValue(urlField, schema.metadata?.url || '')
  }

  const applyNewVersion = () => {
    setOldSchema(undefined)
    removeSchemaVersion(tileId)
    setTileValue(urlField, pickedSchema?.metadata?.url ?? '')
  }

  const renderVersionButton = (
    isActive: boolean,
    label: string,
    onClick: () => void,
    buttonTestId: string
  ) =>
    isActive ? (
      <PrimaryButton onClick={onClick} data-testid={buttonTestId}>
        {label}
      </PrimaryButton>
    ) : (
      <SecondaryButton onClick={onClick} data-testid={buttonTestId}>
        {label}
      </SecondaryButton>
    )

  return (
    <SectionBox className={className}>
      <FormGridRow>
        <div className={styles.typeRow}>
          <InputField
            label={t('classifications.forms.classification.fields.schemaType')}
          >
            <div className={styles.radio}>
              <RadioButton
                inputId={`emporixSchema-${tileId}`}
                name={`schemaType-${tileId}`}
                value={SchemaSource.EMPORIX}
                checked={schemaSource === SchemaSource.EMPORIX}
                disabled={!canManage}
                onChange={handleEmporixSchemaSelect}
                label={t(
                  'classifications.forms.classification.labels.emporixSchema'
                )}
                data-testid={`${testId}-emporix`}
              />
            </div>
            <div className={styles.radio}>
              <RadioButton
                inputId={`ownSchema-${tileId}`}
                name={`schemaType-${tileId}`}
                value={SchemaSource.OWN}
                checked={schemaSource === SchemaSource.OWN}
                disabled={!canManage}
                onChange={handleOwnSchemaSelect}
                label={t(
                  'classifications.forms.classification.labels.ownSchema'
                )}
                data-testid={`${testId}-own`}
              />
            </div>
          </InputField>
          <div className={styles.requiredRow}>
            <Controller
              name={`ownClassificationMixins.${tileIdx}.required`}
              control={control}
              render={({ field }) => (
                <InputSwitch
                  className={styles.requiredSwitch}
                  inputId={`required-${tileId}`}
                  checked={!!field.value}
                  disabled={!canManage}
                  onChange={(event) => field.onChange(event.value)}
                  data-testid={`${testId}-required`}
                />
              )}
            />
            <FieldLabel
              htmlFor={`required-${tileId}`}
              tooltip={t('classifications.tooltips.required')}
            >
              {t('classifications.forms.classification.fields.required')}
            </FieldLabel>
          </div>
        </div>
      </FormGridRow>
      {oldSchema && (
        <FormGridRow>
          <div className={styles.versionRow}>
            {renderVersionButton(
              showOldAttributes,
              t('mixins.buttons.keepOld'),
              () => setShowOldAttributes(true),
              `${testId}-keep-old`
            )}
            {renderVersionButton(
              !showOldAttributes,
              t('mixins.buttons.newVersion'),
              () => setShowOldAttributes(false),
              `${testId}-new-version`
            )}
            <SecondaryButton
              disabled={!canManage}
              onClick={applyNewVersion}
              data-testid={`${testId}-apply-version`}
            >
              {t('classifications.labels.applyVersion', {
                version: pickedSchema?.metadata?.version,
              })}
            </SecondaryButton>
          </div>
        </FormGridRow>
      )}
      <FormGridRow className={columnStyles.stackRow}>
        {schemaSource === SchemaSource.EMPORIX && (
          <div className={columnStyles.col4Stack}>
            <Dropdown
              inputId={`schema-${tileId}`}
              label={t('classifications.forms.classification.fields.schema')}
              disabled={!canManage}
              value={pickedSchema?.id}
              options={(schemas ?? []).map((s) => ({
                label: getUiLangValue(s.name),
                value: s.id,
              }))}
              onChange={(event) => handleEmporixSchemaChange(event.value)}
              data-testid={`${testId}-schema`}
            />
          </div>
        )}
        <div className={columnStyles.col4Stack}>
          <Controller
            name={nameField}
            control={control}
            rules={{
              required: true,
              pattern: { value: MIXIN_NAME_REGEX, message: '' },
            }}
            render={({ field, fieldState }) => (
              <InputText
                inputId={`key-${tileId}`}
                label={t('classifications.forms.classification.fields.key')}
                tooltip={t('classifications.tooltips.key')}
                required
                readOnly={!canManage}
                value={field.value}
                onChange={(event) =>
                  field.onChange(sanitizeMixinName(event.target.value))
                }
                error={
                  fieldState.error &&
                  t('classifications.forms.classification.errors.invalidName')
                }
                data-testid={`${testId}-key`}
              />
            )}
          />
        </div>
        <div className={columnStyles.col4Stack}>
          <Controller
            name={urlField}
            control={control}
            rules={{ required: true, validate: (v) => isSchemaUrlValid(v) }}
            render={({ field, fieldState }) => (
              <InputText
                inputId={`schemaUrl-${tileId}`}
                label={t(
                  'classifications.forms.classification.fields.schemaUrl'
                )}
                tooltip={t('classifications.tooltips.schemaUrl')}
                required
                readOnly={!canManage}
                value={field.value}
                onChange={(event) => {
                  if (schemaSource === SchemaSource.EMPORIX) return
                  field.onChange(event.target.value)
                }}
                error={
                  fieldState.error && t('classifications.tooltips.schemaUrl')
                }
                data-testid={`${testId}-url`}
              />
            )}
          />
        </div>
      </FormGridRow>
      <FormGridRow>
        <div className={`${columnStyles.col12} ${columnStyles.scrollX}`}>
          <DataTable
            showFilter={false}
            paginator={false}
            value={attributes}
            columns={columns}
            emptyMessage={t('classifications.tables.mixinAttributes.emptyText')}
            data-testid={`${testId}-attributes`}
          />
        </div>
      </FormGridRow>
    </SectionBox>
  )
}

export default ClassificationMixinsTileForm
