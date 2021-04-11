/* Copyright Contributors to the Open Cluster Management project */

import React, { useContext, useEffect, useState } from 'react'
import {
    AcmAlertContext,
    AcmForm,
    AcmPageContent,

} from '@open-cluster-management/ui-components'
import { PageSection, Wizard, WizardStep } from '@patternfly/react-core'

export default function IntegrationWizard(){
    const steps: WizardStep[] = [
        {
            name:'Default creationjob templates',
            component: null
        }
    ]
    return(
        <Wizard
        steps={steps} 
        />
    )
}

function IntegrationForm(){
    return(
        <AcmForm>
            
        </AcmForm>
    )
}