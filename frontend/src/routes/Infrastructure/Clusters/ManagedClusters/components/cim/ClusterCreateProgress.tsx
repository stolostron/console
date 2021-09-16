/* Copyright Contributors to the Open Cluster Management project */
import { AcmButton } from '@open-cluster-management/ui-components'
import {
    Bullseye,
    Button,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateSecondaryActions,
    Page,
    PageSection,
    Spinner,
    Title,
} from '@patternfly/react-core'
import * as React from 'react'
import { RouteComponentProps, useHistory } from 'react-router'
import { useRecoilValue, waitForAll } from 'recoil'
import { CIM } from 'openshift-assisted-ui-lib'
import { agentClusterInstallsState } from '../../../../../../atoms'
import { ErrorPage } from '../../../../../../components/ErrorPage'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ResourceError } from '../../../../../../resources'

const { ClusterDeploymentCreateProgress } = CIM

type ClusterCreateProgressProps = RouteComponentProps<{ namespace: string; name: string }>

const ClusterCreateProgress: React.FC<ClusterCreateProgressProps> = ({ match }) => {
    const history = useHistory()
    const [agentClusterInstalls] = useRecoilValue(waitForAll([agentClusterInstallsState]))
    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === match.params.name && aci.metadata.namespace === match.params.namespace
    )

    const toListView = () => history.push(NavigationPath.clusters)

    if (!agentClusterInstall) {
        return (
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={toListView}>
                            Back to clusters
                        </AcmButton>
                    }
                />
            </Page>
        )
    }
    const toDetails = () =>
        history.push(NavigationPath.clusterDetails.replace(':id', agentClusterInstall.metadata.name))

    return (
        <PageSection variant="light" isFilled>
            <ClusterDeploymentCreateProgress
                agentClusterInstall={agentClusterInstall}
                toDetails={toDetails}
                toListView={toListView}
            />
        </PageSection>
    )
}

export default ClusterCreateProgress
