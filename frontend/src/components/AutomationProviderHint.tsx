/* Copyright Contributors to the Open Cluster Management project */
import { Alert, AlertVariant, Button, Hint, HintBody, HintFooter } from '@patternfly/react-core'
import { useMemo } from 'react'
import { useSharedAtoms, useRecoilValue } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { isAnsibleOperatorInstalled } from '../resources'
import { Link } from 'react-router-dom'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'

export function AutomationProviderHint(props: { component: 'hint' | 'alert'; className?: string }) {
    const { component, className } = props
    const { subscriptionOperatorsState } = useSharedAtoms()
    const subscriptionOperators = useRecoilValue(subscriptionOperatorsState)

    const { t } = useTranslation()

    const isOperatorInstalled = useMemo(
        () => isAnsibleOperatorInstalled(subscriptionOperators),
        [subscriptionOperators]
    )

    const title = t('Operator required')
    const message = t('The Ansible Automation Platform Operator is required to use automation templates.')
    const link = (
        <Link to={'/operatorhub/all-namespaces?keyword=ansible+automation+platform'} target={'_blank'}>
            <Button variant="link" icon={<ExternalLinkAltIcon />} iconPosition="right" isInline>
                {t('Install the operator')}
            </Button>
        </Link>
    )

    return (
        <>
            {!isOperatorInstalled &&
                (component === 'hint' ? (
                    <Hint className={className}>
                        <HintBody>{message}</HintBody>
                        <HintFooter>{link}</HintFooter>
                    </Hint>
                ) : (
                    <Alert
                        className={className}
                        isInline
                        title={title}
                        actionLinks={link}
                        variant={AlertVariant.danger}
                    >
                        {message}
                    </Alert>
                ))}
        </>
    )
}
