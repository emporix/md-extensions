import { useTranslation } from 'react-i18next'
import { Button } from 'primereact/button'
import useCustomNavigate from '../hooks/useCustomNavigate'

const NotFoundModule = () => {
  const { t } = useTranslation()
  const { navigate } = useCustomNavigate()

  return (
    <div
      className="mx-auto flex flex-column align-items-center pt-8"
      style={{ maxWidth: '500px' }}
    >
      <div className="font-bold" style={{ fontSize: '80px', color: '#c0d0df' }}>
        404
      </div>
      <div className="font-bold text-xl mb-6">{t('notFound.title')}</div>
      <Button
        className="p-button"
        onClick={() => navigate('/', { replace: true })}
      >
        {t('notFound.backToHome')}
      </Button>
    </div>
  )
}

export default NotFoundModule
