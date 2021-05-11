/* Copyright Contributors to the Open Cluster Management project */

import {
    ButtonVariant,
    Card,
    CardBody,
    CardTitle,
    CardFooter,
    Split,
    SplitItem,
    ActionGroup,
} from '@patternfly/react-core'
import { AcmButton } from '@open-cluster-management/ui-components'
import { Trans, useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { useEffect, useState } from 'react'
import { discoveryConfigState } from '../../../atoms'
import { Link } from 'react-router-dom'
import DiscoveryPng from '../../../components/ACM-Discovery-illus.png'
import { NavigationPath } from '../../../NavigationPath'

export function DiscoveryBanner() {
    const { t } = useTranslation(['discovery'])
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)
    const [dismissed, setDismissed] = useState<Boolean>(false)

    useEffect(() => {
        if (discoveryConfigs.length > 0) {
            dismiss()
        }
    }, [discoveryConfigs])

    function dismiss() {
        localStorage.setItem('DiscoveryBannerDismissed', 'true')
        setDismissed(true)
    }

    if (dismissed) {
        return null
    }

    return (
        <Card key="discoveryBanner">
            <Split hasGutter>
                <SplitItem>
                    <CardBody style={{ width: '200px' }}>
                        <img src={DiscoveryPng} alt="Discovery Icon" id="discoveryIconPng" />
                    </CardBody>
                </SplitItem>
                <SplitItem isFilled>
                    <CardTitle>{t('clusters.banner.header')}</CardTitle>
                    <CardBody>
                        {<Trans i18nKey="discovery:clusters.banner.body" components={{ bold: <strong /> }} />}
                    </CardBody>
                    <CardFooter>
                        <ActionGroup>
                            <Link to={NavigationPath.createDiscovery}>
                                <AcmButton key="enableDiscovery" variant={ButtonVariant.primary}>
                                    {t('discovery.addDiscovery')}
                                </AcmButton>
                            </Link>
                            <AcmButton variant={ButtonVariant.link} onClick={dismiss} style={{ marginLeft: '16px' }}>
                                {t('clusters.banner.dismiss')}
                            </AcmButton>
                        </ActionGroup>
                    </CardFooter>
                </SplitItem>
            </Split>
        </Card>
    )
}
