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
import { CheckCircleIcon } from '@patternfly/react-icons'
import { global_palette_green_500 as okColor } from '@patternfly/react-tokens/dist/js/global_palette_green_500'

const { shouldShowClusterInstallationProgress } = CIM

const GreenCheckCircleIcon: React.FC = (props) => <CheckCircleIcon {...props} color={okColor.value} />

type ClusterCreateProgressProps = RouteComponentProps<{ namespace: string; name: string }>

const ClusterCreateProgress: React.FC<ClusterCreateProgressProps> = ({ match }) => {
    const history = useHistory()
    const [agentClusterInstalls] = useRecoilValue(waitForAll([agentClusterInstallsState]))
    const agentClusterInstall = agentClusterInstalls.find(
        (aci) => aci.metadata.name === match.params.name && aci.metadata.namespace === match.params.namespace
    )

    if (!agentClusterInstall) {
        return (
            <Page>
                <ErrorPage
                    error={new ResourceError('Not found', 404)}
                    actions={
                        <AcmButton role="link" onClick={() => history.push(NavigationPath.infraEnvironments)}>
                            Back to clusters
                        </AcmButton>
                    }
                />
            </Page>
        )
    }

    const detailsAction = () =>
        history.push(NavigationPath.clusterDetails.replace(':id', agentClusterInstall.metadata.name))
    const listAction = () => history.push(NavigationPath.clusters)

    return (
        <PageSection variant="light" isFilled>
            <Bullseye>
                <EmptyState>
                    {shouldShowClusterInstallationProgress(agentClusterInstall) ? (
                        <>
                            <EmptyStateIcon icon={GreenCheckCircleIcon} />
                            <Title headingLevel="h4" size="lg">
                                Cluster creation success
                            </Title>
                            <EmptyStateBody>
                                <div>This cluster has been successfully created.</div>
                                <div>
                                    Visit the details view to see the progress of the cluster installation process.
                                </div>
                            </EmptyStateBody>
                        </>
                    ) : (
                        <>
                            <EmptyStateIcon icon={Spinner} />
                            <Title headingLevel="h4" size="lg">
                                Cluster creation in progress
                            </Title>
                            <EmptyStateBody>
                                <div>This cluster is in the process of being created.</div>
                                <div>
                                    If you exit this flow you can see it's status in the list view or details page.
                                </div>
                            </EmptyStateBody>
                        </>
                    )}
                    <EmptyStateSecondaryActions>
                        <Button variant="primary" onClick={detailsAction}>
                            Details page
                        </Button>
                        <Button variant="link" onClick={listAction}>
                            List view
                        </Button>
                    </EmptyStateSecondaryActions>
                </EmptyState>
            </Bullseye>
        </PageSection>
    )
}

export default ClusterCreateProgress
