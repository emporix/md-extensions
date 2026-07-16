import React from 'react'
import { useTranslation } from 'react-i18next'

export const TeamsTeamIdGuide: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="tool-detail-teams-install-team-id-guide">
      <p className="tool-detail-section-description tool-detail-teams-install-team-id-guide-title">
        {t('teams_install_how_to_find_team_id')}
      </p>
      <p className="tool-detail-section-description">
        {t('teams_install_team_id_intro')}
      </p>
      <p className="tool-detail-section-description tool-detail-teams-install-team-id-guide-method">
        {t('teams_install_team_id_method_teams_app_title')}
      </p>
      <ol className="tool-detail-teams-install-substeps">
        <li>{t('teams_install_team_id_method_teams_app_1')}</li>
        <li>{t('teams_install_team_id_method_teams_app_2')}</li>
        <li>{t('teams_install_team_id_method_teams_app_3')}</li>
      </ol>
      <p className="tool-detail-section-description tool-detail-teams-install-team-id-guide-method">
        {t('teams_install_team_id_method_admin_title')}
      </p>
      <ol className="tool-detail-teams-install-substeps">
        <li>{t('teams_install_team_id_method_admin_1')}</li>
        <li>{t('teams_install_team_id_method_admin_2')}</li>
      </ol>
      <p className="tool-detail-section-description tool-detail-teams-install-team-id-example">
        <code>{t('teams_install_team_id_example')}</code>
      </p>
      <p className="tool-detail-section-description">
        {t('teams_install_team_id_team_scope_warning')}
      </p>
    </div>
  )
}
