/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
    ButtonVariant,
    Card,
    CardBody,
    CardTitle,
    CardFooter,
    Split,
    SplitItem,
    ActionGroup,
    StackItem,
    Badge,
} from '@patternfly/react-core'
import { AcmButton } from '@open-cluster-management/ui-components'
import mainIcon from '../../../../../../logos/OnPremiseBannerIcon.svg'

type OnPremisebannerProps = {
    id: string
    hideInfraEnvLink?: boolean
    WrappingComponent?: React.FunctionComponent
    titleKey: string
    textKey: string
    extraButton?: React.ReactElement
}

export function OnPremiseBanner({
    WrappingComponent = StackItem,
    id,
    titleKey,
    extraButton,
    textKey,
}: OnPremisebannerProps) {
    const { t } = useTranslation(['cim'])
    const localStorageKey = `OnPremiseBannerDismissed.${id}`
    const [dismissed, setDismissed] = useState<Boolean>(localStorage.getItem(localStorageKey) === 'true')

    if (dismissed) {
        return null
    }

    function dismiss() {
        localStorage.setItem(localStorageKey, 'true')
        setDismissed(true)
    }

    return (
        <WrappingComponent>
            <Card id={id}>
                <Split hasGutter>
                    <SplitItem>
                        <CardBody style={{ width: '200px' }}>
                            <Badge style={{ float: 'left' }}>New</Badge>
                            <img src={mainIcon} alt="On Premise Banner Icon" id="onPremiseBannerIconPng" />
                        </CardBody>
                    </SplitItem>
                    <SplitItem isFilled>
                        <CardTitle>{<Trans i18nKey={titleKey} components={{ bold: <strong /> }} />}</CardTitle>
                        <CardBody>{<Trans i18nKey={textKey} components={{ bold: <strong /> }} />}</CardBody>
                        <CardFooter>
                            <ActionGroup>
                                {extraButton}
                                <AcmButton variant={ButtonVariant.link} onClick={dismiss} style={{ paddingLeft: 0 }}>
                                    {t('cim.banner.dismiss')}
                                </AcmButton>
                            </ActionGroup>
                        </CardFooter>
                    </SplitItem>
                </Split>
            </Card>
        </WrappingComponent>
    )
}
