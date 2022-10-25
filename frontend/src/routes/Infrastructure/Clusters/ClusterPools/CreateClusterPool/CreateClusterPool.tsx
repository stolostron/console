/* Copyright Contributors to the Open Cluster Management project */

import { useState, useContext, useEffect, Fragment, useCallback } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../../../shared-recoil'
import { AcmPage, AcmPageContent, AcmPageHeader, AcmErrorBoundary, AcmToastContext } from '../../../../../ui-components'
import { Modal, ModalVariant, PageSection } from '@patternfly/react-core'
import { createCluster } from '../../../../../lib/create-cluster'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { NavigationPath, useBackCancelNavigation } from '../../../../../NavigationPath'
import Handlebars from 'handlebars'
import { DOC_LINKS } from '../../../../../lib/doc-util'
import { useCanJoinClusterSets, useMustJoinClusterSet } from '../../ClusterSets/components/useCanJoinClusterSets'
import '../../ManagedClusters/CreateCluster/style.css'

// template/data
import { fixupControlsForClusterPool } from './controlData/ControlDataHelper'
import {
    setAvailableConnections,
    arrayItemHasKey,
} from '../../ManagedClusters/CreateCluster/controlData/ControlDataHelpers'
import hiveTemplate from './templates/hive-template.hbs'
import TemplateEditor from '../../../../../components/TemplateEditor'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import { CredentialsForm } from '../../../../Credentials/CredentialsForm'
import { GetProjects } from '../../../../../components/GetProjects'
import { Secret } from '../../../../../resources'
import getControlDataAWS from './controlData/ControlDataAWS'
import getControlDataGCP from './controlData/ControlDataGCP'
import getControlDataAZR from './controlData/ControlDataAZR'
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

export enum CreateClusterPoolInfrastructureType {
    AWS = 'AWS',
    GCP = 'GCP',
    Azure = 'Azure',
}

export const isCreateClusterPoolInfrastructureType = (
    infrastructureType: string
): infrastructureType is CreateClusterPoolInfrastructureType =>
    infrastructureType in CreateClusterPoolInfrastructureType

export default function CreateClusterPool(props: { infrastructureType: CreateClusterPoolInfrastructureType }) {
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
                    <PageSection variant="light" isFilled type="wizard">
                        <CreateClusterPoolWizard {...props} />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

function CreateClusterPoolWizard(props: { infrastructureType: CreateClusterPoolInfrastructureType }) {
    const { infrastructureType } = props
    const history = useHistory()
    const { search } = useLocation()
    const { back, cancel } = useBackCancelNavigation()
    const { namespacesState, settingsState, clusterPoolsState, secretsState } = useSharedAtoms()
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const toastContext = useContext(AcmToastContext)
    const [settings] = useRecoilState(settingsState)
    const [clusterPools] = useRecoilState(clusterPoolsState)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newSecret, setNewSecret] = useState<Secret>()

    const { projects } = GetProjects()

    const onControlChange = useCallback(
        (control: any) => {
            if (control.id === 'connection') {
                if (newSecret && control.setActive) {
                    control.setActive(newSecret.metadata.name)
                }
            }
        },
        [newSecret]
    )

    // if a connection is added outside of wizard, add it to connection selection
    const [connectionControl, setConnectionControl] = useState()
    useEffect(() => {
        if (connectionControl) {
            setAvailableConnections(connectionControl, secrets)
            onControlChange(connectionControl)
        }
    }, [connectionControl, onControlChange, secrets])
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

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen)
    }

    const backButtonOverride = back(NavigationPath.createClusterPool)
    const cancelCreate = cancel(NavigationPath.clusterPools)

    // setup translation
    const { t } = useTranslation()
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    //compile template
    const template = Handlebars.compile(hiveTemplate)

    // if openned from bma page, pass selected bma's to editor
    let controlData: any[]
    switch (infrastructureType) {
        case CreateClusterPoolInfrastructureType.AWS:
            controlData = getControlDataAWS(
                handleModalToggle,
                false,
                settings.awsPrivateWizardStep === 'enabled',
                settings.singleNodeOpenshift === 'enabled'
            )
            break
        case CreateClusterPoolInfrastructureType.GCP:
            controlData = getControlDataGCP(handleModalToggle, false, settings.singleNodeOpenshift === 'enabled')
            break
        case CreateClusterPoolInfrastructureType.Azure:
            controlData = getControlDataAZR(handleModalToggle, false, settings.singleNodeOpenshift === 'enabled')
            break
    }

    // Check for pre-selected cluster set
    const urlParams = new URLSearchParams(search)
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
            case 'name':
                control.validation.contextTester = (
                    active: string | undefined,
                    templateObjectMap: { [x: string]: { ClusterPool: { $raw: { metadata: { namespace: any } } }[] } }
                ) => {
                    if (clusterPools.length) {
                        const namespace = templateObjectMap['<<main>>'].ClusterPool[0].$raw.metadata.namespace
                        if (namespace) {
                            if (
                                clusterPools.findIndex((pool) => {
                                    return pool?.metadata?.name === active && pool?.metadata?.namespace === namespace
                                }) !== -1
                            ) {
                                return t('clusterPool.creation.validation.unique.name', [namespace])
                            }
                        }
                    }
                    if (!control?.validation?.tester.test(active)) {
                        return t(control?.validation?.notification, [active])
                    }
                }
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
        <Fragment>
            <Modal
                variant={ModalVariant.large}
                showClose={false}
                isOpen={isModalOpen}
                aria-labelledby="modal-wizard-label"
                aria-describedby="modal-wizard-description"
                onClose={handleModalToggle}
                hasNoBodyWrapper
            >
                <CredentialsForm
                    namespaces={projects}
                    isEditing={false}
                    isViewing={false}
                    infrastructureType={infrastructureType}
                    handleModalToggle={handleModalToggle}
                    hideYaml={true}
                    control={setNewSecret}
                />
            </Modal>
            <TemplateEditor
                type={'ClusterPool'}
                title={'ClusterPool YAML'}
                monacoEditor={<MonacoEditor />}
                controlData={fixupControlsForClusterPool(controlData)}
                template={template}
                portals={Portals}
                createControl={{
                    createResource,
                    cancelCreate,
                    pauseCreate: () => {},
                    creationStatus: creationStatus?.status,
                    creationMsg: creationStatus?.messages,
                    backButtonOverride,
                }}
                logging={process.env.NODE_ENV !== 'production'}
                onControlChange={onControlChange}
                onControlInitialize={onControlInitialize}
                i18n={i18n}
            />
        </Fragment>
    )
}
