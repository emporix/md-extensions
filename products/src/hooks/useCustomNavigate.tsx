import { NavigateOptions, To, useNavigate } from 'react-router-dom'

const useCustomNavigate = () => {
  const navigate = useNavigate()

  const customNavigate = (to: To, options?: NavigateOptions) => {
    navigate(to, options)
  }

  return { navigate: customNavigate }
}

export default useCustomNavigate
