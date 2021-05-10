/* Copyright Contributors to the Open Cluster Management project */

import { Secret } from '../../../resources/secret'
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
import { AcmButton, Provider } from '@open-cluster-management/ui-components'
import { Trans, useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { useEffect, useState } from 'react'
import { secretsState, discoveryConfigState } from '../../../atoms'
import { Link } from 'react-router-dom'
import DiscoveryPng from '../../../components/ACM-Discovery-illus.png'
import { NavigationPath } from '../../../NavigationPath'

export function DiscoveryBanner() {
    const { t } = useTranslation(['discovery'])
    const [secrets] = useRecoilState(secretsState)
    const [discoveryConfigs] = useRecoilState(discoveryConfigState)
    const [RHOCMCredentials, setRHOCMsCredentials] = useState<Secret[]>([])
    const [dismissed, setDismissed] = useState<Boolean>(false)

    useEffect(() => {
        const rhocmCredentials: Secret[] = []
        secrets.forEach((credential) => {
            const labels = credential.metadata.labels!['cluster.open-cluster-management.io/provider']
            if (labels === Provider.redhatcloud) {
                rhocmCredentials.push(credential)
            }
        })
        setRHOCMsCredentials(rhocmCredentials)
    }, [secrets])

    useEffect(() => {
        if (discoveryConfigs.length > 0) {
            dismiss()
        }
    }, [discoveryConfigs])

    function dismiss() {
        localStorage.setItem('DiscoveryBannerDismissed', 'true')
        setDismissed(true)
    }

    let Msg: React.ReactNode = null
    switch (RHOCMCredentials.length) {
        case 1:
            Msg = (
                <Trans
                    i18nKey={'discovery:clusters.banner.body.single'}
                    components={{ bold: <strong /> }}
                    values={{ credentialName: RHOCMCredentials[0].metadata.name }}
                />
            )
            break
        default:
            Msg = (
                <Trans
                    i18nKey={'discovery:clusters.banner.body.plural'}
                    components={{ bold: <strong /> }}
                    values={{ credentialsTotal: RHOCMCredentials.length }}
                />
            )
    }

    if (dismissed || RHOCMCredentials.length === 0) {
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
                    <CardBody>{Msg}</CardBody>
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
