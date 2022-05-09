/* Copyright Contributors to the Open Cluster Management project */

import { useState, useContext, useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary, AcmToastContext } from '@stolostron/ui-components'
import { PageSection } from '@patternfly/react-core'
import { createCluster } from '../../../../../lib/create-cluster'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { CancelBackState, cancelNavigation, NavigationPath } from '../../../../../NavigationPath'
import Handlebars from 'handlebars'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { namespacesState, settingsState } from '../../../../../atoms'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
import '../../ManagedClusters/CreateCluster/style.css'

// template/data
import { getControlData } from './controlData/ControlData'
import {
    setAvailableConnections,
    arrayItemHasKey,
} from '../../ManagedClusters/CreateCluster/controlData/ControlDataHelpers'
import hiveTemplate from './templates/hive-template.hbs'
import { secretsState } from '../../../../../atoms'

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

Handlebars.registerHelper('arrayItemHasKey', arrayItemHasKey)

export default function CreateClusterPoolPage() {
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
                    title={t('page.header.create-clusterPool')}
                    titleTooltip={
                        <>
                            {t('page.header.create-clusterPool.tooltip')}
                            <a
                                href={DOC_LINKS.CLUSTER_POOLS}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('clusterPools'), to: NavigationPath.clusterPools },
                        { text: t('page.header.create-clusterPool'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-cluster-pool">
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <CreateClusterPool />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export function CreateClusterPool() {
    const history = useHistory()
    const location = useLocation<CancelBackState>()
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const toastContext = useContext(AcmToastContext)
    const [settings] = useRecoilState(settingsState)

    // if a connection is added outside of wizard, add it to connection selection
    const [connectionControl, setConnectionControl] = useState()
    useEffect(() => {
        if (connectionControl) {
            setAvailableConnections(connectionControl, secrets)
        }
    }, [connectionControl, secrets])

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            const { status, messages } = await createCluster(createResources)
            setCreationStatus({ status, messages })

            // redirect to created cluster
            if (status === 'DONE') {
                const name = createResources.find((resource) => resource.kind === 'ClusterPool')?.metadata.name
                toastContext.addAlert({
                    title: t('clusterPool.creation.success.title'),
                    message: t('clusterPool.creation.success.message', { name }),
                    type: 'success',
                    autoClose: true,
                })
                history.push(NavigationPath.clusterPools)
            }
        }
    }

    // cancel button
    const cancelCreate = () => {
        cancelNavigation(location, history, NavigationPath.clusterPools)
    }

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    //compile template
    const template = Handlebars.compile(hiveTemplate)

    // if openned from bma page, pass selected bma's to editor
    const urlParams = new URLSearchParams(location.search.substring(1))
    const bmasParam = urlParams.get('bmas')
    const requestedUIDs = bmasParam ? bmasParam.split(',') : []
    const fetchControl = bmasParam
        ? {
              isLoaded: true,
              fetchData: { requestedUIDs },
          }
        : null

    // Check for pre-selected cluster set
    const selectedClusterSet = urlParams.get('clusterSet')

    const { canJoinClusterSets } = useCanJoinClusterSets()
    const mustJoinClusterSet = useMustJoinClusterSet()
    function onControlInitialize(control: any) {
        switch (control.id) {
            case 'connection':
                setConnectionControl(control)
                break
            case 'clusterSet':
                if (control.available) {
                    control.available = canJoinClusterSets?.map((mcs) => mcs.metadata.name) ?? []
                    if (selectedClusterSet && control.available.includes(selectedClusterSet)) {
                        control.active = selectedClusterSet
                    }
                    control.validation.required = mustJoinClusterSet ?? false
                }
                break
            case 'infrastructure':
                control?.available?.forEach((provider: any) => {
                    const providerData: any = control?.availableMap[provider]
                    providerData?.change?.insertControlData?.forEach((ctrl: any) => {
                        if (ctrl.id === 'connection') {
                            setAvailableConnections(ctrl, secrets)
                        }
                    })
                })
                break
            case 'namespace':
                control.available = namespaces.map((namespace) => namespace.metadata.name) as string[]
                break
            case 'singleNodeFeatureFlag':
                if (settings.singleNodeOpenshift === 'enabled') {
                    control.active = true
                }
                break
        }
    }

    // cluster set dropdown won't update without this
    if (canJoinClusterSets === undefined) {
        return null
    }

    return (
        <TemplateEditor
            type={'ClusterPool'}
            title={'ClusterPool YAML'}
            monacoEditor={<MonacoEditor />}
            controlData={getControlData(
                settings.awsPrivateWizardStep === 'enabled',
                settings.singleNodeOpenshift === 'enabled'
            )}
            template={template}
            portals={Portals}
            fetchControl={fetchControl}
            createControl={{
                createResource,
                cancelCreate,
                pauseCreate: () => {},
                creationStatus: creationStatus?.status,
                creationMsg: creationStatus?.messages,
            }}
            logging={process.env.NODE_ENV !== 'production'}
            onControlInitialize={onControlInitialize}
            i18n={i18n}
        />
    )
}
