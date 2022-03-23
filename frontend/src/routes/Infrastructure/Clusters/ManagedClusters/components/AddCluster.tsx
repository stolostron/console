/* Copyright Contributors to the Open Cluster Management project */
import { AcmButton, AcmDropdown } from '@stolostron/ui-components'
import { ActionList, ActionListItem, Bullseye, TextContent } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { Link, useHistory } from 'react-router-dom'
import { canUser } from '../../../../../lib/rbac-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { ManagedClusterDefinition } from '../../../../../resources'
import { DOC_LINKS, viewDocumentation } from '../../../../../lib/doc-util'

export function AddCluster(props: { type: 'button' | 'dropdown'; buttonType?: 'primary' | 'link' }) {
    const { t } = useTranslation()
    const history = useHistory()

    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
    useEffect(() => {
        const canCreateManagedCluster = canUser('create', ManagedClusterDefinition)
        canCreateManagedCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateManagedCluster.abort()
    }, [])

    if (props.type === 'button') {
        return (
            <div>
                <Bullseye>
                    <ActionList>
                        <ActionListItem>
                            <AcmButton
                                component={Link}
                                isDisabled={!canCreateCluster}
                                tooltip={t('rbac.unauthorized')}
                                variant={props.buttonType ?? 'primary'}
                                to={NavigationPath.createCluster}
                            >
                                {t('managed.createCluster')}
                            </AcmButton>
                        </ActionListItem>
                        <ActionListItem>
                            <AcmButton
                                component={Link}
                                isDisabled={!canCreateCluster}
                                tooltip={t('rbac.unauthorized')}
                                variant={props.buttonType ?? 'primary'}
                                to={NavigationPath.importCluster}
                            >
                                {t('managed.importCluster')}
                            </AcmButton>
                        </ActionListItem>
                    </ActionList>
                </Bullseye>
                <TextContent>{viewDocumentation(DOC_LINKS.CLUSTERS, t)}</TextContent>
            </div>
        )
    } else {
        const onSelect = (id: string) => {
            switch (id) {
                case 'create-cluster':
                    history.push(NavigationPath.createCluster)
                    break
                case 'import-cluster':
                    history.push(NavigationPath.importCluster)
                    break
            }
        }
        return (
            <div>
                <AcmDropdown
                    dropdownItems={[
                        {
                            id: 'create-cluster',
                            text: t('managed.createCluster'),
                            isAriaDisabled: !canCreateCluster,
                            tooltip: !canCreateCluster ? t('rbac.unauthorized') : '',
                        },
                        {
                            id: 'import-cluster',
                            text: t('managed.importCluster'),
                            isAriaDisabled: !canCreateCluster,
                            tooltip: !canCreateCluster ? t('rbac.unauthorized') : '',
                        },
                    ]}
                    text={t('managed.addCluster')}
                    onSelect={onSelect}
                    id="cluster-actions"
                    isKebab={false}
                    isPrimary={true}
                />
                <TextContent>{viewDocumentation(DOC_LINKS.CLUSTERS, t)}</TextContent>
            </div>
        )
    }
}
