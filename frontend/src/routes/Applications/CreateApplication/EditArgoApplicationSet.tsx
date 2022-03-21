/* Copyright Contributors to the Open Cluster Management project */

import { ArgoWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Argo/ArgoWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import moment from 'moment-timezone'
import { useContext, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationSetsState,
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    managedClustersState,
    namespacesState,
    placementDecisionsState,
    placementsState,
    secretsState,
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
    ApplicationSetKind,
    getGitChannelBranches,
    getGitChannelPaths,
    IResource,
    reconcileResources,
    resourceMatchesSelector,
    unpackProviderConnection,
} from '../../../resources'

export function EditArgoApplicationSet() {
    const { t } = useTranslation()
    const history = useHistory()
    const toast = useContext(AcmToastContext)
    const params: { namespace?: string; name?: string } = useParams()
    const [applicationSets] = useRecoilState(applicationSetsState)
    const [placements] = useRecoilState(placementsState)
    const [placementDecisions] = useRecoilState(placementDecisionsState)
    const [gitOpsClusters] = useRecoilState(gitOpsClustersState)
    const [channels] = useRecoilState(channelsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [managedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const providerConnections = secrets.map(unpackProviderConnection)

    const availableArgoNS = gitOpsClusters
        .map((gitOpsCluster) => gitOpsCluster.spec?.argoServer?.argoNamespace)
        .filter(isType)
    const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
    const availableAnsibleCredentials = providerConnections
        .filter(
            (providerConnection) =>
                providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
        )
        .map((ansibleCredential) => ansibleCredential.metadata.name)
        .filter(isType)

    const currentTimeZone = moment.tz.guess(true)
    const timeZones = currentTimeZone
        ? [currentTimeZone, ...moment.tz.names().filter((e) => e !== currentTimeZone)]
        : moment.tz.names()

    const [existingResources, setExistingResources] = useState<IResource[]>()

    useEffect(() => {
        const applicationSet = applicationSets.find(
            (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
        )
        if (applicationSet === undefined) {
            history.push(NavigationPath.applications)
            return
        }
        const applicationSetPlacementDecisions = placementDecisions.filter(
            (placementDecision) =>
                placementDecision.metadata.namespace === applicationSet.metadata.namespace &&
                applicationSet.spec.generators?.find((generator) =>
                    resourceMatchesSelector(placementDecision, generator.clusterDecisionResource?.labelSelector ?? {})
                )
        )

        const applicationSetPlacements = placements.filter(
            (placement) =>
                placement.metadata.namespace === applicationSet.metadata.namespace &&
                applicationSetPlacementDecisions.find((placementDecision) =>
                    placementDecision.metadata.ownerReferences?.find(
                        (ownerReference) =>
                            ownerReference.kind === 'Placement' && ownerReference.name === placement.metadata.name
                    )
                )
        )
        setExistingResources([applicationSet, ...applicationSetPlacements])
    }, [applicationSets, history, params.name, params.namespace, placementDecisions, placements])

    if (existingResources === undefined) {
        return <LoadingPage />
    }

    return (
        <ArgoWizard
            createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
            ansibleCredentials={availableAnsibleCredentials}
            argoServers={availableArgoNS}
            namespaces={availableNamespace}
            applicationSets={applicationSets}
            placements={placements}
            clusters={managedClusters}
            clusterSetBindings={managedClusterSetBindings}
            onCancel={() => history.push(NavigationPath.applications)}
            channels={channels}
            getGitRevisions={getGitChannelBranches}
            getGitPaths={getGitChannelPaths}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return reconcileResources(resources, existingResources).then(() => {
                    const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
                    if (applicationSet) {
                        toast.addAlert({
                            title: t('Application set updated'),
                            message: t('{{name}} was successfully updated.', { name: applicationSet.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(NavigationPath.applications)
                })
            }}
            timeZones={timeZones}
            resources={existingResources}
        />
    )
}
