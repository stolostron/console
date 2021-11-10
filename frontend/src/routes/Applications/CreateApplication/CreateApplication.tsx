/* Copyright Contributors to the Open Cluster Management project */
import {
    useState,
    // useContext
} from 'react'
import {
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmErrorBoundary,
    // AcmToastContext,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { NavigationPath } from '../../../NavigationPath'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

interface CreationStatus {
    status: string
    messages: any[] | null
}

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
                <AcmPageContent id="create-cluster-pool">
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <CreateApplication />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateApplication() {
    const history = useHistory()
    // const location = useLocation()
    // const toastContext = useContext(AcmToastContext)

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            // const { createResources } = resourceJSON
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            // change createCluster to createApplication
            // const { status, messages } = await createCluster(createResources)
            // setCreationStatus({ status, messages })

            // redirect to created cluster
            // disable creation for now
            // if (status === 'DONE') {
            //     const name = createResources.find((resource) => resource.kind === 'ClusterPool')?.metadata.name
            //     toastContext.addAlert({
            //         title: t('clusterPool.creation.success.title'),
            //         message: t('clusterPool.creation.success.message', { name }),
            //         type: 'success',
            //         autoClose: true,
            //     })
            //     history.push(NavigationPath.applications)
            // }
        }
    }

    // will wait to adopt AppForm

    // return <AppForm />
    return <h1>create application</h1>
}
