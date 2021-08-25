/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'

const { EnvironmentDetails } = CIM

type DetailsTabProps = {
    infraEnv: CIM.InfraEnvK8sResource
}

const DetailsTab: React.FC<DetailsTabProps> = ({ infraEnv }) => (
    <AcmPageContent id="overview">
        <PageSection>
            <Card>
                <CardBody>
                    <EnvironmentDetails infraEnv={infraEnv} />
                </CardBody>
            </Card>
        </PageSection>
    </AcmPageContent>
)

export default DetailsTab
