import { useFeatureToggles } from '../context/FeatureTogglesProvider'
import { ENTRAID_GROUPS_SYNC_FEATURE_TOGGLE } from '../configs/entraId.config'

export const useEntraIdGroupsSync = () => {
  const { isToggleValid, togglesLoading } = useFeatureToggles()
  const isEntraIdGroupsSyncEnabled = isToggleValid(
    ENTRAID_GROUPS_SYNC_FEATURE_TOGGLE
  )

  return {
    isEntraIdGroupsSyncEnabled,
    togglesLoading,
  }
}
