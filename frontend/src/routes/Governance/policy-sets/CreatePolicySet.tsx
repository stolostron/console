/* Copyright Contributors to the Open Cluster Management project */
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClusterSetBindingsState,
    managedClustersState,
    namespacesState,
    placementRulesState,
    placementsState,
    usePolicies,
} from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, PolicySetKind, reconcileResources } from '../../../resources'

export function CreatePolicySet() {
    const { t } = useTranslation()
    const toast = useContext(AcmToastContext)
    const history = useHistory()
    const policies = usePolicies()
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    return (
        <PolicySetWizard
            title={t('Create policy set')}
            policies={policies}
            clusters={managedClusters}
            placements={placements}
            namespaces={namespaceNames}
            placementRules={placementRules}
            clusterSetBindings={clusterSetBindings}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return reconcileResources(resources, []).then(() => {
                    const policySet = resources.find((resource) => resource.kind === PolicySetKind)
                    if (policySet) {
                        toast.addAlert({
                            title: t('Policy set created'),
                            message: t('{{name}} was successfully created.', { name: policySet.metadata?.name }),
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
