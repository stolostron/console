/* Copyright Contributors to the Open Cluster Management project */

import { ArgoWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Argo/ArgoWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import moment from 'moment-timezone'
import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationSetsState,
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    managedClustersState,
    namespacesState,
    placementsState,
    secretsState,
} from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
    ApplicationSetKind,
    createResources,
    getGitChannelBranches,
    getGitChannelPaths,
    IResource,
    unpackProviderConnection,
} from '../../../resources'

export default function CreateArgoApplicationSetPage() {
    return <CreateApplicationArgo />
}

export function CreateApplicationArgo() {
    const { t } = useTranslation()
    const history = useHistory()
    const [applicationSets] = useRecoilState(applicationSetsState)
    const toast = useContext(AcmToastContext)
    const [placements] = useRecoilState(placementsState)
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
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )
    const availableAnsibleCredentials = ansibleCredentials
        .map((ansibleCredential) => ansibleCredential.metadata.name)
        .filter(isType)

    const currentTimeZone = moment.tz.guess(true)
    const timeZones = currentTimeZone
        ? [currentTimeZone, ...moment.tz.names().filter((e) => e !== currentTimeZone)]
        : moment.tz.names()

    return (
        <ArgoWizard
            addClusterSets={NavigationPath.clusterSets}
            ansibleCredentials={availableAnsibleCredentials}
            argoServers={availableArgoNS}
            namespaces={availableNamespace}
            applicationSets={applicationSets}
            placements={placements}
            clusters={managedClusters}
            clusterSetBindings={managedClusterSetBindings}
            channels={channels}
            getGitRevisions={getGitChannelBranches}
            getGitPaths={getGitChannelPaths}
            onCancel={() => history.push(NavigationPath.applications)}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return createResources(resources).then(() => {
                    const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
                    if (applicationSet) {
                        toast.addAlert({
                            title: t('Application set created'),
                            message: t('{{name}} was successfully created.', { name: applicationSet.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(NavigationPath.applications)
                })
            }}
            timeZones={timeZones}
        />
    )
}
