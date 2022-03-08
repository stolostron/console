/* Copyright Contributors to the Open Cluster Management project */
import { EditMode } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClusterSetBindingsState,
    managedClustersState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    policiesState,
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicyKind, reconcileResources } from '../../../resources'
import { getPlacementBindingsForResource, getPlacementsForResource } from '../common/util'

export function EditPolicy() {
    const { t } = useTranslation()
    const toast = useContext(AcmToastContext)
    const params: { namespace?: string; name?: string } = useParams()
    const history = useHistory()
    const [policies] = useRecoilState(policiesState)
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [existingResources, setExistingResources] = useState<IResource[]>()

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
        setExistingResources([policy, ...policyPlacements, ...policyPlacementRules, ...policyPlacementBindings])
    }, [])

    if (existingResources === undefined) {
        return <LoadingPage />
    }

    return (
        <PolicyWizard
            title={t('Edit policy')}
            policies={policies}
            clusters={managedClusters}
            placements={placements}
            namespaces={namespaceNames}
            placementRules={placementRules}
            clusterSetBindings={clusterSetBindings}
            editMode={EditMode.Edit}
            resources={existingResources}
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
                    }
                    history.push(NavigationPath.policySets)
                })
            }}
            onCancel={() => history.push(NavigationPath.policies)}
        />
    )
}
