import React from 'react'
import { AcmDropdown } from '@open-cluster-management/ui-components'
import { useTranslation } from 'react-i18next'
import { getSecret, unpackSecret } from '../../../../resources/secret'
import { createDownloadFile } from '../../../../lib/utils'
import { Cluster } from '../../../../lib/get-cluster'

export function DownloadConfigurationDropdown(props: { cluster?: Cluster }) {
    const { t } = useTranslation(['cluster'])
    const { cluster } = props

    const downloadConfig = async (id: string) => {
        /* istanbul ignore next */
        const map: Record<string, string> = {
            'install-config.yaml': cluster?.hiveSecrets?.installConfig ?? '',
            'kubeconfig': cluster?.hiveSecrets?.kubeconfig ?? ''
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
        } catch(err) {
            console.error(err)
        }
    }

    if (cluster?.hiveSecrets) {
        const dropdownItems = [
            { id: 'install-config.yaml', text: 'install-config' },
            { id: 'kubeconfig', text: 'kubeconfig' }
        ]
        return (
            <AcmDropdown dropdownItems={dropdownItems} onSelect={(id: string) => downloadConfig(id)} text={t('configuration.download')} id='download-configuration' />
        )

    } else {
        return null
    }
}
