import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, ProgressSpinner } from '@emporix/component-library'
import axios from 'axios'
import { diffJsons, SchemaDiffResult } from './helpers'
import { BsArrowRight, BsCopy, BsDot } from 'react-icons/bs'
import styles from './Mixins.module.scss'

type SchemaJson = { properties?: Record<string, unknown> } | undefined

interface Props {
  readonly newerSchemaUrl?: string
  readonly presentSchemaUrl?: string
  readonly show: boolean
  readonly onHide: () => void
}

const MixinsTechnicalDialog = (props: Props) => {
  const { newerSchemaUrl, presentSchemaUrl, show, onHide } = props
  const { t } = useTranslation()

  const [newerData, setNewerData] = useState<SchemaJson>()
  const [presentData, setPresentData] = useState<SchemaJson>()
  const [loading, setLoading] = useState(true)
  const [diffs, setDiffs] = useState<SchemaDiffResult>()

  useEffect(() => {
    if (!newerSchemaUrl || !presentSchemaUrl) return
    fetchSchemas()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- MD parity
  }, [newerSchemaUrl, presentSchemaUrl])

  const fetchSchemas = async () => {
    if (!newerSchemaUrl || !presentSchemaUrl) return null
    setLoading(true)
    try {
      const [newerRes, presentRes] = await Promise.all([
        axios.get(newerSchemaUrl, {
          headers: { Accept: 'application/json' },
        }),
        axios.get(presentSchemaUrl, {
          headers: { Accept: 'application/json' },
        }),
      ])
      setNewerData(newerRes.data)
      setPresentData(presentRes.data)
      const diffs = diffJsons(
        presentRes.data?.properties,
        newerRes.data?.properties
      )
      setDiffs(diffs)
    } catch (error) {
      console.error('Error fetching schema:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const toAddTemplate = useMemo(() => {
    const items = diffs?.toAdd ? Array.from(diffs.toAdd) : []
    return items.map((i) => (
      <div className={styles.diffRow} key={i}>
        <BsDot />
        <div className={styles.diffKey}>{i}</div>
        <strong>{t('mixins.labels.added').toLowerCase()}</strong>
      </div>
    ))
  }, [diffs, t])

  const toDeleteTemplate = useMemo(() => {
    const items = diffs?.toDelete ? Array.from(diffs.toDelete) : []
    return items.map((i) => (
      <div className={styles.diffRow} key={i}>
        <BsDot />
        <div className={styles.diffKey}>{i}</div>
        <strong>{t('mixins.labels.deleted').toLowerCase()}</strong>
      </div>
    ))
  }, [diffs, t])

  const toChangeTemplate = useMemo(() => {
    const entries = Object.entries(diffs?.toChange || {})
    return entries.map(([k, { from, to }]) => (
      <div className={styles.diffRow} key={k}>
        <BsDot />
        <div className={styles.diffKey}>{k}</div>
        <strong className={styles.diffChange}>
          {from} <BsArrowRight size={16} /> {to}
        </strong>
      </div>
    ))
  }, [diffs])

  const schemaTemplate = useCallback(
    (data: SchemaJson, url: string, title: string) => {
      return (
        <div className={styles.schemaTemplate}>
          <div className={styles.schemaHeader}>
            <div className={styles.schemaTitle}>{title}</div>
            <div className={styles.schemaUrlRow}>
              <div className={styles.urlText}>{url}</div>
              <BsCopy
                size={14}
                className={styles.copyIcon}
                onClick={() => navigator.clipboard.writeText(url || '')}
              />
            </div>
          </div>
          <pre className={styles.schemaPre}>
            {JSON.stringify(data?.properties, null, 2)}
          </pre>
        </div>
      )
    },
    []
  )

  return (
    <Dialog
      onHide={onHide}
      visible={show}
      header={t('mixins.titles.technicalView')}
      // Inline width: MD's global `.p-dialog` width beats a module class.
      style={{ width: '80vw', maxWidth: '1200px' }}
    >
      {loading ? (
        <ProgressSpinner />
      ) : (
        <>
          <div className={styles.diffSection}>
            <div className={styles.diffTitle}>
              {t('mixins.labels.difference')}:
            </div>
            {toAddTemplate}
            {toDeleteTemplate}
            {toChangeTemplate}
          </div>
          <div className={styles.schemas}>
            {schemaTemplate(
              presentData,
              presentSchemaUrl || '',
              t('mixins.labels.presentSchema')
            )}
            {schemaTemplate(
              newerData,
              newerSchemaUrl || '',
              t('mixins.labels.newerSchema')
            )}
          </div>
        </>
      )}
    </Dialog>
  )
}

export default MixinsTechnicalDialog
