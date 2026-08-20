import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { createBrand, editBrand, fetchBrand } from '@emporix/api-calls'
import {
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
  createBrandForm,
  type Brand,
  type BrandFormFields,
} from '../models/Brand.model'
import { EmployeeDomains } from '../configs/accessControls'
import { brandDetailPath, listPath } from '../constants/paths'
import styles from './BrandPage.module.scss'

const TABS = ['details', 'media']

const BrandPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { activeTab, onTabChange } = useTabs(TABS, true)
  const { navigate } = useCustomNavigate()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.BRANDS_MANAGER)
  const { refresh, setRefreshValue } = useRefresh()
  const { getAllAssetsForId } = useMediaAssets()

  const [brand, setBrand] = useState<Brand>()
  const [assets, setAssets] = useState<Asset[]>([])
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<BrandFormFields>({
    mode: 'onChange',
    defaultValues: createBrandForm(),
  })

  useEffect(() => {
    if (!id) {
      return
    }

    void (async () => {
      try {
        const fetched = await makeCall(() => fetchBrand(id), blockPanel)
        setBrand(fetched)
        reset(createBrandForm(fetched))
      } catch (e: unknown) {
        showError(t('brands.toasts.errorFetch'), getApiErrorDetails(e))
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

  const submit = async (data: BrandFormFields) => {
    const payload: Brand = { ...brand, ...data }

    try {
      if (id) {
        const updated = await makeCall(() => editBrand(payload), blockPanel)
        setBrand(updated)
        reset(createBrandForm(updated))
        showSuccess(t('brands.toasts.successUpdate'))
        return
      }

      const created = await makeCall(() => createBrand(payload), blockPanel)
      showSuccess(t('brands.toasts.successCreate'))
      if (created.id) {
        navigate(brandDetailPath(created.id), { replace: true })
      }
    } catch (e: unknown) {
      showError(
        t(id ? 'brands.toasts.errorUpdate' : 'brands.toasts.errorCreate'),
        getApiErrorDetails(e)
      )
    }
  }

  const tabs = useMemo(
    () => [
      {
        id: 'details',
        label: t('brands.tabs.details'),
        content: (
          <SectionBox className={styles.section}>
            <FormGrid>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <InputText
                    label={t('brands.dialog.name')}
                    required
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={!canManage}
                    error={
                      fieldState.error ? t('global.fieldRequired') : undefined
                    }
                    data-testid="brand-name"
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <Editor
                    label={t('brands.dialog.desc')}
                    required
                    value={field.value}
                    onTextChange={(event) =>
                      field.onChange(event.htmlValue ?? '')
                    }
                    readOnly={!canManage}
                    error={
                      fieldState.error ? t('global.fieldRequired') : undefined
                    }
                    data-testid="brand-description"
                  />
                )}
              />
            </FormGrid>
          </SectionBox>
        ),
      },
      {
        id: 'media',
        label: t('brands.tabs.media'),
        // Assets hang off a persisted brand id. Keep the tab visible but
        // disabled until the brand has been created (matches MD TabPanel).
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
              type={MediaRefIdType.BRAND}
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
    [assets, canManage, control, id, setRefreshValue, t]
  )

  return (
    <>
      <HeaderSection
        title={t('brands.singular')}
        subtitle={id ? brand?.name : undefined}
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

export default BrandPage
