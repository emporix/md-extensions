import { useTranslation } from 'react-i18next'
import { Divider, SectionBox } from '@emporix/component-library'
import CouponValidityForm from './CouponValidityForm'
import CouponAppliesToForm from './CouponAppliesToForm'
import CouponVendorsForm from './CouponVendorsForm'
import styles from './Coupons.module.scss'

/**
 * Section titles use plain markup on purpose: `SectionBox name` title-cases the
 * text and strips the "&" from "Validity & Value" (MD parity).
 */
const SectionTitle = ({ title }: { readonly title: string }) => (
  <div className={styles.sectionTitle}>{title}</div>
)

const CouponRulesForm = () => {
  const { t } = useTranslation()

  return (
    <>
      <SectionTitle title={t('coupons.edit.tab.rules.validityAndValue')} />
      <SectionBox className={styles.sectionGap}>
        <CouponValidityForm />
      </SectionBox>
      <SectionTitle title={t('coupons.edit.tab.rules.restriction')} />
      <SectionBox>
        <CouponAppliesToForm />
        <Divider />
        <CouponVendorsForm />
      </SectionBox>
    </>
  )
}

export default CouponRulesForm
