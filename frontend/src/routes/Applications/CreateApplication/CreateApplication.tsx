/* Copyright Contributors to the Open Cluster Management project */

import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { Fragment } from 'react'
import { NavigationPath } from '../../../NavigationPath'
import { useTranslation } from '../../../lib/acm-i18next'
import { useRecoilState } from 'recoil'
import { isType } from '../../../lib/is-type'
import { gitOpsClustersState, placementsState } from '../../../atoms'

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
    const { t } = useTranslation()

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
                    title={t('Create application')}
                    breadcrumb={[
                        { text: t('Applications'), to: NavigationPath.applications },
                        { text: t('Create application'), to: '' },
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
    const [placements] = useRecoilState(placementsState)
    const [gitOpsClusters] = useRecoilState(gitOpsClustersState)

    const availableArgoNS = gitOpsClusters
        .map((gitOpsCluster) => gitOpsCluster.spec?.argoServer?.argoNamespace)
        .filter(isType)
    const availablePlacements = placements.map((placement) => placement.metadata.name).filter(isType)

    // will wait to adopt AppForm

    // return <AppForm />
    return (
        <Fragment>
            <h1>Argo Namespaces:</h1>
            <ul>
                {availableArgoNS.map((ns) => {
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
