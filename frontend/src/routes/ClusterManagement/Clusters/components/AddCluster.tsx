import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, Link } from 'react-router-dom'
import { AcmButton, AcmDropdown } from '@open-cluster-management/ui-components'
import { getUserAccess } from '../../../../lib/rbac-util'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { NavigationPath } from '../../../../NavigationPath'

export function AddCluster(props: {
    type: 'button' | 'dropdown'
    buttonType?: 'primary' | 'link'
    buttonSpacing?: boolean
}) {
    const { t } = useTranslation('cluster')
    const history = useHistory()

    const [canCreateCluster, setCanCreateCluster] = useState<boolean>(false)
    useEffect(() => {
        const canCreateCluster = getUserAccess('create', ManagedClusterDefinition)

        canCreateCluster.promise
            .then((result) => setCanCreateCluster(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canCreateCluster.abort()
    }, [])

    if (props.type === 'button') {
        return (
            <>
                <AcmButton
                    component={Link}
                    isDisabled={!canCreateCluster}
                    tooltip={t('common:rbac.unauthorized')}
                    variant={props.buttonType ?? 'primary'}
                    to={NavigationPath.createCluster}
                >
                    {t('managed.createCluster')}
                </AcmButton>
                <AcmButton
                    component={Link}
                    isDisabled={!canCreateCluster}
                    tooltip={t('common:rbac.unauthorized')}
                    variant={props.buttonType ?? 'primary'}
                    to={NavigationPath.importCluster}
                    style={{ marginLeft: props.buttonSpacing ? '16px' : undefined }}
                >
                    {t('managed.importCluster')}
                </AcmButton>
            </>
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
            <AcmDropdown
                dropdownItems={[
                    {
                        id: 'create-cluster',
                        text: t('managed.createCluster'),
                        isDisabled: !canCreateCluster,
                        tooltip: !canCreateCluster ? t('common:rbac.unauthorized') : '',
                    },
                    {
                        id: 'import-cluster',
                        text: t('managed.importCluster'),
                        isDisabled: !canCreateCluster,
                        tooltip: !canCreateCluster ? t('common:rbac.unauthorized') : '',
                    },
                ]}
                text={t('managed.addCluster')}
                onSelect={onSelect}
                id="cluster-actions"
                isKebab={false}
                isPrimary={true}
            />
        )
    }
}
