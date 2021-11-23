/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { NavigationPath } from '../../../NavigationPath'
import { useTranslation } from 'react-i18next'
import { listPlacements } from '../../../resources'
import { listAvailableArgoServerNS } from '../../../resources/gitops-cluster'
// interface CreationStatus {
//     status: string
//     messages: any[] | null
// }

// where to put Create/Cancel buttons
const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

export default function CreateApplicationPage() {
    const { t } = useTranslation(['create'])

    // create portals for buttons in header
    const switches = (
        <div className="switch-controls">
            <div id={Portals.editBtn} />
        </div>
    )

    const portals = (
        <div className="portal-controls">
            <div id={Portals.cancelBtn} />
            <div id={Portals.createBtn} />
        </div>
    )

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('page.header.create-application')}
                    breadcrumb={[
                        { text: t('applications'), to: NavigationPath.applications },
                        { text: t('page.header.create-application'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-application">
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <CreateApplication />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateApplication() {
    // will need to pass argoNs to AppForm to get argo namespaces
    const [argoNs, setArgoNs] = useState<string[]>([])
    const [availablePlacements, setAvailablePlacements] = useState<string[]>([])

    useEffect(() => {
        const fetchNs = async () => {
            try {
                let newNs = await listAvailableArgoServerNS().promise
                let newPlacements = await listPlacements().promise
                setArgoNs(newNs)
                setAvailablePlacements(newPlacements)
            } catch {
                setArgoNs([])
                setAvailablePlacements([])
            }
        }
        fetchNs()
    }, [])
    // will wait to adopt AppForm

    // return <AppForm />
    return (
        <Fragment>
            <h1>Argo Namespaces:</h1>
            <ul>
                {argoNs.map((ns) => {
                    return <li>{ns}</li>
                })}
            </ul>
            <h1>Existing Placements:</h1>
            <ul>
                {availablePlacements.map((placement) => {
                    return <li>{placement}</li>
                })}
            </ul>
        </Fragment>
    )
}
