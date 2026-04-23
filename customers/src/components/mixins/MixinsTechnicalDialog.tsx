import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Mixins.scss'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'primereact/dialog'
import axios from 'axios'
import { ProgressSpinner } from 'primereact/progressspinner'
import { diffJsons, SchemaDiffResult } from './helpers'
import { BsArrowRight, BsCopy, BsDot } from 'react-icons/bs'

interface Props {
  newerSchemaUrl?: string
  presentSchemaUrl?: string
  show: boolean
  onHide: () => void
}

const MixinsTechnicalDialog = (props: Props) => {
  const { newerSchemaUrl, presentSchemaUrl, show, onHide } = props
  const { t } = useTranslation()

  const [newerData, setNewerData] = useState<any>()
  const [presentData, setPresentData] = useState<any>()
  const [loading, setLoading] = useState(true)
  const [diffs, setDiffs] = useState<SchemaDiffResult>()

  useEffect(() => {
    if (!newerSchemaUrl || !presentSchemaUrl) return
    fetchSchemas()
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
      <div className="flex align-items-center gap-2" key={i}>
        <BsDot />
        <div className="mr-2">{i}</div>
        <strong>{t('mixins.labels.added').toLowerCase()}</strong>
      </div>
    ))
  }, [diffs])

  const toDeleteTemplate = useMemo(() => {
    const items = diffs?.toDelete ? Array.from(diffs.toDelete) : []
    return items.map((i) => (
      <div className="flex align-items-center gap-2" key={i}>
        <BsDot />
        <div className="mr-2">{i}</div>
        <strong>{t('mixins.labels.deleted').toLowerCase()}</strong>
      </div>
    ))
  }, [diffs])

  const toChangeTemplate = useMemo(() => {
    const entries = Object.entries(diffs?.toChange || {})
    return entries.map(([k, { from, to }]) => (
      <div className="flex align-items-center gap-2" key={k}>
        <BsDot />
        <div className="mr-2">{k}</div>
        <strong className="flex align-items-center gap-2">
          {from} <BsArrowRight size={16} /> {to}
        </strong>
      </div>
    ))
  }, [diffs])

  const schemaTemplate = useCallback(
    (data: any, url: string, title: string) => {
      return (
        <div className="schema-template">
          <div className="mb-3">
            <div className="text-lg mb-1">{title}</div>
            <div className="flex align-items-center gap-3">
              <div className="url-text">{url}</div>
              <BsCopy
                size={14}
                className="cursor-pointer flex-shrink-0"
                onClick={() => navigator.clipboard.writeText(url || '')}
              />
            </div>
          </div>
          <pre className="schema-pre p-3">
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
      style={{ width: '80vw', maxWidth: '1200px' }}
      header={t('mixins.titles.technicalView')}
      className="mixins-technical-wrapper"
    >
      {loading ? (
        <ProgressSpinner />
      ) : (
        <>
          <div className="mb-5">
            <div className="mb-1 font-bold">
              {t('mixins.labels.difference')}:
            </div>
            {toAddTemplate}
            {toDeleteTemplate}
            {toChangeTemplate}
          </div>
          <div className="flex gap-6">
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
