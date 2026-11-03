import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MixinsFormData, MixinsFormMetadata, mixinStorageKey } from './helpers'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { Mixins } from '../../models/Mixins.model'
import MixinsForm, { MixinsFormHandle } from './MixinsForm'
import { PrimaryButton, SecondaryButton } from '@emporix/component-library'
import { useTranslation } from 'react-i18next'
import MixinsVersionButtons from './MixinsVersionButtons'
import { useSites } from '../../context/SitesProvider'
import { useToast } from '@emporix/component-library'
import MixinsSiteContextPanel, {
  SiteContextOption,
} from './MixinsSiteContextPanel'
import {
  buildSiteAwareSavePatch,
  ensureInitialBindingPatch,
  isContextDirty,
  isDraftDirty,
  listSiteCodesWithOverlay,
  mergeLiveContext,
  migrateSiteAwareDraftsForSchema,
  needsInitialSiteAwareBinding,
  normalizeSiteOverlay,
  seedSiteAwareDrafts,
  SiteAwareDraftBag,
  stripUndefinedLeaves,
} from './siteAwareMixin.helpers'
import {
  hasMissingRequiredMixinValues,
  hasMissingRequiredSiteOverlayValues,
  isSiteOverlayKey,
  siteCodeFromStorageKey,
} from './helpers'
import { deepClone } from '../../helpers/utils'
import styles from './Mixins.module.scss'

interface Props {
  forms: MixinsFormData[]
  mixins: Mixins
  /** Schema ids from entity metadata.mixins — skips __ overlay collisions. */
  knownSchemaIds?: readonly string[]
  onSave: (data: Mixins, metadata: MixinsFormMetadata) => Promise<void> | void
  managerPermissions?: boolean
  presentSchemaUrl?: string
  newerSchemaUrl?: string
}

const DEFAULT_SITE_CODE = ''

const MixinsFormBox = (props: Props) => {
  const {
    forms,
    mixins,
    knownSchemaIds,
    onSave,
    presentSchemaUrl,
    newerSchemaUrl,
    managerPermissions = true,
  } = props
  const { t } = useTranslation()
  const { showError } = useToast()
  const { getUiLangValue } = useLocalizedValue()
  const { sites } = useSites()
  const [activeFormIndex, setActiveFormIndex] = useState(forms.length - 1)
  const [showDialog, setShowDialog] = useState(false)
  const activeForm = forms[activeFormIndex] ?? forms[0]
  const schemaId = activeForm?.metadata.key ?? ''
  const isSiteAware = activeForm?.siteAware === true
  const knownSchemaIdSet = useMemo(
    () => (knownSchemaIds?.length ? new Set(knownSchemaIds) : undefined),
    [knownSchemaIds]
  )

  const [selectedSite, setSelectedSite] = useState<string>(DEFAULT_SITE_CODE)
  const [draftBag, setDraftBag] = useState<SiteAwareDraftBag>(() =>
    seedSiteAwareDrafts(schemaId, mixins, knownSchemaIdSet)
  )
  // Received/saved state — markers and Save compare drafts (+ live) against this.
  const [baselineBag, setBaselineBag] = useState<SiteAwareDraftBag>(() =>
    seedSiteAwareDrafts(schemaId, mixins, knownSchemaIdSet)
  )
  // Per schema-version draft bags so switching versions does not commit one
  // version's prepareData-stripped payload over another's stored values.
  const draftsByVersionRef = useRef<
    Record<number, { bag: SiteAwareDraftBag; preparedKeys: string[] }>
  >({})
  // Contexts the user has edited/committed — migrate must not treat them as
  // untouched just because a re-entered value equals the API baseline again.
  const preparedKeysRef = useRef<Set<string>>(new Set())
  // In-progress form payload for the selected context (kept out of draftBag so
  // updating it does not remount/reset MixinsForm via the mixins prop).
  const [selectedLivePayload, setSelectedLivePayload] = useState<Mixins | null>(
    null
  )
  const formRef = useRef<MixinsFormHandle>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formEpoch, setFormEpoch] = useState(0)
  // Schemas attached this session before parent knownSchemaIds refreshes after save.
  const [sessionBoundSchemaIds, setSessionBoundSchemaIds] = useState<string[]>(
    []
  )

  useEffect(() => {
    setActiveFormIndex(forms.length - 1)
    draftsByVersionRef.current = {}
  }, [forms])

  useEffect(() => {
    if (!isSiteAware || !schemaId) {
      return
    }
    const seeded = seedSiteAwareDrafts(schemaId, mixins, knownSchemaIdSet)
    setBaselineBag(deepClone(seeded))
    // Strip legacy toChange/toDelete values from the working bag once; baseline
    // stays as received so dirty tracking still sees migration work to save.
    // Prefer the newest matching form (same as initial activeFormIndex).
    const matchingForms = forms.filter((form) => form.metadata.key === schemaId)
    const schemaForm =
      [...matchingForms].reverse().find((form) => form.siteAware) ??
      matchingForms[matchingForms.length - 1] ??
      forms[forms.length - 1]
    setDraftBag(
      migrateSiteAwareDraftsForSchema(
        schemaId,
        seeded,
        seeded,
        schemaForm?.items || []
      )
    )
    draftsByVersionRef.current = {}
    preparedKeysRef.current = new Set()
    setSelectedLivePayload(null)
    setSelectedSite(DEFAULT_SITE_CODE)
    setSessionBoundSchemaIds([])
    // Intentionally omit isSiteAware: version switches can flip that flag without
    // new entity data; reseeding would discard drafts committed by switchSchemaVersion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixins, schemaId, knownSchemaIdSet])

  const effectiveKnownSchemaIds = useMemo(() => {
    const ids = new Set(knownSchemaIds ?? [])
    sessionBoundSchemaIds.forEach((id) => ids.add(id))
    return ids
  }, [knownSchemaIds, sessionBoundSchemaIds])

  const siteLabel = useCallback(
    (siteCode: string): string => {
      if (!siteCode) {
        return t('mixins.labels.defaultSite')
      }
      const fromTenant = (sites ?? []).find((site) => site.code === siteCode)
      if (fromTenant) {
        return fromTenant.name || siteCode
      }
      return t('mixins.labels.orphanSite', { code: siteCode })
    },
    [sites, t]
  )

  const normalizePayloadForContext = useCallback(
    (payload: Mixins, siteCode: string): Mixins => {
      return siteCode
        ? normalizeSiteOverlay(payload)
        : stripUndefinedLeaves(payload)
    },
    []
  )

  const effectiveBag = useMemo(() => {
    if (!schemaId) {
      return draftBag
    }
    const key = mixinStorageKey(schemaId, selectedSite || undefined)
    return mergeLiveContext(draftBag, key, selectedLivePayload)
  }, [draftBag, schemaId, selectedSite, selectedLivePayload])

  const commitCurrentContext = useCallback((): SiteAwareDraftBag => {
    if (!schemaId) {
      return draftBag
    }
    const key = mixinStorageKey(schemaId, selectedSite || undefined)
    const flushed = formRef.current?.flush()
    const raw = flushed ?? selectedLivePayload
    if (raw == null) {
      return draftBag
    }
    const value = normalizePayloadForContext(raw, selectedSite)
    const next = mergeLiveContext(draftBag, key, value)
    preparedKeysRef.current.add(key)
    setDraftBag(next)
    return next
  }, [
    draftBag,
    normalizePayloadForContext,
    schemaId,
    selectedLivePayload,
    selectedSite,
  ])

  const handlePayloadChange = useCallback(
    (payload: Mixins) => {
      const key = mixinStorageKey(schemaId, selectedSite || undefined)
      preparedKeysRef.current.add(key)
      setSelectedLivePayload(normalizePayloadForContext(payload, selectedSite))
    },
    [normalizePayloadForContext, schemaId, selectedSite]
  )

  const selectSite = (code: string) => {
    if (code === selectedSite || !schemaId || isSaving) {
      return
    }
    commitCurrentContext()
    setSelectedLivePayload(null)
    setSelectedSite(code)
  }

  const siteOptions: SiteContextOption[] = useMemo(() => {
    if (!isSiteAware || !schemaId) {
      return []
    }
    const overlaySites = new Set(
      listSiteCodesWithOverlay(schemaId, effectiveBag)
    )
    const tenantCodes = new Set(
      (sites ?? []).map((site) => site.code as string)
    )
    const defaultKey = mixinStorageKey(schemaId)
    const tenantOptions: SiteContextOption[] = (sites ?? []).map((site) => {
      const code = site.code as string
      const key = mixinStorageKey(schemaId, code)
      return {
        code,
        label: site.name || code,
        hasOverlay: overlaySites.has(code),
        isDirty: isContextDirty(key, effectiveBag, baselineBag),
      }
    })
    // Overlays for sites removed from the tenant must stay selectable so users
    // can clear them (and so schema-version validation can navigate there).
    const orphanOptions: SiteContextOption[] = [...overlaySites]
      .filter((code) => !tenantCodes.has(code))
      .map((code) => {
        const key = mixinStorageKey(schemaId, code)
        return {
          code,
          label: t('mixins.labels.orphanSite', { code }),
          hasOverlay: true,
          isDirty: isContextDirty(key, effectiveBag, baselineBag),
        }
      })
    return [
      {
        code: DEFAULT_SITE_CODE,
        label: t('mixins.labels.defaultSite'),
        isDefault: true,
        isDirty: isContextDirty(defaultKey, effectiveBag, baselineBag),
      },
      ...tenantOptions,
      ...orphanOptions,
    ]
  }, [baselineBag, effectiveBag, isSiteAware, schemaId, sites, t])

  const isSchemaVersionDirty =
    isSiteAware &&
    !!presentSchemaUrl &&
    !!activeForm?.metadata.url &&
    activeForm.metadata.url !== presentSchemaUrl

  const needsInitialBinding =
    isSiteAware &&
    needsInitialSiteAwareBinding(schemaId, effectiveKnownSchemaIds)

  const handleDiscardAll = () => {
    setDraftBag(deepClone(baselineBag))
    draftsByVersionRef.current = {}
    preparedKeysRef.current = new Set()
    setSelectedLivePayload(null)
    if (isSchemaVersionDirty && forms.length > 1) {
      setActiveFormIndex(0)
    }
    setFormEpoch((epoch) => epoch + 1)
  }

  const handleSaveAll = async () => {
    if (!activeForm || !schemaId) {
      return
    }
    setIsSaving(true)
    try {
      const currentValid = (await formRef.current?.validate()) ?? true
      if (!currentValid) {
        if (selectedSite) {
          showError(
            t('mixins.messages.siteRequiredMissingTitle'),
            t('mixins.messages.siteRequiredMissing', {
              site: siteLabel(selectedSite),
            })
          )
        } else {
          showError(
            t('mixins.messages.defaultRequiredMissingTitle'),
            t('mixins.messages.defaultRequiredMissing')
          )
        }
        return
      }
      const committed = commitCurrentContext()
      const nextDrafts = migrateSiteAwareDraftsForSchema(
        schemaId,
        committed,
        baselineBag,
        activeForm.items || [],
        preparedKeysRef.current
      )
      setDraftBag(nextDrafts)
      const formItems = activeForm.items || []
      const defaultDraft = nextDrafts[schemaId]
      if (hasMissingRequiredMixinValues(defaultDraft, formItems)) {
        setSelectedLivePayload(null)
        setSelectedSite(DEFAULT_SITE_CODE)
        setFormEpoch((epoch) => epoch + 1)
        showError(
          t('mixins.messages.defaultRequiredMissingTitle'),
          t('mixins.messages.defaultRequiredMissing')
        )
        return
      }
      const invalidSiteKey = Object.keys(nextDrafts).find((key) => {
        if (!isSiteOverlayKey(schemaId, key)) {
          return false
        }
        // Schema-version saves must validate every stored overlay (replacement
        // arrays cannot inherit newly required children). Otherwise only dirty ones.
        if (
          !isSchemaVersionDirty &&
          !isContextDirty(key, nextDrafts, baselineBag)
        ) {
          return false
        }
        return hasMissingRequiredSiteOverlayValues(nextDrafts[key], formItems)
      })
      if (invalidSiteKey) {
        const siteCode =
          siteCodeFromStorageKey(schemaId, invalidSiteKey) ?? DEFAULT_SITE_CODE
        setSelectedLivePayload(null)
        setSelectedSite(siteCode)
        setFormEpoch((epoch) => epoch + 1)
        showError(
          t('mixins.messages.siteRequiredMissingTitle'),
          t('mixins.messages.siteRequiredMissing', {
            site: siteLabel(siteCode),
          })
        )
        return
      }
      const patch = ensureInitialBindingPatch(
        schemaId,
        buildSiteAwareSavePatch(schemaId, nextDrafts, baselineBag),
        needsInitialBinding
      )
      const hasPayloadChanges = Object.keys(patch).length > 0
      if (!hasPayloadChanges && !isSchemaVersionDirty && !needsInitialBinding) {
        setSelectedLivePayload(null)
        return
      }
      await onSave(patch, {
        ...activeForm.metadata,
        siteCode: undefined,
        siteAwareBatch: true,
      })
      // Mark bound immediately so a second Save cannot inject {} over the
      // persisted default before parent knownSchemaIds refreshes.
      if (needsInitialBinding) {
        setSessionBoundSchemaIds((prev) =>
          prev.includes(schemaId) ? prev : [...prev, schemaId]
        )
      }
      const saved = deepClone(nextDrafts)
      Object.entries(patch).forEach(([key, value]) => {
        if (value == null) {
          delete saved[key]
        }
      })
      if (!saved[schemaId]) {
        saved[schemaId] = {}
      }
      setBaselineBag(deepClone(saved))
      setDraftBag(deepClone(saved))
      draftsByVersionRef.current = {}
      preparedKeysRef.current = new Set()
      setSelectedLivePayload(null)
      setFormEpoch((epoch) => epoch + 1)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const bagDirty =
    isSiteAware && isDraftDirty(schemaId, effectiveBag, baselineBag)
  const canSave = bagDirty || isSchemaVersionDirty || needsInitialBinding

  const switchSchemaVersion = (index: number) => {
    if (index === activeFormIndex) {
      return
    }
    const leavingSiteAware = forms[activeFormIndex]?.siteAware === true
    const enteringSiteAware = forms[index]?.siteAware === true
    // Flush only when leaving a site-aware form; restore whenever entering one so
    // a non-site-aware → site-aware round-trip still recovers the saved draft bag.
    if (leavingSiteAware) {
      const committed = commitCurrentContext()
      draftsByVersionRef.current = {
        ...draftsByVersionRef.current,
        [activeFormIndex]: {
          bag: committed,
          preparedKeys: Array.from(preparedKeysRef.current),
        },
      }
    }
    if (enteringSiteAware) {
      const entering = forms[index]
      const stored = draftsByVersionRef.current[index]
      const bag = deepClone(stored?.bag ?? baselineBag)
      preparedKeysRef.current = new Set(stored?.preparedKeys ?? [])
      setDraftBag(
        migrateSiteAwareDraftsForSchema(
          entering?.metadata.key ?? schemaId,
          bag,
          baselineBag,
          entering?.items || [],
          preparedKeysRef.current
        )
      )
      setSelectedLivePayload(null)
    }
    setActiveFormIndex(index)
  }

  const versionButtons =
    forms.length > 1 ? (
      <MixinsVersionButtons
        activeFormIndex={activeFormIndex}
        onSelect={switchSchemaVersion}
        showTechnical={showDialog}
        onShowTechnical={() => setShowDialog(true)}
        onHideTechnical={() => setShowDialog(false)}
        newerSchemaUrl={newerSchemaUrl}
        presentSchemaUrl={presentSchemaUrl}
        disabled={isSaving}
      />
    ) : null

  if (!isSiteAware) {
    return (
      <>
        {versionButtons}
        {forms.map((f, index) => (
          <div key={f.id + index}>
            {index === activeFormIndex && (
              <MixinsForm
                name={getUiLangValue(f.name)}
                items={f.items}
                mixins={mixins}
                metadata={f.metadata}
                newerMetadata={f.newerMetadata}
                onSave={onSave}
                managerPermissions={managerPermissions}
              ></MixinsForm>
            )}
          </div>
        ))}
      </>
    )
  }

  const inheritedValues =
    (draftBag[schemaId] as Mixins | undefined) ?? ({} as Mixins)

  const batchActions = (
    <div className={styles.actions}>
      <SecondaryButton
        onClick={handleDiscardAll}
        disabled={!canSave || !managerPermissions || isSaving}
      >
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        onClick={handleSaveAll}
        disabled={!canSave || !managerPermissions || isSaving}
        loading={isSaving}
      >
        {t('global.save')}
      </PrimaryButton>
    </div>
  )

  return (
    <>
      {versionButtons}
      {forms.map((f, index) => (
        <div key={f.id + index}>
          {index === activeFormIndex && (
            <MixinsForm
              key={`${f.id}-${selectedSite}-${formEpoch}`}
              ref={formRef}
              name={getUiLangValue(f.name)}
              items={f.items}
              mixins={draftBag}
              metadata={{
                ...f.metadata,
                siteCode: selectedSite || undefined,
              }}
              newerMetadata={f.newerMetadata}
              onSave={onSave}
              managerPermissions={managerPermissions}
              readOnly={isSaving}
              inheritedValues={selectedSite ? inheritedValues : undefined}
              headerActions={batchActions}
              onPayloadChange={handlePayloadChange}
              sidePanel={
                <MixinsSiteContextPanel
                  options={siteOptions}
                  selectedCode={selectedSite}
                  onSelect={selectSite}
                  disabled={isSaving}
                />
              }
            ></MixinsForm>
          )}
        </div>
      ))}
    </>
  )
}

export default MixinsFormBox
