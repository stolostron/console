/* Copyright Contributors to the Open Cluster Management project */
import { EditMode } from '@patternfly-labs/react-form-wizard'
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClusterSetBindingsState,
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
    const toast = useContext(AcmToastContext)
    const params: { namespace?: string; name?: string } = useParams()
    const history = useHistory()
    const [policies] = useRecoilState(policiesState)
    const [policySets] = useRecoilState(policySetsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
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
            policies={policies}
            namespaces={namespaceNames}
            placements={placements}
            placementRules={placementRules}
            clusterSetBindings={clusterSetBindings}
            editMode={EditMode.Edit}
            resources={resources}
            onSubmit={(resources) =>
                updateResources(resources as IResource[]).then(() => {
                    toast.addAlert({
                        title: t('Policy set updated'),
                        message: t('{{name}} was successfully updated.', { name: 'TODO' }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.policySets)
                })
            }
            onCancel={() => history.push(NavigationPath.policySets)}
        />
    )
}
