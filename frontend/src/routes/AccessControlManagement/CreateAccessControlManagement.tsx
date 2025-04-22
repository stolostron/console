/* Copyright Contributors to the Open Cluster Management project */
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../NavigationPath'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '../../ui-components'
import { AccessControlManagementForm } from './AccessControlManagementForm'
import { PageSection } from '@patternfly/react-core'

const CreateAccessControlManagement: React.FC = () => {
  const { t } = useTranslation()

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={t('createAccessControlManagement.title')}
          breadcrumb={[
            { text: t('Access Control Management'), to: NavigationPath.accessControlManagement },
            { text: t('createAccessControlManagement.title'), to: '' },
          ]}
        />
      }
    >
      <AcmErrorBoundary>
        <AcmPageContent id="create-access-control-management">
          <PageSection variant={'light'}>
            <AccessControlManagementForm />
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}

export { CreateAccessControlManagement }

