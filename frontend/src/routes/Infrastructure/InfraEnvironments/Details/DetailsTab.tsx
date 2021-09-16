/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'

const { EnvironmentDetails, EnvironmentErrors } = CIM

type DetailsTabProps = CIM.EnvironmentErrorsProps

const DetailsTab: React.FC<DetailsTabProps> = ({ infraEnv }) => (
    <AcmPageContent id="overview">
        <PageSection>
            <EnvironmentErrors infraEnv={infraEnv} />
            <Card>
                <CardBody>
                    <EnvironmentDetails infraEnv={infraEnv} />
                </CardBody>
            </Card>
        </PageSection>
    </AcmPageContent>
)

export default DetailsTab
