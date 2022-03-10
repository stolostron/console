/* Copyright Contributors to the Open Cluster Management project */

// import { Button } from "@patternfly/react-core"
import { Button, Tooltip } from '@patternfly/react-core'
import { AcmDrawerContext } from '@stolostron/ui-components'
import { useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { canUser } from '../../../lib/rbac-util'
import { Policy, PolicyDefinition } from '../../../resources'
import { PolicyAutomationSidebar } from './PolicyAutomationSidebar'

export function PolicyAutomationButton(props: { policy: Policy }) {
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [userAccess, setUserAccess] = useState<boolean | undefined>(false)
    const { policy } = props

    // TODO - If policy has automation render a launch to automation
    //    const policyAutomation = _.get(item, 'policyAutomation')
    //    if (policyAutomation) {
    //        const automationName = _.get(policyAutomation, 'metadata.name')
    //        return this.automationLaunch(item, automationName, automationAccess, locale, refetch)
    //    }
    //
    // No automation render automation configure

    useEffect(() => {
        const canUpdateResource = canUser('create', PolicyDefinition)

        canUpdateResource.promise
            .then((result) => setUserAccess(result.status?.allowed!))
            .catch((err) => console.error(err))
        return () => canUpdateResource.abort()
    }, [policy])

    function handleAutomationDrawer(event: React.MouseEvent) {
        if (!event.currentTarget.contains(event.target as Node)) {
            return
        }
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => setDrawerContext(undefined),
            panelContent: <PolicyAutomationSidebar policy={policy} /*panelType={}*/ />,
            panelContentProps: { defaultSize: '40%' },
            isInline: true,
            isResizable: true,
        })
    }

    function automationConfigure() {
        const tooltipRef = useRef()
        return (
            <>
                <Tooltip
                    content={
                        userAccess
                            ? t('Configure automation for this policy')
                            : t(
                                  'You are not authorized to complete this action. See your cluster administrator for role-based access information.'
                              )
                    }
                    reference={tooltipRef}
                />
                <Button
                    innerRef={tooltipRef}
                    isAriaDisabled={!userAccess}
                    className="automationButton"
                    isSmall
                    variant="link"
                    onClick={handleAutomationDrawer}
                >
                    {t('Configure')}
                </Button>
            </>
        )
    }

    return automationConfigure()
}
