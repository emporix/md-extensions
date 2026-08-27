import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { object, string } from 'yup'
import {
  PrimaryButton,
  SecondaryButton,
  Tabs,
  useToast,
  type TabItem,
} from '@emporix/component-library'

import HeaderSection from '../components/shared/HeaderSection'
import ReturnEditDetails from '../components/returns/ReturnEditDetails'
import useMixinsForm from '../components/mixins/useMixinsForm'
import type { MixinsFormMetadata } from '../components/mixins/helpers'
import { useUIBlocker } from '../context/UIBlocker'
import { usePermissions } from '../context/PermissionsProvider'
import { EmployeeDomains } from '../configs/accessControls'
import { useReturnsApi } from '../hooks/api/returns'
import { useTabs } from '../hooks/useTabs'
import { getApiErrorDetails } from '../helpers/api'
import type { Mixins } from '../models/Mixins.model'
import { SchemaType } from '../models/Schema.model'
import {
  ReturnDetails,
  ReturnEditOp,
  ReturnUpdateRequest,
} from '../models/Returns.model'
import { returnsListPath } from '../constants/paths'
import styles from './ReturnsPage.module.scss'

const DETAILS_TAB = 'details'

const ReturnEditPage = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { blockPanel } = useUIBlocker()
  const { getReturnsDetails, updateReturn, patchReturn } = useReturnsApi()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.RETURNS_MANAGER)

  const [returnDetails, setReturnDetails] = useState<ReturnDetails>()

  const schema = useMemo(
    () =>
      object({
        reason: object().shape(
          {
            code: string().when('details', {
              is: (val: string) => !val || val.length < 1,
              then: (schema) => schema.required(t('errors.shared.cantBeBlank')),
            }),
            details: string().when('code', {
              is: (val: string) => !val || val.length < 1,
              then: (schema) => schema.required(t('errors.shared.cantBeBlank')),
            }),
          },
          [['details', 'code']]
        ),
      }),
    [t]
  )

  const {
    formState: { isDirty, isValid, errors },
    control,
    handleSubmit,
    reset,
  } = useForm<ReturnDetails>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema as any),
    mode: 'onChange',
  })

  const loadData = useCallback(async () => {
    if (!id) {
      return
    }
    try {
      blockPanel(true)
      const details = await getReturnsDetails(id)
      details.mixins ??= {}
      details.metadata ??= {}
      details.metadata.mixins ??= {}
      loadMixins(
        details.metadata.mixins as Record<string, string>,
        details.mixins
      )
      setReturnDetails(details)
      reset(details)
    } catch (e: unknown) {
      showError(t('returns.toasts.errorFetch'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const saveMixin = async (data: Mixins, mixinMetadata: MixinsFormMetadata) => {
    if (!returnDetails?.id) {
      return
    }
    const { url, key } = mixinMetadata
    const hasMixins =
      returnDetails.mixins && Object.keys(returnDetails.mixins).length > 0
    const updateOperation: ReturnUpdateRequest[] = [
      hasMixins
        ? { op: ReturnEditOp.add, path: `/mixins/${key}`, value: data }
        : { op: ReturnEditOp.add, path: `/mixins`, value: { [key]: data } },
    ]

    const metadataMixins = returnDetails.metadata.mixins as
      | Record<string, string>
      | undefined
    const hasMetadataMixins =
      metadataMixins && Object.keys(metadataMixins).length > 0
    updateOperation.push(
      hasMetadataMixins
        ? { op: ReturnEditOp.add, path: `/metadata/mixins/${key}`, value: url }
        : {
            op: ReturnEditOp.add,
            path: `/metadata/mixins`,
            value: { [key]: url },
          }
    )

    try {
      blockPanel(true)
      await patchReturn(returnDetails.id, updateOperation)
      await loadData()
      showSuccess(t('returns.details.updateSuccess'))
    } catch (e: unknown) {
      showError(t('returns.toasts.errorUpdate'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const { loadMixins, mixinsForms } = useMixinsForm({
    type: SchemaType.RETURN,
    onEdit: saveMixin,
    managerPermissions: canManage,
  })

  const onSubmit: SubmitHandler<ReturnDetails> = async (data) => {
    try {
      blockPanel(true)
      await updateReturn(data)
      await loadData()
      showSuccess(t('returns.details.updateSuccess'))
    } catch (e: unknown) {
      showError(t('returns.toasts.errorUpdate'), getApiErrorDetails(e))
    } finally {
      blockPanel(false)
    }
  }

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: DETAILS_TAB,
        label: t('returns.tabs.first'),
        content: (
          <ReturnEditDetails
            returnDetails={returnDetails}
            control={control}
            errors={errors}
          />
        ),
      },
      ...mixinsForms.map((form) => ({
        id: form.id,
        label: form.name,
        content: form.template,
      })),
    ],
    [t, returnDetails, control, errors, mixinsForms]
  )

  const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs])
  const { activeTab, onTabChange } = useTabs(tabIds, true)
  const activeTabId = activeTab ?? DETAILS_TAB

  return (
    <>
      <HeaderSection
        title={t('returns.singular')}
        subtitle={returnDetails?.id}
        backTo={returnsListPath()}
        moduleActions={
          // Mixin tabs carry their own save/discard controls.
          activeTabId === DETAILS_TAB && (
            <div className={styles.headerActions}>
              <SecondaryButton disabled={!isDirty} onClick={() => loadData()}>
                {t('global.discard')}
              </SecondaryButton>
              <PrimaryButton
                className={styles.saveButton}
                disabled={!isDirty || !isValid}
                onClick={handleSubmit(onSubmit)}
              >
                {t('global.save')}
              </PrimaryButton>
            </div>
          )
        }
      />
      <Tabs tabs={tabs} activeTabId={activeTabId} onTabChange={onTabChange} />
    </>
  )
}

export default ReturnEditPage
