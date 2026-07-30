import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import backIcon from '../../../assets/icons/backIcon.svg'
import './BackButton.scss'
import useCustomNavigate from '../../hooks/useCustomNavigate.tsx'

interface Props {
  label: string
  to: string
}

const BackButton = (props: Props) => {
  const { label, to } = props
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()

  const formattedLabel = useMemo(() => {
    return `${t('global.backTo')} ${label}`
  }, [label])
  return (
    <a
      onClick={() => navigate(to)}
      className="back-button flex align-items-center mb-4"
    >
      <img data-test-id="back-button" src={backIcon} alt="back-icon" />
      <span className="ml-2">{formattedLabel}</span>
    </a>
  )
}

export default BackButton
