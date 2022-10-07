/* Copyright Contributors to the Open Cluster Management project */

import { createDownloadFile, getSecret, unpackSecret } from '../../../../../resources'
import { AcmDropdown } from '../../../../../ui-components'
import { useContext } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'

export function DownloadConfigurationDropdown(props: { canGetSecret: boolean }) {
    const { cluster } = useContext(ClusterContext)
    const { t } = useTranslation()

    const downloadConfig = async (id: string) => {
        /* istanbul ignore next */
        const map: { [key: string]: string } = {
            'install-config.yaml': cluster?.hive.secrets?.installConfig ?? '',
            kubeconfig: cluster?.kubeconfig ?? '',
        }
        /* istanbul ignore next */
        const namespace = cluster?.namespace ?? ''
        /* istanbul ignore next */
        const clusterName = cluster?.name ?? ''
        try {
            const secret = await getSecret({ name: map[id], namespace }).promise
            const { stringData } = unpackSecret(secret)
            const extention = id === 'kubeconfig' ? '.yaml' : ''
            /* istanbul ignore next */
            const yaml = stringData?.[`${id}`] ?? ''
            createDownloadFile(`${clusterName}-${id}${extention}`, yaml)
        } catch (err) {
            console.error(err)
        }
    }

    const dropdownItems = []
    cluster?.hive.secrets?.installConfig &&
        dropdownItems.push({
            id: 'install-config.yaml',
            text: 'install-config',
            isAriaDisabled: !props.canGetSecret,
            tooltip: !props.canGetSecret ? t('rbac.unauthorized') : undefined,
        })
    cluster?.kubeconfig &&
        dropdownItems.push({
            id: 'kubeconfig',
            text: 'kubeconfig',
            isAriaDisabled: !props.canGetSecret,
            tooltip: !props.canGetSecret ? t('rbac.unauthorized') : undefined,
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
}
