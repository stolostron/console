/* Copyright Contributors to the Open Cluster Management project */
import { EditMode } from '@patternfly-labs/react-form-wizard'
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
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
} from '../../../atoms'
import { LoadingPage } from '../../../components/LoadingPage'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, updateResources } from '../../../resources'
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
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [resources, setResources] = useState<IResource[]>()
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
        setResources([policy, ...policyPlacements, ...policyPlacementRules, ...policyPlacementBindings])
    }, [])

    if (resources === undefined) {
        return <LoadingPage />
    }

    return (
        <PolicyWizard
            title={t('Edit policy')}
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
                        title: t('Policy updated'),
                        // message: t('{{name}} was successfully updated.', { name: 'TODO' }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.policies)
                })
            }
            onCancel={() => history.push(NavigationPath.policies)}
        />
    )
}
