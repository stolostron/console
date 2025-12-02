/* Copyright Contributors to the Open Cluster Management project */

import { Button } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmEmptyState } from '../../ui-components'

export function CommonProjectsEmptyState({ onCreateCommonProject }: { onCreateCommonProject: () => void }) {
  const { t } = useTranslation()

  return (
    <AcmEmptyState
      title={t('No common projects found')}
      message={t('Go back and select different clusters, or create projects with the same name on these clusters.')}
      action={
        <Button variant="primary" onClick={onCreateCommonProject}>
          {t('Create common project')}
        </Button>
      }
    />
  )
}
