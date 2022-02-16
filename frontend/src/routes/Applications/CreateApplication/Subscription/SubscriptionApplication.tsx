/* Copyright Contributors to the Open Cluster Management project */
import { useState, useContext } from 'react'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary, AcmToastContext } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { NavigationPath } from '../../../../NavigationPath'
import Handlebars from 'handlebars'
import { useTranslation } from '../../../../lib/acm-i18next'
import {
    useHistory,
    // useLocation
} from 'react-router-dom'
import { ApplicationKind, createResources as createKubeResources, IResource } from '../../../../resources'

// Template Data
import { controlData } from './controlData/ControlData'
import createTemplate from './templates/template.hbs'
import gitTemplate from './templates/templateGit.hbs'
import helmTemplate from './templates/templateHelm.hbs'
import ObjTemplate from './templates/templateObjectStore.hbs'
import placementTemplate from './templates/templatePlacement.hbs'

import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'

// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import _ from 'lodash'

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

export default function CreateSubscriptionApplicationPage() {
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
                    title={t('Create Application')}
                    breadcrumb={[{ text: t('Applications'), to: NavigationPath.applications }]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-cluster-pool">
                    <PageSection className="pf-c-content" variant="light">
                        <CreateSubscriptionApplication />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateSubscriptionApplication() {
    const history = useHistory()
    const toastContext = useContext(AcmToastContext)

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            // change create cluster to create application
            const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
            createKubeResources(createResources as IResource[]).then((error) => {
                toastContext.addAlert({
                    title: t('Application created'),
                    message: t('{{name}} was successfully created.', {
                        name: _.get(applicationResourceJSON, 'metadata.name', ''),
                    }),
                    type: 'success',
                    autoClose: true,
                })
                history.push(NavigationPath.applications)
                return error
            })
        }
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.applications)
    }

    // pause creation to create something else
    const pauseCreate = () => {}

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    //compile template
    const template = Handlebars.compile(createTemplate)
    Handlebars.registerPartial('templateGit', Handlebars.compile(gitTemplate))
    Handlebars.registerPartial('templateHelm', Handlebars.compile(helmTemplate))
    Handlebars.registerPartial('templateObjectStore', Handlebars.compile(ObjTemplate))
    Handlebars.registerPartial('templatePlacement', Handlebars.compile(placementTemplate))

    function onControlInitialize(control: any) {
        switch (control.id) {
            case 'channelSection':
                const { content } = control
                if (content && content.length) {
                    const { controlData } = content[0]
                    const channelTypeData = _.find(controlData, { id: 'channelType' })
                    channelTypeData.available.forEach((data: { change: { insertControlData: any } }) => {
                        const { insertControlData } = data.change
                        const clusterSelector = _.find(insertControlData, { id: 'clusterSelector' })
                        if (clusterSelector) {
                            _.set(clusterSelector, 't', t)
                        }
                    })
                }
                break
        }
    }

    return (
        <TemplateEditor
            type={'application'}
            title={t('application.create.yaml')}
            monacoEditor={<MonacoEditor />}
            controlData={controlData}
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
            onControlInitialize={onControlInitialize}
            i18n={i18n}
        />
    )
}
