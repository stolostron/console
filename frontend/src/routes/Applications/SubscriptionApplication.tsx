/* Copyright Contributors to the Open Cluster Management project */
import { useState, useContext, useEffect, SetStateAction, Dispatch } from 'react'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary, AcmToastContext } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { NavigationPath } from '../../NavigationPath'
import Handlebars from 'handlebars'
import { useTranslation } from '../../lib/acm-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { Location } from 'history'
import { ApplicationKind, createResources as createKubeResources, IResource, updateAppResources } from '../../resources'
import '../Applications/CreateApplication/Subscription/style.css'

// Template Data
import { controlData as getControlData } from './CreateApplication/Subscription/controlData/ControlData'
import createTemplate from './CreateApplication/Subscription/templates/template.hbs'
import gitTemplate from './CreateApplication/Subscription/templates/templateGit.hbs'
import helmTemplate from './CreateApplication/Subscription/templates/templateHelm.hbs'
import ObjTemplate from './CreateApplication/Subscription/templates/templateObjectStore.hbs'
import placementTemplate from './CreateApplication/Subscription/templates/templatePlacement.hbs'
import otherTemplate from './CreateApplication/Subscription/templates/templateOther.hbs'

import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'

// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import _ from 'lodash'
import { useRecoilState } from 'recoil'
import { ansibleJobState, applicationsState, channelsState, placementRulesState, subscriptionsState } from '../../atoms'

import { getApplicationResources } from '../Applications/CreateApplication/Subscription/transformers/transform-data-to-resources'
import { getApplication } from './ApplicationDetails/ApplicationTopology/model/application'
import { getErrorInfo } from '../../components/ErrorPage'

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
    const [title, setTitle] = useState<string>(t('Create application'))

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
                    title={title}
                    breadcrumb={[{ text: t('Applications'), to: NavigationPath.applications }]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-cluster-pool">
                    <PageSection className="pf-c-content" variant="light" type="wizard">
                        {CreateSubscriptionApplication(setTitle)}
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateSubscriptionApplication(setTitle: Dispatch<SetStateAction<string>>) {
    const history = useHistory()
    const toastContext = useContext(AcmToastContext)
    const [controlData, setControlData] = useState<any>('')
    useEffect(() => {
        getControlData()
            .then((cd) => {
                setControlData(cd)
            })
            .catch((err) => {
                return err
            })
    }, [])

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            // change create cluster to create application
            const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
            createKubeResources(createResources as IResource[])
                .then(() => {
                    toastContext.addAlert({
                        title: t('Application created'),
                        message: t('{{name}} was successfully created.', {
                            name: _.get(applicationResourceJSON, 'metadata.name', ''),
                        }),
                        type: 'success',
                        autoClose: true,
                    })
                    history.push(
                        NavigationPath.applicationOverview
                            .replace(':namespace', applicationResourceJSON.metadata.namespace as string)
                            .replace(':name', applicationResourceJSON.metadata.name as string) + location.search
                    )
                })
                .catch((err) => {
                    const errorInfo = getErrorInfo(err)
                    toastContext.addAlert({
                        type: 'danger',
                        title: errorInfo.title,
                        message: errorInfo.message,
                    })
                })
        }
    }
    function handleCreate(resourceJSON: { createResources: IResource[] }) {
        if (resourceJSON) {
            if (editApplication) {
                const { createResources } = resourceJSON
                // set resourceVersion
                createResources.forEach((resource) => {
                    const name = resource.metadata?.name
                    const namespace = resource.metadata?.namespace
                    let resourceVersion
                    if (name && namespace) {
                        switch (resource.kind) {
                            case 'Application':
                                resourceVersion = getResourceVersion(applications, name, namespace)
                                break
                            case 'Subscription':
                                resourceVersion = getResourceVersion(subscriptions, name, namespace)
                                break
                            case 'PlacementRule':
                                resourceVersion = getResourceVersion(placementRules, name, namespace)
                                break
                        }
                        _.set(resource, 'metadata.resourceVersion', resourceVersion)
                    }
                })

                updateAppResources(createResources)
                    .then(() => {
                        const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
                        toastContext.addAlert({
                            title: t('Application updated'),
                            message: t('{{name}} was successfully updated.', {
                                name: _.get(applicationResourceJSON, 'metadata.name', ''),
                            }),
                            type: 'success',
                            autoClose: true,
                        })
                        history.push(NavigationPath.applications)
                    })
                    .catch((err) => {
                        const errorInfo = getErrorInfo(err)
                        toastContext.addAlert({
                            type: 'danger',
                            title: errorInfo.title,
                            message: errorInfo.message,
                        })
                    })
            } else {
                createResource(resourceJSON).catch((err) => {
                    const errorInfo = getErrorInfo(err)
                    toastContext.addAlert({
                        type: 'danger',
                        title: errorInfo.title,
                        message: errorInfo.message,
                    })
                })
            }
        }
    }

    function getResourceVersion(resources: IResource[], name: string, namespace: string) {
        const selectedResource = resources.find((resource: IResource) => {
            return resource?.metadata?.name === name && resource?.metadata?.namespace === namespace
        })
        const resourceVersion = _.get(selectedResource, 'metadata.resourceVersion')
        return resourceVersion
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.applications)
    }

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    function getEditApplication(location: Location) {
        const pathname = location.pathname
        if (pathname.includes('/edit/subscription')) {
            const params = pathname.replace(/(.*)edit\/subscription\//, '')
            const [namespace, name] = params.split('/')
            if (name && namespace) {
                return {
                    selectedAppName: name,
                    selectedAppNamespace: namespace,
                }
            }
        }
        return null
    }

    //compile template
    const template = Handlebars.compile(createTemplate)
    Handlebars.registerPartial('templateGit', Handlebars.compile(gitTemplate))
    Handlebars.registerPartial('templateHelm', Handlebars.compile(helmTemplate))
    Handlebars.registerPartial('templateObjectStore', Handlebars.compile(ObjTemplate))
    Handlebars.registerPartial('templatePlacement', Handlebars.compile(placementTemplate))
    Handlebars.registerPartial('templateOther', Handlebars.compile(otherTemplate))
    const [fetchControl, setFetchControl] = useState<any>(null)
    const [applications] = useRecoilState(applicationsState)
    const [ansibleJob] = useRecoilState(ansibleJobState)
    const [subscriptions] = useRecoilState(subscriptionsState)
    const [channels] = useRecoilState(channelsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const location = useLocation()
    const editApplication = getEditApplication(location)
    useEffect(() => {
        if (editApplication) {
            const { selectedAppName, selectedAppNamespace } = editApplication
            const allChannels = '__ALL__/__ALL__//__ALL__/__ALL__'
            // get application object from recoil states
            const application = getApplication(selectedAppNamespace, selectedAppName, allChannels, {
                applications,
                ansibleJob,
                subscriptions,
                channels,
                placementRules,
            })
            setFetchControl({
                resources: getApplicationResources(application),
                isLoaded: true,
            })
        }
    }, [ansibleJob, applications, channels, editApplication, placementRules, subscriptions])

    useEffect(() => {
        if (editApplication) {
            const { selectedAppName } = editApplication
            setTitle(selectedAppName)
        }
    }, [editApplication, setTitle])

    const createControl = {
        createResource: handleCreate,
        cancelCreate,
        pauseCreate: () => {},
        creationStatus: creationStatus?.status,
        creationMsg: creationStatus?.messages,
    }

    return (
        controlData && (
            <TemplateEditor
                type={'application'}
                title={t('application.create.yaml')}
                monacoEditor={<MonacoEditor />}
                controlData={controlData}
                template={template}
                portals={Portals}
                fetchControl={fetchControl}
                createControl={createControl}
                logging={process.env.NODE_ENV !== 'production'}
                i18n={i18n}
            />
        )
    )
}
