/* Copyright Contributors to the Open Cluster Management project */

import { AcmErrorBoundary, AcmPageContent, AcmPage, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
import fs from 'fs'
import Handlebars from 'handlebars'
import { get, keyBy } from 'lodash'
import path from 'path'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickCommand.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import { useHistory, useLocation } from 'react-router-dom'
import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { NavigationPath } from '../../../../NavigationPath'
import { useCanJoinClusterSets } from '../../ClusterSets/components/useCanJoinClusterSets'
// template/data
import { controlData } from './controlData/ControlData'
import { setAvailableConnections, setAvailableTemplates } from './controlData/ControlDataHelpers'
import './style.css'
import hiveTemplate from './templates/hive-template.hbs'
import { secretsState, managedClustersState, clusterCuratorsState } from '../../../../atoms'
import { makeStyles } from '@material-ui/styles'
import { ClusterCurator, filterForTemplatedCurators, createClusterCurator } from '../../../../resources/cluster-curator'
import { createCluster } from '../../../../lib/create-cluster'
import { unpackProviderConnection } from '../../../../resources/provider-connection'
import { Secret } from '../../../../resources/secret'
import { createResource as createResourceTool } from '../../../../lib/resource-request'

declare const window: any
if (window.monaco) {
    window.monaco.editor.defineTheme('console', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
            { token: 'number', foreground: 'ace12e' },
            { token: 'type', foreground: '73bcf7' },
            { token: 'string', foreground: 'f0ab00' },
            { token: 'keyword', foreground: 'cbc0ff' },
        ],
        colors: {
            'editor.background': editorBackground.value,
            'editorGutter.background': '#292e34', // no pf token defined
            'editorLineNumber.activeForeground': '#fff',
            'editorLineNumber.foreground': '#f0f0f0',
        },
    })
}
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

const useStyles = makeStyles({
    wizardBody: {
        '& .pf-c-wizard__outer-wrap .pf-c-wizard__main .pf-c-wizard__main-body': {
            height: '100%',
        },
    },
})

export default function CreateClusterPage() {
    const history = useHistory()
    const location = useLocation()
    const [secrets] = useRecoilState(secretsState)

    const providerConnections = secrets.map(unpackProviderConnection)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )

    const [managedClusters] = useRecoilState(managedClustersState)
    const [clusterCurators] = useRecoilState(clusterCuratorsState)
    const curatorTemplates = filterForTemplatedCurators(clusterCurators)
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const classes = useStyles()
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

    function templiflyOnChange(control: any) {
        if (control.id === 'templateName') {
            setSelectedTemplate(control.active)
        }
    }

    // create button
    const [creationStatus, setCreationStatus] = useState<CreationStatus>()
    const createResource = async (resourceJSON: { createResources: any[] }, control: any) => {
        if (resourceJSON) {
            const { createResources } = resourceJSON
            const map = keyBy(createResources, 'kind')
            const clusterName = get(map, 'ClusterDeployment.metadata.name')

            // return error if cluster name is already used
            const matchedManagedCluster = managedClusters.find((mc) => mc.metadata.name === clusterName)

            if (matchedManagedCluster) {
                return setCreationStatus({
                    status: 'ERROR',
                    messages: [{ message: `The cluster name is already used by another cluster.` }],
                })
            } else {
                // check if Template is selected
                if (selectedTemplate !== '') {
                    // set installAttemptsLimit to 0
                    createResources.forEach((resource) => {
                        if (resource.kind === 'ClusterDeployment') {
                            resource.spec.installAttemptsLimit = 0
                        }
                    })
                }

                setCreationStatus({ status: 'IN_PROGRESS', messages: [] })

                // creates managedCluster, deployment, secrets etc...
                const { status, messages } = await createCluster(createResources)
                setCreationStatus({ status, messages })

                if (status !== 'ERROR' && selectedTemplate !== '') {
                    // get template, modifty it and create curator cluster namespace
                    const currentTemplate = curatorTemplates.find(
                        (template) => template.metadata.name === selectedTemplate
                    )
                    const currentTemplateMutable: ClusterCurator = JSON.parse(JSON.stringify(currentTemplate))
                    if (currentTemplateMutable.spec?.install?.towerAuthSecret)
                        currentTemplateMutable.spec.install.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.scale?.towerAuthSecret)
                        currentTemplateMutable.spec.scale.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.upgrade?.towerAuthSecret)
                        currentTemplateMutable.spec.upgrade.towerAuthSecret = 'toweraccess'
                    if (currentTemplateMutable.spec?.destroy?.towerAuthSecret)
                        currentTemplateMutable.spec.destroy.towerAuthSecret = 'toweraccess'
                    delete currentTemplateMutable.metadata.creationTimestamp
                    delete currentTemplateMutable.metadata.resourceVersion

                    currentTemplateMutable!.metadata.name = createResources[0].metadata.namespace
                    currentTemplateMutable!.metadata.namespace = createResources[0].metadata.namespace
                    currentTemplateMutable!.spec!.desiredCuration = 'install'

                    createClusterCurator(currentTemplateMutable)

                    // get ansible secret, modifty it and create it in cluster namespace
                    const ansibleSecret = ansibleCredentials.find(
                        (secret) => secret.metadata.name === currentTemplate?.spec?.install?.towerAuthSecret
                    )
                    const ansibleSecretMutable: Secret = JSON.parse(JSON.stringify(ansibleSecret))
                    ansibleSecretMutable!.metadata.name = 'toweraccess'
                    ansibleSecretMutable!.metadata.namespace = createResources[0].metadata.namespace
                    ansibleSecretMutable!.metadata.labels!['cluster.open-cluster-management.io/copiedFromNamespace'] =
                        ansibleSecret?.metadata.namespace!
                    ansibleSecretMutable!.metadata.labels!['cluster.open-cluster-management.io/copiedFromSecretName'] =
                        ansibleSecret?.metadata.name!

                    delete ansibleSecretMutable.metadata.creationTimestamp
                    delete ansibleSecretMutable.metadata.resourceVersion
                    delete ansibleSecretMutable.metadata.labels!['cluster.open-cluster-management.io/credentials']

                    createResourceTool<Secret>(ansibleSecretMutable)
                }

                // redirect to created cluster
                if (status === 'DONE') {
                    setTimeout(() => {
                        history.push(NavigationPath.clusterDetails.replace(':id', clusterName as string))
                    }, 2000)
                }
            }
        }
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.clusters)
    }

    // pause creation to create something else
    const pauseCreate = () => {}

    // setup translation
    const { t } = useTranslation(['create'])
    const i18n = (key: any, arg: any) => {
        return t(key, arg)
    }

    let template = hiveTemplate
    // react-scripts HATE jest transforms so we got to load the templates ourselves
    if (typeof hiveTemplate === 'string') {
        template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, './templates/hive-template.hbs'), 'utf8'))
        Handlebars.registerPartial(
            'endpoints',
            Handlebars.compile(fs.readFileSync(path.resolve(__dirname, './templates/endpoints.hbs'), 'utf8'))
        )
    }

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

    const { canJoinClusterSets } = useCanJoinClusterSets()
    for (let i = 0; i < controlData.length; i++) {
        if (controlData[i].id === 'clusterSet' && controlData[i].available) {
            controlData[i].available = canJoinClusterSets?.map((mcs) => mcs.metadata.name) ?? []
        }
        if (controlData[i].id === 'infrastructure') {
            controlData[i]?.available?.forEach((provider) => {
                provider.change?.insertControlData?.forEach((control) => {
                    if (control.id === 'connection') {
                        setAvailableConnections(control, secrets)
                    }
                })
            })
        }
        if (controlData[i].id === 'templateName') {
            controlData[i].available = curatorTemplates.map((template) => template.metadata.name)
            setAvailableTemplates(controlData[i], curatorTemplates)
        }
    }

    // cluster set dropdown won't update without this
    if (canJoinClusterSets === undefined) {
        return null
    }

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('page.header.create-cluster')}
                    titleTooltip={
                        <>
                            {t('page.header.create-cluster.tooltip')}
                            <a
                                href={DOC_LINKS.CREATE_CLUSTER}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('clusters'), to: NavigationPath.clusters },
                        { text: t('page.header.create-cluster'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-cluster">
                    <PageSection className="pf-c-content" variant="light" isFilled type="wizard">
                        <TemplateEditor
                            wizardClassName={classes.wizardBody}
                            type={'cluster'}
                            title={'Cluster YAML'}
                            monacoEditor={<MonacoEditor />}
                            controlData={controlData}
                            template={template}
                            portals={Portals}
                            fetchControl={fetchControl}
                            createControl={{
                                createResource,
                                cancelCreate,
                                pauseCreate,
                                creationStatus: creationStatus?.status,
                                creationMsg: creationStatus?.messages,
                            }}
                            logging={process.env.NODE_ENV !== 'production'}
                            i18n={i18n}
                            onChange={templiflyOnChange}
                        />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}
