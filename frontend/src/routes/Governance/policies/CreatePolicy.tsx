/* Copyright Contributors to the Open Cluster Management project */
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
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
import { IResource, PolicyKind, reconcileResources } from '../../../resources'

export function CreatePolicy() {
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
        <PolicyWizard
            title={t('Create policy')}
            policies={policies}
            clusters={managedClusters}
            namespaces={namespaceNames}
            placements={placements}
            placementRules={placementRules}
            clusterSetBindings={clusterSetBindings}
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return reconcileResources(resources, []).then(() => {
                    const policy = resources.find((resource) => resource.kind === PolicyKind)
                    if (policy) {
                        toast.addAlert({
                            title: t('Policy created'),
                            message: t('{{name}} was successfully created.', { name: policy.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(NavigationPath.policies)
                })
            }}
        />
    )
}
