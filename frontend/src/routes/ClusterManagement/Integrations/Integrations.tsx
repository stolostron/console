/* Copyright Contributors to the Open Cluster Management project */

import React, { Fragment, useContext, useEffect, useState } from 'react'
import { AcmAlertContext, AcmForm, AcmPageContent, AcmTable } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { BulkActionModel, errorIsNot, IBulkActionModelProps } from '../../../components/BulkActionModel'

import { AnsibleTowerSecret } from '../../../resources/ansible-tower-secret'
import { TableGridBreakpoint } from '@patternfly/react-table'

export default function IntegrationsPage() {
    const alertContext = useContext(AcmAlertContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => alertContext.clearAlerts, [])

    return (
        <AcmPageContent id="clusters">
            <PageSection variant="light" isFilled={true}></PageSection>
        </AcmPageContent>
    )
}

function IntegrationTable() {
    // Load Data

    // Set table
    return <Fragment></Fragment>
}
