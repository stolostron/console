/* Copyright Contributors to the Open Cluster Management project */

import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'

export const GlobalScopeSelection = () => {
  const { t } = useTranslation()

  return (
    <Panel
      style={{
        backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)', // #f5f5f5 - rgb(245, 245, 245)
      }}
    >
      <PanelMain>
        <PanelMainBody>
          {t('This role assignment will apply to all resources registered in Advanced Cluster Management.')}
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
