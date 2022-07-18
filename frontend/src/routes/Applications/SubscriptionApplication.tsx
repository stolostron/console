/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader, AcmToastContext } from '../../ui-components'
import Handlebars from 'handlebars'
import { Location } from 'history'
import _ from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import { useHistory, useLocation } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import TemplateEditor from '../../components/TemplateEditor'
import {
    ansibleJobState,
    applicationsState,
    channelsState,
    placementRulesState,
    secretsState,
    subscriptionsState,
} from '../../atoms'
import { getErrorInfo } from '../../components/ErrorPage'
import { useTranslation } from '../../lib/acm-i18next'
import { useSearchParams } from '../../lib/search'
import { NavigationPath } from '../../NavigationPath'
import {
    ApplicationKind,
    IResource,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    reconcileResources,
    SubscriptionKind,
    unpackProviderConnection,
    updateAppResources,
} from '../../resources'
import '../Applications/CreateApplication/Subscription/style.css'
import { getApplicationResources } from '../Applications/CreateApplication/Subscription/transformers/transform-data-to-resources'
import { getApplication } from './ApplicationDetails/ApplicationTopology/model/application'
// Template Data
import { controlData as getControlData } from './CreateApplication/Subscription/controlData/ControlData'
import createTemplate from './CreateApplication/Subscription/templates/template.hbs'
import gitTemplate from './CreateApplication/Subscription/templates/templateGit.hbs'
import helmTemplate from './CreateApplication/Subscription/templates/templateHelm.hbs'
import ObjTemplate from './CreateApplication/Subscription/templates/templateObjectStore.hbs'
import otherTemplate from './CreateApplication/Subscription/templates/templateOther.hbs'
import placementTemplate from './CreateApplication/Subscription/templates/templatePlacement.hbs'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'

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
                    <PageSection variant="light" type="wizard">
                        {CreateSubscriptionApplication(setTitle)}
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateSubscriptionApplication(setTitle: Dispatch<SetStateAction<string>>) {
    const history = useHistory()
    const { t } = useTranslation()
    const toastContext = useContext(AcmToastContext)
    const [secrets] = useRecoilState(secretsState)
    const providerConnections = secrets.map(unpackProviderConnection)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )

    const clusters = useAllClusters()
    const localCluster = clusters.find(
        (cluster) => cluster.name === 'local-cluster' && cluster.isManaged && cluster.status === 'ready'
    )
    const isLocalCluster = localCluster ? true : false

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            // change create cluster to create application
            const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
            reconcileResources(createResources as IResource[], [])
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
                    const errorInfo = getErrorInfo(err, t)
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
            // create ansible secrets if any are used and not yet available in the app ns
            // get all subscriptions using an ansible provider
            const { createResources } = resourceJSON
            const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
            const subsUsingAnsible = resourceJSON.createResources.filter(
                (resource) => resource.kind === SubscriptionKind && _.get(resource, 'spec.hooksecretref.name')
            )
            if (subsUsingAnsible) {
                const uniqueAnsibleSecretNames = Array.from(
                    new Set([..._.map(subsUsingAnsible, 'spec.hooksecretref.name')])
                )
                uniqueAnsibleSecretNames.forEach((name) => {
                    // check if a secret with this name already exists in the app ns
                    const existingSecret = ansibleCredentials.find((ac) => {
                        return (
                            ac.metadata.name === name &&
                            ac.metadata.namespace === applicationResourceJSON?.metadata?.namespace
                        )
                    })
                    if (!existingSecret) {
                        const originalAnsibleSecret = ansibleCredentials.find((ac) => ac.metadata.name === name)
                        const ansibleSecret: ProviderConnection = {
                            apiVersion: ProviderConnectionApiVersion,
                            kind: ProviderConnectionKind,
                            metadata: {
                                name,
                                namespace: applicationResourceJSON?.metadata?.namespace,
                                labels: {
                                    'cluster.open-cluster-management.io/type': 'ans',
                                    'cluster.open-cluster-management.io/copiedFromNamespace':
                                        originalAnsibleSecret?.metadata.namespace!,
                                    'cluster.open-cluster-management.io/copiedFromSecretName':
                                        originalAnsibleSecret?.metadata.name!,
                                },
                            },
                            stringData: _.get(originalAnsibleSecret, 'stringData', {}),
                            type: 'Opaque',
                        }
                        // add resource
                        createResources.push(ansibleSecret)
                    }
                })
            }

            if (editApplication) {
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
                        toastContext.addAlert({
                            title: t('Application updated'),
                            message: t('{{name}} was successfully updated.', {
                                name: _.get(applicationResourceJSON, 'metadata.name', ''),
                            }),
                            type: 'success',
                            autoClose: true,
                        })
                        redirectRoute()
                    })
                    .catch((err) => {
                        const errorInfo = getErrorInfo(err, t)
                        toastContext.addAlert({
                            type: 'danger',
                            title: errorInfo.title,
                            message: errorInfo.message,
                        })
                    })
            } else {
                createResource(resourceJSON).catch((err) => {
                    const errorInfo = getErrorInfo(err, t)
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
        redirectRoute()
    }

    const redirectRoute = () => {
        if (searchParams.get('context') === 'applications') {
            history.push(NavigationPath.applications)
        } else {
            history.push(
                NavigationPath.applicationOverview
                    .replace(':namespace', editApplication?.selectedAppNamespace ?? '')
                    .replace(':name', editApplication?.selectedAppName ?? '')
            )
        }
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
    const searchParams = useSearchParams()
    useEffect(() => {
        if (editApplication) {
            const { selectedAppName, selectedAppNamespace } = editApplication
            const allChannels = '__ALL__/__ALL__//__ALL__/__ALL__'
            const fetchApplication = async () => {
                // get application object from recoil states
                const application = await getApplication(selectedAppNamespace, selectedAppName, allChannels, {
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
            fetchApplication()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    const isFetchControl = editApplication ? fetchControl : true

    return (
        isFetchControl && (
            <TemplateEditor
                type={'application'}
                title={t('application.create.yaml')}
                monacoEditor={<MonacoEditor />}
                controlData={getControlData(isLocalCluster)}
                template={template}
                portals={Portals}
                fetchControl={fetchControl}
                createControl={createControl}
                logging={process.env.NODE_ENV !== 'production'}
                i18n={t}
            />
        )
    )
}
