import React from 'react'
import { ContactAssignment } from 'models/LegalEntity'
import Contact from 'components/companies/Contact'

export const PrimaryContacts = (props: { contacts: ContactAssignment[] }) => {
  const { contacts } = props
  return (
    <div className="flex flex-column">
      {contacts.map((contactAssignment) => {
        return (
          <Contact
            key={contactAssignment.id}
            contactAssignment={contactAssignment}
          />
        )
      })}
    </div>
  )
}
