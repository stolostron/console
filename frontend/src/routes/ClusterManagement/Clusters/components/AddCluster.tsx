/* Copyright Contributors to the Open Cluster Management project */
import { AcmButton, AcmDropdown } from '@open-cluster-management/ui-components'
import { Bullseye, Split, SplitItem } from '@patternfly/react-core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { canUser } from '../../../../lib/rbac-util'
import { NavigationPath } from '../../../../NavigationPath'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'

export function AddCluster(props: { type: 'button' | 'dropdown'; buttonType?: 'primary' | 'link' }) {
    const { t } = useTranslation('cluster')
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
            <Bullseye>
                <Split hasGutter>
                    <SplitItem>
                        <AcmButton
                            component={Link}
                            isDisabled={!canCreateCluster}
                            tooltip={t('common:rbac.unauthorized')}
                            variant={props.buttonType ?? 'primary'}
                            to={NavigationPath.createCluster}
                        >
                            {t('managed.createCluster')}
                        </AcmButton>
                    </SplitItem>
                    <SplitItem>
                        <AcmButton
                            component={Link}
                            isDisabled={!canCreateCluster}
                            tooltip={t('common:rbac.unauthorized')}
                            variant={props.buttonType ?? 'primary'}
                            to={NavigationPath.importCluster}
                        >
                            {t('managed.importCluster')}
                        </AcmButton>
                    </SplitItem>
                </Split>
            </Bullseye>
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
