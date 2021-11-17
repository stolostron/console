/* Copyright Contributors to the Open Cluster Management project */
import { AcmPageContent } from '@open-cluster-management/ui-components'
import { Card, CardBody, PageSection } from '@patternfly/react-core'
import { CIM } from 'openshift-assisted-ui-lib'
import { useRecoilValue } from 'recoil'
import { configMapsState } from '../../../../atoms'
import { getAIConfigMap } from '../../Clusters/ManagedClusters/CreateCluster/components/assisted-installer/utils'

const { EnvironmentDetails, EnvironmentErrors } = CIM

type DetailsTabProps = CIM.EnvironmentErrorsProps

const DetailsTab: React.FC<DetailsTabProps> = ({ infraEnv }) => {
    const configMaps = useRecoilValue(configMapsState)
    const aiConfigMap = getAIConfigMap(configMaps)
    return (
        <AcmPageContent id="overview">
            <PageSection>
                <EnvironmentErrors infraEnv={infraEnv} />
                <Card>
                    <CardBody>
                        <EnvironmentDetails infraEnv={infraEnv} aiConfigMap={aiConfigMap} />
                    </CardBody>
                </Card>
            </PageSection>
        </AcmPageContent>
    )
}

export default DetailsTab
