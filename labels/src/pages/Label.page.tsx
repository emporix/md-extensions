import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { createLabel, editLabel, fetchLabel } from '@emporix/api-calls'
import {
  Dropdown,
  Editor,
  InputText,
  PrimaryButton,
  SecondaryButton,
  SectionBox,
  Tabs,
  useToast,
} from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import FormGrid from '../components/shared/FormGrid'
import AssetsViewer from '../components/shared/AssetsViewer'
import MediaAssetUpload from '../components/shared/MediaAssetUpload'
import { getApiErrorDetails, makeCall } from '../helpers/api'
import { useUIBlocker } from '../context/UIBlcoker'
import { usePermissions } from '../context/PermissionsProvider'
import { useRefresh } from '../context/RefreshValuesProvider'
import { useMediaAssets } from '../hooks/api/mediaAssets'
import useCustomNavigate from '../hooks/useCustomNavigate'
import { useTabs } from '../hooks/useTabs'
import { MediaRefIdType, type Asset } from '../models/Assets.model'
import {
  createLabelForm,
  OverlayPositions,
  type Label,
  type LabelFormFields,
} from '../models/Label.model'
import { EmployeeDomains } from '../configs/accessControls'
import { labelDetailPath, listPath } from '../constants/paths'
import styles from './LabelPage.module.scss'

const TABS = ['details', 'media']

const LabelPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { activeTab, onTabChange } = useTabs(TABS, true)
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.LABELS_MANAGER)
  const { refresh, setRefreshValue } = useRefresh()
  const { getAllAssetsForId } = useMediaAssets()

  const [label, setLabel] = useState<Label>()
  const [assets, setAssets] = useState<Asset[]>([])
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<LabelFormFields>({
    mode: 'onChange',
    defaultValues: createLabelForm(),
  })

  const overlayOptions = useMemo(
    () => [
      {
        label: t('labels.dialog.overlayOptions.none'),
        position: OverlayPositions.NONE,
      },
      {
        label: t('labels.dialog.overlayOptions.topLeft'),
        position: OverlayPositions.TOP_LEFT,
      },
      {
        label: t('labels.dialog.overlayOptions.topRight'),
        position: OverlayPositions.TOP_RIGHT,
      },
      {
        label: t('labels.dialog.overlayOptions.bottomLeft'),
        position: OverlayPositions.BOTTOM_LEFT,
      },
      {
        label: t('labels.dialog.overlayOptions.bottomRight'),
        position: OverlayPositions.BOTTOM_RIGHT,
      },
    ],
    [t]
  )

  useEffect(() => {
    if (!id) {
      return
    }

    void (async () => {
      try {
        const fetched = await makeCall(() => fetchLabel(id), blockPanel)
        setLabel(fetched)
        reset(createLabelForm(fetched))
      } catch (e: unknown) {
        showError(t('labels.toasts.errorFetch'), getApiErrorDetails(e))
        navigate(listPath(), { replace: true })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id) {
      return
    }

    void (async () => {
      try {
        setAssets(await getAllAssetsForId(id))
      } catch {
        // Assets are supplementary — the details tab stays usable without them.
        setAssets([])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refresh])

  const submit = async (data: LabelFormFields) => {
    // An unset overlay position is sent as `{}`, like the MD form did.
    const payload = { ...label, ...data } as Label

    try {
      if (id) {
        const updated = await makeCall(() => editLabel(payload), blockPanel)
        setLabel(updated)
        reset(createLabelForm(updated))
        showSuccess(t('labels.toasts.successUpdate'))
        return
      }

      const created = await makeCall(() => createLabel(payload), blockPanel)
      showSuccess(t('labels.toasts.successCreate'))
      if (created.id) {
        navigate(labelDetailPath(created.id), { replace: true })
      }
    } catch (e: unknown) {
      showError(
        t(id ? 'labels.toasts.errorUpdate' : 'labels.toasts.errorCreate'),
        getApiErrorDetails(e)
      )
    }
  }

  const tabs = useMemo(
    () => [
      {
        id: 'details',
        label: t('labels.tabs.details'),
        content: (
          <SectionBox className={styles.section}>
            <FormGrid>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <InputText
                    label={t('labels.dialog.name')}
                    required
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={!canManage}
                    error={
                      fieldState.error ? t('global.fieldRequired') : undefined
                    }
                    data-testid="label-name"
                  />
                )}
              />
              <Controller
                name="overlay.position"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    label={t('labels.dialog.overlay')}
                    options={overlayOptions}
                    optionValue="position"
                    value={field.value}
                    onChange={(event) => field.onChange(event.value)}
                    disabled={!canManage}
                    data-testid="label-overlay"
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <Editor
                    label={t('labels.dialog.desc')}
                    required
                    value={field.value}
                    onTextChange={(event) =>
                      field.onChange(event.htmlValue ?? '')
                    }
                    readOnly={!canManage}
                    error={
                      fieldState.error ? t('global.fieldRequired') : undefined
                    }
                    data-testid="label-description"
                  />
                )}
              />
            </FormGrid>
          </SectionBox>
        ),
      },
      {
        id: 'media',
        label: t('labels.tabs.media'),
        // Assets hang off a persisted label id. Keep the tab visible but
        // disabled until the label has been created (matches MD TabPanel).
        disabled: !id,
        content: id ? (
          <>
            <AssetsViewer
              assets={assets}
              refresh={setRefreshValue}
              managerPermissions={canManage}
              className={styles.section}
            />
            <MediaAssetUpload
              type={MediaRefIdType.LABEL}
              id={id}
              refresh={setRefreshValue}
              managerPermissions={canManage}
              multiple={false}
              currentAsset={assets.length === 0 ? undefined : assets[0]}
            />
          </>
        ) : null,
      },
    ],
    [assets, canManage, control, id, overlayOptions, setRefreshValue, t]
  )

  return (
    <>
      <HeaderSection
        title={t('labels.singular')}
        subtitle={id ? label?.name : undefined}
        backTo={() => navigate(listPath())}
        moduleActions={
          <div className={styles.actions}>
            <SecondaryButton
              disabled={!isDirty || !canManage}
              onClick={() => reset()}
            >
              {t('global.discard')}
            </SecondaryButton>
            <PrimaryButton
              disabled={!isDirty || !isValid || !canManage}
              onClick={handleSubmit(submit)}
            >
              {t('global.save')}
            </PrimaryButton>
          </div>
        }
      />
      <Tabs
        tabs={tabs}
        activeTabId={activeTab ?? 'details'}
        onTabChange={onTabChange}
      />
    </>
  )
}

export default LabelPage
