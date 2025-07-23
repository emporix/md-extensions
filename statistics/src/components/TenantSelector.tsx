import React, { useState, useEffect } from 'react'
import { MultiSelect } from 'primereact/multiselect'
import { fetchAllTenants, fetchUserTenants } from '../api'

interface TenantSelectorProps {
  currentTenant: string
  token: string
  onTenantChange: (tenants: string[]) => void
}

const TenantSelector: React.FC<TenantSelectorProps> = ({ 
  currentTenant, 
  token, 
  onTenantChange 
}) => {
  const [tenants, setTenants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTenants, setSelectedTenants] = useState<string[]>([currentTenant])

  const specialTenants = ['emporix', 'emporixstage', 'emporixdev']

  useEffect(() => {
    fetchTenants()
  }, [currentTenant, token])

  useEffect(() => {
    setSelectedTenants([currentTenant])
  }, [currentTenant])

  const fetchTenants = async () => {
    setIsLoading(true)
    try {
      if (specialTenants.includes(currentTenant)) {
        const response = await fetchAllTenants(currentTenant, token)
        setTenants(response.tenants || [])
      } else {
        const response = await fetchUserTenants(currentTenant, token)
        const managementTenants = response
          .filter(userTenant => 
            userTenant.applications.some(app => app.id === 'MANAGEMENT_DASHBOARD')
          )
          .map(userTenant => userTenant.tenant)
        setTenants(managementTenants)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
      setTenants([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTenantChange = (e: { value: string[] }) => {
    const newTenants = e.value
    setSelectedTenants(newTenants)
    onTenantChange(newTenants)
  }

  const tenantOptions = tenants.map(tenant => ({
    label: tenant,
    value: tenant
  }))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Tenants:</span>
      <MultiSelect
        value={selectedTenants}
        options={tenantOptions}
        onChange={handleTenantChange}
        placeholder="Select tenants"
        disabled={isLoading}
        filter
        showClear={false}
        style={{ 
          minWidth: '250px',
          fontSize: '0.9rem'
        }}
        panelStyle={{ 
          maxHeight: '300px' 
        }}
        display="chip"
        maxSelectedLabels={3}
      />
    </div>
  )
}

export default TenantSelector 