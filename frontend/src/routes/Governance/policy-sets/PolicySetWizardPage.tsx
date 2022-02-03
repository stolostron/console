/* Copyright Contributors to the Open Cluster Management project */
import { PolicySetWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicySet/PolicySetWizard'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { managedClusterSetsState, namespacesState, policiesState } from '../../../atoms'
import { NavigationPath } from '../../../NavigationPath'
import { createResources, IResource } from '../../../resources'

export function PolicySetWizardPage() {
    const history = useHistory()
    const [namespaces] = useRecoilState(namespacesState)
    const [policies] = useRecoilState(policiesState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const [clusterSets] = useRecoilState(managedClusterSetsState)
    return (
        <PolicySetWizard
            namespaces={namespaceNames}
            policies={policies}
            clusterSets={clusterSets}
            onCancel={() => history.push(NavigationPath.policySets)}
            onSubmit={(resources) =>
                createResources(resources as IResource[]).then((error) => {
                    history.push(NavigationPath.policySets)
                    return error
                })
            }
        />
    )
}
