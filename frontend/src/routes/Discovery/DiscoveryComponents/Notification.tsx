/* Copyright Contributors to the Open Cluster Management project */

import { Alert, AlertVariant, AlertGroup, AlertActionCloseButton } from '@patternfly/react-core'
import { Trans, useTranslation } from 'react-i18next'

import { useState } from 'react'
export function DiscoNotification() {
    const { t } = useTranslation(['discovery'])
    const [closed, setClosed] = useState<Boolean>(false)

    if (!sessionStorage.getItem('DISCOVERY_OP') || closed) {
        return null
    }

    const jsonStr = JSON.parse(sessionStorage.getItem('DISCOVERY_OP')!)

    function closeNotifications() {
        sessionStorage.removeItem('DISCOVERY_OP')
        setClosed(true)
    }

    if (!jsonStr.Operation || !jsonStr.Name) {
        return null
    }

    let title = ''
    switch (jsonStr.Operation) {
        case 'Create':
            title = 'discovery:alert.created.header'
            break
        case 'Update':
            title = 'discovery:alert.updated.header'
            break
        case 'Delete':
            title = 'discovery:alert.deleted.header'
            break
    }

    return (
        <AlertGroup isToast>
            <Alert
                variant={AlertVariant.success}
                title={<Trans i18nKey={title} values={{ credentialName: jsonStr.Name }} />}
                actionClose={
                    <AlertActionCloseButton variantLabel={AlertVariant.default} onClose={() => closeNotifications()} />
                }
            >
                {t('alert.msg')}
            </Alert>
        </AlertGroup>
    )
}
