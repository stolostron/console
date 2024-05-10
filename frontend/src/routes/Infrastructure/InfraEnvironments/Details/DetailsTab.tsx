/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '../../../../ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { DOC_VERSION } from '../../../../lib/doc-util'
import {
  fetchSecret,
  savePullSecret,
  saveSSHKey,
  onEditNtpSources,
  onEditProxy,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'
import { EnvironmentDetails, EnvironmentErrors } from '@openshift-assisted/ui-lib/cim'
import { useInfraEnvironmentDetailsContext } from './InfraEnvironmentDetailsPage'

const DetailsTab: React.FC = () => {
  const { infraEnv, infraAgents, bareMetalHosts } = useInfraEnvironmentDetailsContext()
  return (
    <AcmPageContent id="overview">
      <PageSection>
        <EnvironmentErrors infraEnv={infraEnv} docVersion={DOC_VERSION} />
        <Card>
          <CardBody>
            <EnvironmentDetails
              infraEnv={infraEnv}
              fetchSecret={fetchSecret}
              onEditPullSecret={savePullSecret}
              onEditSSHKey={saveSSHKey}
              onEditNtpSources={onEditNtpSources}
              hasAgents={!!infraAgents.length}
              hasBMHs={!!bareMetalHosts.length}
              onEditProxy={onEditProxy}
            />
          </CardBody>
        </Card>
      </PageSection>
    </AcmPageContent>
  )
}

export default DetailsTab
