/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { useParams } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../ui-components'

const UserYaml = () => {
  const { t } = useTranslation()
  const { id = undefined } = useParams()

  return (
    <AcmPage header={<AcmPageHeader title={t('User YAML')} description={`User: ${id}`} />}>
      <AcmPageContent id="user-yaml">
        <PageSection>User YAML page for ID: {id}</PageSection>
      </AcmPageContent>
    </AcmPage>
  )
}

export { UserYaml }
