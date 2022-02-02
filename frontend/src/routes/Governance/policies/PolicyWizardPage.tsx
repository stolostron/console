/* Copyright Contributors to the Open Cluster Management project */
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { namespacesState } from '../../../atoms'
import { NavigationPath } from '../../../NavigationPath'
import { createResources, IResource } from '../../../resources'

export function PolicyWizardPage() {
    const [namespaces] = useRecoilState(namespacesState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    const history = useHistory()
    return (
        <PolicyWizard
            namespaces={namespaceNames}
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(resources) =>
                createResources(resources as IResource[]).then((error) => {
                    history.push(NavigationPath.policies)
                    return error
                })
            }
        />
    )
}
