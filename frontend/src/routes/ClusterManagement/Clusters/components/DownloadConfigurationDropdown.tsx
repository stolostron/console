/* Copyright Contributors to the Open Cluster Management project */

import { AcmDropdown } from '@open-cluster-management/ui-components'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { createDownloadFile } from '../../../../lib/utils'
import { getSecret, unpackSecret } from '../../../../resources/secret'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export function DownloadConfigurationDropdown(props: { canGetSecret: boolean }) {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation(['cluster', 'common'])

    const downloadConfig = async (id: string) => {
        /* istanbul ignore next */
        const map: { [key: string]: string } = {
            'install-config.yaml': cluster?.hive.secrets?.installConfig ?? '',
            kubeconfig: cluster?.hive.secrets?.kubeconfig ?? '',
        }
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const clusterName = cluster?.name ?? ''
        try {
            const secret = await getSecret({ name: map[id], namespace }).promise
            const { stringData } = unpackSecret(secret)
            /* istanbul ignore next */
            const yaml = stringData?.[`${id}`] ?? ''
            createDownloadFile(`${clusterName}-${id}.yaml`, yaml)
        } catch (err) {
            console.error(err)
        }
    }

    if (cluster?.hive.secrets?.installConfig || cluster?.hive.secrets?.kubeconfig) {
        const dropdownItems = []
        cluster?.hive.secrets?.installConfig &&
            dropdownItems.push({
                id: 'install-config.yaml',
                text: 'install-config',
                isDisabled: !props.canGetSecret,
                tooltip: !props.canGetSecret ? t('common:rbac.unauthorized') : undefined,
            })
        cluster?.hive.secrets?.kubeconfig &&
            dropdownItems.push({
                id: 'kubeconfig',
                text: 'kubeconfig',
                isDisabled: !props.canGetSecret,
                tooltip: !props.canGetSecret ? t('common:rbac.unauthorized') : undefined,
            })
        return (
            <AcmDropdown
                isPlain={true}
                dropdownItems={dropdownItems}
                onSelect={(id: string) => downloadConfig(id)}
                text={t('configuration.download')}
                id="download-configuration"
            />
        )
    } else {
        return null
    }
}
