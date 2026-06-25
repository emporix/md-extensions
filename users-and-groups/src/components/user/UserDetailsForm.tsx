import FormGridRow from '../../components/shared/FormGridRow'
import InputField from '../../components/shared/InputField'
import { Controller, useFormContext } from 'react-hook-form'
import { Dropdown, InputText } from '@emporix/component-library'
import FormGrid from '../../components/shared/FormGrid'
import { useTranslation } from 'react-i18next'
import { useConfiguration } from '../../context/ConfigurationProvider'
import { useSites } from '../../context/SitesProvider'
import { useCurrencies } from '../../hooks/useCurrencies'
import { useLocalizedValue } from '../../hooks/useLocalizedValue'
import { textToTitleCase } from '../../helpers/utils'
import { useParams } from 'react-router'
import { DotIndicator } from '../../components/shared/DotIndicator'
import { UserFormFields } from '../../helpers/users/users.helpers'
import { usePermissions } from '../../context/PermissionsProvider'
import { EmployeeDomains } from '../../configs/accessControls'

const UserDetailsForm = () => {
  const { t } = useTranslation()
  const { control } = useFormContext<UserFormFields>()
  const { getContentLangValue } = useLocalizedValue()

  const { userId } = useParams()
  const { languages } = useConfiguration()
  const { sites } = useSites()
  const { currencies } = useCurrencies()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(EmployeeDomains.USERS_AND_GROUPS_MANAGER)
  const canViewLanguages = hasPermission(EmployeeDomains.LANGUAGES_VIEWER)
  const canViewCurrencies = hasPermission(EmployeeDomains.CURRENCIES_VIEWER)

  return (
    <FormGrid>
      <FormGridRow>
        <Controller
          name="firstName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              className="col-4"
              label={t('usersAndGroups.users.forms.user.firstName')}
              required
              value={field.value}
              disabled={!canManage}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="lastName"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              className="col-4"
              label={t('usersAndGroups.users.forms.user.lastName')}
              required
              value={field.value}
              disabled={!canManage}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="contactEmail"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              className="col-4"
              label={t('usersAndGroups.users.forms.user.contactEmail')}
              required
              value={field.value}
              disabled={!canManage}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      </FormGridRow>

      <FormGridRow>
        <Controller
          name="department"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              className="col-6"
              label={t('usersAndGroups.users.forms.user.department')}
              required
              value={field.value}
              disabled={!canManage}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <InputField
          className="col-6"
          label={t('usersAndGroups.users.forms.user.preferredSite')}
          required
        >
          <Controller
            name="preferredSite"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                disabled={!canManage}
                options={(sites ?? [])
                  .map((s) => ({
                    label: s.name,
                    value: s.code,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />
        </InputField>
      </FormGridRow>

      <FormGridRow>
        <Controller
          name="preferredLanguage"
          control={control}
          rules={{ required: true }}
          render={({ field }) =>
            canViewLanguages ? (
              <InputField
                className="col-4"
                label={t('usersAndGroups.users.forms.user.preferredLanguage')}
                required
              >
                <Dropdown
                  disabled={!canManage}
                  value={field.value}
                  options={(languages ?? [])
                    .map((l) => ({
                      label: l.label,
                      value: l.id,
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))}
                  onChange={(e) => field.onChange(e.value)}
                />
              </InputField>
            ) : (
              <InputText
                className="col-4"
                label={t('usersAndGroups.users.forms.user.preferredLanguage')}
                required
                disabled
                readOnly
                value={t('global.noPermissions')}
              />
            )
          }
        />
        <Controller
          name="preferredCurrency"
          control={control}
          rules={{ required: true }}
          render={({ field }) =>
            canViewCurrencies ? (
              <InputField
                className="col-4"
                label={t('usersAndGroups.users.forms.user.preferredCurrency')}
                required
              >
                <Dropdown
                  value={field.value}
                  disabled={!canManage}
                  options={(currencies ?? [])
                    .map((c) => ({
                      label: getContentLangValue(c.label),
                      value: c.id,
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label))}
                  onChange={(e) => field.onChange(e.value)}
                />
              </InputField>
            ) : (
              <InputText
                className="col-4"
                label={t('usersAndGroups.users.forms.user.preferredCurrency')}
                required
                disabled
                readOnly
                value={t('global.noPermissions')}
              />
            )
          }
        />
        {userId && (
          <InputField
            className="col-4"
            label={t('usersAndGroups.users.forms.user.status')}
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div className="flex align-items-center gap-2 h-full">
                  <DotIndicator value={field.value === 'active'} />
                  {textToTitleCase(field.value)}
                </div>
              )}
            />
          </InputField>
        )}
      </FormGridRow>
    </FormGrid>
  )
}

export default UserDetailsForm
