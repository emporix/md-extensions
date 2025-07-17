import { useState } from 'react'
import './App.css'
import RemoteComponent from './RemoteComponent'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import 'primereact/resources/themes/lara-light-indigo/theme.css' //theme
import 'primereact/resources/primereact.min.css' //core css
import 'primeicons/primeicons.css'

function App() {
  const [tenant, setTenant] = useState(localStorage.getItem('tenant') || '')
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'en'
  )
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  const [isDialogOpen, setIsDialogOpen] = useState(true)

  const handleSave = () => {
    localStorage.setItem('tenant', tenant)
    localStorage.setItem('language', language)
    localStorage.setItem('token', token)
    setIsDialogOpen(false)
  }

  if (isDialogOpen) {
    return (
      <div className="p-16">
        <Card>
          <span className="p-float-label mb-5">
            <InputText
              id="in"
              value={tenant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenant(e.target.value)}
            />
            <label htmlFor="in">Tenant</label>
          </span>
          <span className="p-float-label mb-5">
            <InputText
              id="in"
              value={token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
            />
            <label htmlFor="in">Token</label>
          </span>
          <span className="p-float-label mb-5">
            <InputText
              id="in"
              value={language}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
            />
            <label htmlFor="in">Language</label>
          </span>
          <Button label="Save" onClick={handleSave} />
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
      }}
    />
  )
}

export default App
