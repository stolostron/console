/* Copyright Contributors to the Open Cluster Management project */
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { managedClusterSetBindingsState, namespacesState, policiesState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { createResources, IResource } from '../../../resources'

export function CreatePolicySet() {
    const { t } = useTranslation()
    const history = useHistory()
    const [namespaces] = useRecoilState(namespacesState)
    const [policies] = useRecoilState(policiesState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    return (
        <PolicySetWizard
            title={t('Create policy set')}
            namespaces={namespaceNames}
            policies={policies}
            clusterSetBindings={clusterSetBindings}
            onCancel={() => history.push(NavigationPath.policySets)}
            onSubmit={(resources) =>
                createResources(resources as IResource[]).then(() => {
                    history.push(NavigationPath.policySets)
                })
            }
        />
    )
}
