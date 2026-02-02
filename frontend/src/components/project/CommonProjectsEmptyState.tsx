/* Copyright Contributors to the Open Cluster Management project */

import { Button, Tooltip } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmEmptyState } from '../../ui-components'

interface CommonProjectsEmptyStateProps {
  onCreateCommonProject: () => void
  createButtonDisabledReason?: string
}

export function CommonProjectsEmptyState({
  onCreateCommonProject,
  createButtonDisabledReason,
}: CommonProjectsEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <AcmEmptyState
      title={t('No common projects found')}
      message={t('Go back and select different clusters, or create projects with the same name on these clusters.')}
      action={
        createButtonDisabledReason ? (
          <Tooltip content={createButtonDisabledReason}>
            <Button variant="primary" onClick={onCreateCommonProject} isAriaDisabled>
              {t('Create common project')}
            </Button>
          </Tooltip>
        ) : (
          <Button variant="primary" onClick={onCreateCommonProject}>
            {t('Create common project')}
          </Button>
        )
      }
    />
  )
}
