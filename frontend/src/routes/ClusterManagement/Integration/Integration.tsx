/* Copyright Contributors to the Open Cluster Management project */

import React, { useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmPageContent,

} from '@open-cluster-management/ui-components'
import { PageSection, Wizard, WizardStep } from '@patternfly/react-core'

export default function IntegrationsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}>
                
            </PageSection>
        </AcmPageContent>
    )
}

function IntegrationWizard(){
    const steps: WizardStep[] = [
        {
            name:'Default creationjob template',
            component: null
        }
    ]
    return(
        <Wizard
        steps={steps} 
        />
    )
}