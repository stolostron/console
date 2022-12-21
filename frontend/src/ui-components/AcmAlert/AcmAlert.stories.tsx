/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core'
import { Meta } from '@storybook/react'
import { useCallback, useContext, useEffect } from 'react'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../AcmPage/AcmPage'
import { AcmAlertContext, AcmAlertGroup } from './AcmAlert'
import { AcmToastContext, AcmToastProvider, AcmToastGroup } from './AcmToast'

const meta: Meta = {
    title: 'Alert Group',
    component: AcmAlertGroup,
    includeStories: ['AlertGroup', 'ToastGroup'],
}
export default meta

export function AlertGroup() {
    return (
        <AcmPage header={<AcmPageHeader title="AcmAlertGroup" />}>
            <AcmPageContent id="alerts">
                <PageSection variant="light">
                    <AlertGroupStory />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function ToastGroup() {
    return (
        <AcmPage header={<AcmPageHeader title="AcmAlertGroup" />}>
            <AcmToastProvider>
                <AcmToastGroup />
                <AcmPageContent id="alerts">
                    <PageSection variant="light">
                        <AlertGroupStory useToast />
                    </PageSection>
                </AcmPageContent>
            </AcmToastProvider>
        </AcmPage>
    )
}

export function AlertGroupStory(props: { useToast?: boolean }) {
    const alertContext = useContext(props.useToast ? AcmToastContext : AcmAlertContext)
    const addAlert = useCallback(() => alertContext.addAlert({ title: 'Alert', message: 'Message' }), [alertContext])
    const addInfo = useCallback(
        () => alertContext.addAlert({ title: 'Info Alert', message: 'Message', type: 'info' }),
        [alertContext]
    )
    const addSuccess = useCallback(
        () => alertContext.addAlert({ title: 'Success Alert', message: 'Message', type: 'success' }),
        [alertContext]
    )
    const addWarning = useCallback(
        () => alertContext.addAlert({ title: 'Warning Alert', message: 'Message', type: 'warning' }),
        [alertContext]
    )
    const addError = useCallback(
        () => alertContext.addAlert({ title: 'ErrorAlert', message: 'Message', type: 'danger' }),
        [alertContext]
    )
    const addExpiring = useCallback(
        () => alertContext.addAlert({ title: 'Info Alert', message: 'Message', type: 'info', autoClose: true }),
        [alertContext]
    )
    useEffect(() => {
        addAlert()
        addInfo()
        addSuccess()
        addWarning()
        addError()
    }, [addAlert, addInfo, addSuccess, addWarning, addError])
    return (
        <Toolbar>
            <ToolbarContent>
                <ToolbarItem>
                    <AcmButton onClick={addAlert}>Alert</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={addInfo}>Info</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={addSuccess}>Success</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={addWarning}>Warning</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={addError}>Error</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={addExpiring}>Expiring alert</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={() => alertContext.clearAlerts()}>Clear</AcmButton>
                </ToolbarItem>
                <ToolbarItem>
                    <AcmButton onClick={() => alertContext.clearAlerts((a) => a.type === 'info')}>Clear Info</AcmButton>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    )
}
