/* Copyright Contributors to the Open Cluster Management project */
import { EditMode } from '@patternfly-labs/react-form-wizard'
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
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
    policySetsState,
    usePolicies,
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicySetKind, reconcileResources } from '../../../resources'
import { getPlacementBindingsForResource, getPlacementsForResource } from '../common/util'

export function EditPolicySet() {
    const { t } = useTranslation()
    const toast = useContext(AcmToastContext)
    const params: { namespace?: string; name?: string } = useParams()
    const history = useHistory()
    const policies = usePolicies()
    const [policySets] = useRecoilState(policySetsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [existingResources, setExistingResources] = useState<IResource[]>()
    useEffect(() => {
        const policySet = policySets.find(
            (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
        )
        if (policySet === undefined) {
            history.push(NavigationPath.policySets)
            return
        }
        const policySetPlacementBindings = getPlacementBindingsForResource(policySet, placementBindings)
        const policySetPlacements = getPlacementsForResource(policySet, policySetPlacementBindings, placements)
        const policySetPlacementRules = getPlacementsForResource(policySet, policySetPlacementBindings, placementRules)
        setExistingResources([
            policySet,
            ...policySetPlacements,
            ...policySetPlacementRules,
            ...policySetPlacementBindings,
        ])
    }, [history, params.name, params.namespace, placementBindings, placementRules, placements, policySets])

    if (existingResources === undefined) {
        return <LoadingPage />
    }

    return (
        <PolicySetWizard
            title={t('Edit policy set')}
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
                    const policySet = resources.find((resource) => resource.kind === PolicySetKind)
                    if (policySet) {
                        toast.addAlert({
                            title: t('Policy set updated'),
                            message: t('{{name}} was successfully updated.', { name: policySet.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(NavigationPath.policySets)
                })
            }}
            onCancel={() => history.push(NavigationPath.policySets)}
        />
    )
}
