/* Copyright Contributors to the Open Cluster Management project */
import { EditMode } from '@patternfly-labs/react-form-wizard'
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClusterSetsState,
    namespacesState,
    placementBindingsState,
    placementRulesState,
    placementsState,
    policiesState,
    policySetsState,
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PlacementKind, PlacementRuleKind, PolicySetKind, updateResources } from '../../../resources'

export function EditPolicySet() {
    const { t } = useTranslation()
    const history = useHistory()
    const [policySets] = useRecoilState(policySetsState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [policies] = useRecoilState(policiesState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [clusterSets] = useRecoilState(managedClusterSetsState)
    const params: { namespace?: string; name?: string } = useParams()
    const [resources, setResources] = useState<IResource[]>()
    useEffect(() => {
        const policySet = policySets.find(
            (policySet) => policySet.metadata.namespace == params.namespace && policySet.metadata.name === params.name
        )
        if (policySet === undefined) {
            history.push(NavigationPath.policySets)
            return
        }
        const policySetPlacementBindings = placementBindings
            .filter((placementBinding) => placementBinding.metadata.namespace === policySet.metadata.namespace)
            .filter((placementBinding) => placementBinding.subjects?.find((subject) => subject.kind === PolicySetKind))
            .filter((placementBinding) =>
                placementBinding.subjects?.find((subject) => subject.name === policySet.metadata.name)
            )
        const policySetPlacements = placements
            .filter((placement) => placement.metadata.namespace === policySet.metadata.namespace)
            .filter((placement) =>
                policySetPlacementBindings.find(
                    (placementBinding) =>
                        placementBinding.placementRef.kind === PlacementKind &&
                        placementBinding.placementRef.name === placement.metadata.name
                )
            )
        const policySetPlacementRules = placementRules
            .filter((placementRule) => placementRule.metadata.namespace === policySet.metadata.namespace)
            .filter((placementRule) =>
                policySetPlacementBindings.find(
                    (placementBinding) =>
                        placementBinding.placementRef.kind === PlacementRuleKind &&
                        placementBinding.placementRef.name === placementRule.metadata.name
                )
            )
        setResources([policySet, ...policySetPlacements, ...policySetPlacementRules, ...policySetPlacementBindings])
    }, [])

    if (resources === undefined) {
        return <LoadingPage />
    }

    return (
        <PolicySetWizard
            title={t('Edit policy set')}
            editMode={EditMode.Edit}
            namespaces={namespaceNames}
            policies={policies}
            clusterSets={clusterSets}
            onCancel={() => history.push(NavigationPath.policySets)}
            resources={resources}
            onSubmit={(resources) =>
                updateResources(resources as IResource[]).then(() => {
                    history.push(NavigationPath.policySets)
                })
            }
        />
    )
}
