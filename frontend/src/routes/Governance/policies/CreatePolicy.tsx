/* Copyright Contributors to the Open Cluster Management project */
import { PolicyWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Policy/PolicyWizard'
import { AcmToastContext } from '@stolostron/ui-components'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    managedClusterSetBindingsState,
    namespacesState,
    placementRulesState,
    placementsState,
    policiesState,
} from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { createResources, IResource } from '../../../resources'

export function CreatePolicy() {
    const { t } = useTranslation()
    const toast = useContext(AcmToastContext)
    const history = useHistory()
    const [policies] = useRecoilState(policiesState)
    const [namespaces] = useRecoilState(namespacesState)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [clusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const namespaceNames = useMemo(() => namespaces.map((namespace) => namespace.metadata.name ?? ''), [namespaces])
    return (
        <PolicyWizard
            title={t('Create policy')}
            policies={policies}
            namespaces={namespaceNames}
            placements={placements}
            placementRules={placementRules}
            clusterSetBindings={clusterSetBindings}
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(resources) =>
                createResources(resources as IResource[]).then((error) => {
                    toast.addAlert({
                        title: t('Policy set created'),
                        message: t('{{name}} was successfully created.', { name: 'TODO' }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(NavigationPath.policies)
                    return error
                })
            }
        />
    )
}
