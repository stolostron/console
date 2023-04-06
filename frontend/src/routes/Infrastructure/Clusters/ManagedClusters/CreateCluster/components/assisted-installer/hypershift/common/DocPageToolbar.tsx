/* Copyright Contributors to the Open Cluster Management project */
import { Button, Toolbar, ToolbarContent } from '@patternfly/react-core'
import * as React from 'react'
import { useTranslation } from '../../../../../../../../../lib/acm-i18next'

type DocPageProps = {
  onCancel: () => void
  onBack: () => void
}

const DocPageToolbar: React.FC<DocPageProps> = ({ onCancel, onBack }) => {
  const { t } = useTranslation()
  return (
    <Toolbar>
      <ToolbarContent>
        <Button variant="secondary" onClick={onBack}>
          {t('Back')}
        </Button>
        <ToolbarContent>
          <Button
            variant="link"
            isInline
            onClick={onCancel}
            style={{
              paddingLeft: 48,
            }}
          >
            {t('Cancel')}
          </Button>
        </ToolbarContent>
      </ToolbarContent>
    </Toolbar>
  )
}

export default DocPageToolbar
