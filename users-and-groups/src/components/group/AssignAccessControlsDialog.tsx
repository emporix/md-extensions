import {
  DataTable,
  Dialog,
  InputText,
  PrimaryButton,
  SecondaryButton,
} from '@emporix/component-library'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessControl } from '../../models/Permissions.model'
import AccessControlsExpansionTable from './AccessControlsExpansionTable'
import useDomainsColumns from '../../hooks/useDomainsColumns'
import { useGroupData } from '../../context/Group.provider'
import { DomainGroup } from '../../helpers/accessControls'
import styles from './AssignAccessControlsDialog.module.scss'

interface Props {
  visible: boolean
  onClose: () => void
  availableDomains: DomainGroup[]
  onAssign: (accessControls: AccessControl[]) => void
}

const AssignAccessControlsDialog = (props: Props) => {
  const { visible, onClose, availableDomains, onAssign } = props
  const { columns } = useDomainsColumns()
  const { t } = useTranslation()
  const { isPredefinedGroup } = useGroupData()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<DomainGroup[]>([])
  const [selectedAcs, setSelectedAcs] = useState<AccessControl[]>([])

  const hasSelection = selectedAcs.length > 0

  const filteredDomains = useMemo(() => {
    if (!searchQuery) return availableDomains
    const query = searchQuery.toLowerCase()
    return availableDomains.filter((domain) =>
      domain.name.toLowerCase().includes(query)
    )
  }, [availableDomains, searchQuery])

  const selectedDomains = useMemo(() => {
    const selectedIds = new Set(selectedAcs.map((ac) => ac.id))
    return filteredDomains.filter(
      (domain) =>
        domain.accessControls.length > 0 &&
        domain.accessControls.every((ac) => selectedIds.has(ac.id))
    )
  }, [selectedAcs, filteredDomains])

  const handleDomainSelectionChange = useCallback(
    (newSelectedDomains: DomainGroup[]) => {
      const prevNames = new Set(selectedDomains.map((d) => d.name))
      const newNames = new Set(newSelectedDomains.map((d) => d.name))

      const addedDomains = newSelectedDomains.filter(
        (d) => !prevNames.has(d.name)
      )
      const removedDomains = selectedDomains.filter(
        (d) => !newNames.has(d.name)
      )

      let updated = [...selectedAcs]

      // Add all ACs from newly selected domains
      const existingIds = new Set(updated.map((ac) => ac.id))
      for (const domain of addedDomains) {
        for (const ac of domain.accessControls) {
          if (!existingIds.has(ac.id)) {
            updated.push(ac)
            existingIds.add(ac.id)
          }
        }
      }

      // Remove all ACs from deselected domains
      const removeIds = new Set(
        removedDomains.flatMap((d) => d.accessControls.map((ac) => ac.id))
      )
      updated = updated.filter((ac) => !removeIds.has(ac.id))

      setSelectedAcs(updated)
    },
    [selectedAcs, selectedDomains]
  )

  const handleAssign = () => {
    onAssign(selectedAcs)
    handleDiscard()
    onClose()
  }

  const handleDiscard = () => {
    setSelectedAcs([])
    setSearchQuery('')
  }

  const handleClose = () => {
    handleDiscard()
    onClose()
  }

  const footer = (
    <div className={styles.footerActions}>
      <SecondaryButton disabled={!hasSelection} onClick={handleDiscard}>
        {t('global.discard')}
      </SecondaryButton>
      <PrimaryButton
        disabled={!hasSelection || isPredefinedGroup}
        onClick={handleAssign}
      >
        {t('usersAndGroups.groups.buttons.assignAccessControls')}
      </PrimaryButton>
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={handleClose}
      header={t('usersAndGroups.groups.titles.availableAccessControls')}
      footer={footer}
      style={{ maxWidth: '1000px', width: '100%', maxHeight: '80vh' }}
      draggable={false}
    >
      <div className={styles.searchSection}>
        <div className={styles.searchField}>
          <i className="pi pi-search" />
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      <div className={styles.tableContainer}>
        <DataTable
          style={{ border: 'none' }}
          columns={columns}
          value={filteredDomains}
          selectionMode="multiple"
          selection={selectedDomains}
          onSelectionChange={(selection) =>
            handleDomainSelectionChange(selection as DomainGroup[])
          }
          expandedRows={expandedRows}
          onRowToggle={setExpandedRows}
          rowExpansionTemplate={(domain) => (
            <AccessControlsExpansionTable
              accessControls={domain.accessControls}
              selectable
              selection={selectedAcs}
              onSelectionChange={setSelectedAcs}
            />
          )}
          emptyTemplate={t('usersAndGroups.groups.tables.accessControls.emptyText')}
          sortField="name"
          sortOrder={1}
          paginator={false}
          showFilter={false}
          showHeaders={false}
        />
      </div>
    </Dialog>
  )
}

export default AssignAccessControlsDialog
