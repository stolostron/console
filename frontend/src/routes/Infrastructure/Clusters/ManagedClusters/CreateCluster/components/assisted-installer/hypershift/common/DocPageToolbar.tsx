/* Copyright Contributors to the Open Cluster Management project */
import { Button, PageSection, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core'
import * as React from 'react'
import { useTranslation } from '../../../../../../../../../lib/acm-i18next'

type DocPageProps = {
  onCancel: () => void
  onBack: () => void
}

const DocPageToolbar: React.FC<DocPageProps> = ({ onCancel, onBack }) => {
  const { t } = useTranslation()
  return (
    <PageSection>
      <Toolbar>
        <ToolbarGroup>
          <ToolbarItem>
            <Button variant="secondary" onClick={onBack}>
              {t('Back')}
            </Button>
          </ToolbarItem>
          <ToolbarItem>
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
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    </PageSection>
  )
}

export default DocPageToolbar
