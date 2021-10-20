/* Copyright Contributors to the Open Cluster Management project */
import { AcmPage } from '@open-cluster-management/ui-components'
import { useState, useContext, useEffect } from 'react'
import { useRecoilState } from 'recoil'

import {
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmErrorBoundary,
    AcmToastContext,
} from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { NavigationPath } from '../../../NavigationPath'
import Handlebars from 'handlebars'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'

import { DOC_LINKS } from '../../../lib/doc-util'

// Template Data
import { ControlData } from './ControlData/ControlData'
import createTemplate from './templates/template.hbs'
import gitTemplate from './templates/templateGit.hbs'

import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'

// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'

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
    const location = useLocation()
    const toastContext = useContext(AcmToastContext)

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
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

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.applications)
    }

    // pause creation to create something else
    const pauseCreate = () => {}

    // setup translation
    const { t } = useTranslation(['create'])
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    //compile template
    const template = Handlebars.compile(createTemplate)
    Handlebars.registerPartial('templateGit', Handlebars.compile(gitTemplate))


    // if openned from bma page, pass selected bma's to editor
    const urlParams = new URLSearchParams(location.search.substring(1))

    return (
        <TemplateEditor
            type={'application'}
            title={t('application.create.yaml')}
            monacoEditor={<MonacoEditor />}
            controlData={ControlData}
            // controlData={getControlData(
            //     settings.awsPrivateWizardStep === 'enabled',
            //     settings.singleNodeOpenshift === 'enabled'
            // )}
            template={template}
            portals={Portals}
            // fetchControl={fetchControl}
            createControl={{
                createResource,
                cancelCreate,
                pauseCreate,
                creationStatus: creationStatus?.status,
                creationMsg: creationStatus?.messages,
            }}
            logging={process.env.NODE_ENV !== 'production'}
            i18n={i18n}
        />
    )
}
