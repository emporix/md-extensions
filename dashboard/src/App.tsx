import { useState } from 'react'
import RemoteComponent from './RemoteComponent'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { useTranslation } from './shared/i18n'
import 'primereact/resources/themes/lara-light-indigo/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'

const App = () => {
  const isDev = import.meta.env.DEV
  const [tenant, setTenant] = useState(sessionStorage.getItem('tenant') || '')
  const [language, setLanguage] = useState(
    sessionStorage.getItem('language') || 'en'
  )
  const [token, setToken] = useState(sessionStorage.getItem('token') || '')

  const [isDialogOpen, setIsDialogOpen] = useState(isDev)
  const { t } = useTranslation(language)

  const handleSave = () => {
    sessionStorage.setItem('tenant', tenant)
    sessionStorage.setItem('language', language)
    sessionStorage.setItem('token', token)
    setIsDialogOpen(false)
  }

  if (isDialogOpen) {
    return (
      <div className="p-16">
        <Card>
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">{t('config.title')}</h2>
            <p className="text-600">{t('config.subtitle')}</p>
          </div>
          <span className="p-float-label mb-5">
            <InputText
              id="tenant"
              value={tenant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTenant(e.target.value)
              }
            />
            <label htmlFor="tenant">{t('config.tenantId')}</label>
          </span>
          <span className="p-float-label mb-5">
            <InputText
              id="token"
              value={token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setToken(e.target.value)
              }
            />
            <label htmlFor="token">{t('config.oauth2Token')}</label>
          </span>
          <span className="p-float-label mb-5">
            <InputText
              id="language"
              value={language}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLanguage(e.target.value)
              }
            />
            <label htmlFor="language">{t('config.language')}</label>
          </span>
          <div className="mt-4 p-3 border-round border-blue-200 bg-blue-50 text-blue-700">
            <i className="pi pi-info-circle mr-2"></i>
            <strong>{t('config.apiConfigTitle')}</strong>{' '}
            {t('config.apiConfigMessage')}
          </div>
          <Button
            label={t('config.saveAndConnect')}
            onClick={handleSave}
            className="mt-4"
          />
        </Card>
      </div>
    )
  }
  return (
    <RemoteComponent
      appState={{
        tenant,
        language,
        token,
        currency: { id: 'EUR', label: 'EUR', default: true, required: false },
        contentLanguage: language,
        user: { userId: 'dev', termsAndConditions: true },
      }}
    />
  )
}

export default App
