/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '../../../../ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { DOC_VERSION } from '../../../../lib/doc-util'
import {
  fetchSecret,
  savePullSecret,
  saveSSHKey,
  onEditNtpSources,
  onEditProxy,
} from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'

const { EnvironmentDetails, EnvironmentErrors } = CIM

type DetailsTabProps = {
  infraEnv: CIM.InfraEnvK8sResource
  infraAgents: CIM.AgentK8sResource[]
  bareMetalHosts: CIM.BareMetalHostK8sResource[]
}

const DetailsTab: React.FC<DetailsTabProps> = ({ infraEnv, infraAgents, bareMetalHosts }) => (
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

export default DetailsTab
