/* Copyright Contributors to the Open Cluster Management project */
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
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
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'

export function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    return (
        <SyncEditor
            variant="toolbar"
            resources={resources}
            hideCloseButton={true}
            // schema={schema}
            onEditorChange={(changes: { resources: any[]; errors: any[]; changes: any[] }): void => {
                update(changes?.resources)
            }}
        />
    )
}

function getWizardSyncEditor() {
    return <WizardSyncEditor />
}

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
            yamlEditor={getWizardSyncEditor}
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
