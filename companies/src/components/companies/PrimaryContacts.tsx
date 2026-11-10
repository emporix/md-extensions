import { ContactAssignment } from '../../models/LegalEntity.model'
import Contact from './Contact'
import styles from './PrimaryContacts.module.scss'

export const PrimaryContacts = (props: {
  readonly contacts: ContactAssignment[]
}) => {
  const { contacts } = props
  return (
    <div className={styles.list}>
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
