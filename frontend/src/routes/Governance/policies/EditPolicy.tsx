/* Copyright Contributors to the Open Cluster Management project */
import { EditMode, useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    channelsState,
    helmReleaseState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    subscriptionsState,
    usePolicies,
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { useSearchParams } from '../../../lib/search'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicyKind, reconcileResources } from '../../../resources'
import {
    getPlacementBindingsForResource,
    getPlacementsForResource,
    resolveExternalStatus,
    resolveSource,
} from '../common/util'
import schema from './schema.json'

export function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    return (
        <SyncEditor
            editorTitle={'Policy YAML'}
            variant="toolbar"
            resources={resources}
            schema={schema}
            filters={['*.metadata.managedFields']}
            onEditorChange={(changes: { resources: any[] }): void => {
                update(changes?.resources)
            }}
        />
    )
}

function getWizardSyncEditor() {
    return <WizardSyncEditor />
}

export function EditPolicy() {
    const { t } = useTranslation()
    const toast = useContext(AcmToastContext)
    const params: { namespace?: string; name?: string } = useParams()
    const history = useHistory()
    const policies = usePolicies()
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [clusterSets] = useRecoilState(managedClusterSetsState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(
        () =>
            namespaces
                .filter(
                    (namespace) => !namespace.metadata.labels?.['cluster.open-cluster-management.io/managedCluster']
                )
                .map((namespace) => namespace.metadata.name ?? ''),
        [namespaces]
    )
    const [existingResources, setExistingResources] = useState<IResource[]>()
    const [helmReleases] = useRecoilState(helmReleaseState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [gitSource, setGitSource] = useState('')
    const searchParams = useSearchParams()

    useEffect(() => {
        const policy = policies.find(
            (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
        )
        if (policy === undefined) {
            history.push(NavigationPath.policies)
            return
        }
        const policyPlacementBindings = getPlacementBindingsForResource(policy, placementBindings)
        const policyPlacements = getPlacementsForResource(policy, policyPlacementBindings, placements)
        const policyPlacementRules = getPlacementsForResource(policy, policyPlacementBindings, placementRules)

        const isExternal = resolveExternalStatus(policy)
        if (isExternal) {
            const policySource = resolveSource(policy, helmReleases, channels, subscriptions)
            setGitSource(policySource?.pathName ?? '')
        }

        setExistingResources([policy, ...policyPlacements, ...policyPlacementRules, ...policyPlacementBindings])
    }, [
        channels,
        helmReleases,
        history,
        params.name,
        params.namespace,
        placementBindings,
        placementRules,
        placements,
        policies,
        subscriptions,
        t,
    ])

    if (existingResources === undefined) {
        return <LoadingPage />
    }

    return (
        <PolicyWizard
            title={t('Edit policy')}
            policies={policies}
            clusters={managedClusters}
            placements={placements}
            yamlEditor={getWizardSyncEditor}
            namespaces={namespaceNames}
            placementRules={placementRules}
            clusterSets={clusterSets}
            clusterSetBindings={clusterSetBindings}
            editMode={EditMode.Edit}
            resources={existingResources}
            gitSource={gitSource}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return reconcileResources(resources, existingResources).then(() => {
                    const policy = resources.find((resource) => resource.kind === PolicyKind)
                    if (policy) {
                        toast.addAlert({
                            title: t('Policy updated'),
                            message: t('{{name}} was successfully updated.', { name: policy.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                        if (searchParams.get('context') === 'policies') {
                            history.push(NavigationPath.policies)
                        } else {
                            history.push(
                                NavigationPath.policyDetails
                                    .replace(':namespace', policy.metadata?.namespace ?? '')
                                    .replace(':name', policy.metadata?.name ?? '')
                            )
                        }
                    }
                })
            }}
            onCancel={() => {
                if (searchParams.get('context') === 'policies') {
                    history.push(NavigationPath.policies)
                } else {
                    const policy = existingResources.find((resource) => resource.kind === PolicyKind)
                    if (policy) {
                        history.push(
                            NavigationPath.policyDetails
                                .replace(':namespace', policy.metadata?.namespace ?? '')
                                .replace(':name', policy.metadata?.name ?? '')
                        )
                    } else {
                        history.push(NavigationPath.policies)
                    }
                }
            }}
        />
    )
}
