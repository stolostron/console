/* Copyright Contributors to the Open Cluster Management project */

import { ActionGroup, ButtonVariant, Card, CardBody, CardFooter, CardTitle, StackItem } from '@patternfly/react-core'
import { useState } from 'react'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../lib/doc-util'
import { AcmButton } from '../../../ui-components'

const localStorageKey = `HostInventoryBannerDismissed`
// t('Hosts are discovered and stored in infrastructure environments. You can manage your host inventory with infrastructure environments which allow to set the same configurations for all hosts that it contains.')
export const description =
    'Hosts are discovered and stored in infrastructure environments. You can manage your host inventory with infrastructure environments which allow to set the same configurations for all hosts that it contains.'

export const HostInventoryBanner = () => {
    const { t } = useTranslation()
    const [dismissed, setDismissed] = useState(() => localStorage.getItem(localStorageKey) === 'true')

    if (dismissed) {
        return null
    }

    function dismiss() {
        localStorage.setItem(localStorageKey, 'true')
        setDismissed(true)
    }

    return (
        <StackItem>
            <Card>
                <CardTitle>About host inventory</CardTitle>
                <CardBody>{t(description)}</CardBody>
                <CardFooter>
                    <ActionGroup>
                        <AcmButton variant={ButtonVariant.secondary} onClick={dismiss}>
                            {t('Got it, thanks!')}
                        </AcmButton>
                        <AcmButton variant={ButtonVariant.link}>
                            <a href={DOC_LINKS.INFRASTRUCTURE_EVIRONMENTS} target="_blank">
                                {t('View documentation')} <ExternalLinkAltIcon />
                            </a>
                        </AcmButton>
                    </ActionGroup>
                </CardFooter>
            </Card>
        </StackItem>
    )
}
