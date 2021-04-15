/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { AcmPage, AcmPageHeader, AcmErrorBoundary } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { createCluster } from '../../../../lib/create-cluster'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { namespacesState } from '../../../../atoms'
import { useCanJoinClusterSets } from '../../ClusterSets/components/useCanJoinClusterSets'
import './style.css'

// template/data
import { controlData } from './controlData/ControlData'
import hiveTemplate from './templates/hive-template.hbs'

import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'

// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickCommand.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
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
            'editor.background': editorBackground?.value,
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

export default function CreateClusterPoolPage() {
    const history = useHistory()
    const location = useLocation()
    const [namespaces] = useRecoilState(namespacesState)

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
                setTimeout(() => {
                    history.push(NavigationPath.clusterPools)
                }, 2000)
            }
        }
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.clusterPools)
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
            break
        }
    }

    controlData[2].available = namespaces.map((namespace) => namespace.metadata.name) as string[]

    // cluster set dropdown won't update without this
    if (canJoinClusterSets === undefined) {
        return null
    }

    return (
        <AcmPage>
            <AcmPageHeader
                title={t('page.header.create-clusterPool')}
                titleTooltip={
                    <>
                        {t('page.header.create-clusterPool.tooltip')}
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
                    { text: t('clusterPools'), to: NavigationPath.clusterPools },
                    { text: t('page.header.create-clusterPool'), to: '' },
                ]}
                switches={switches}
                actions={portals}
            />
            <AcmErrorBoundary>
                <PageSection className="pf-c-content">
                    <TemplateEditor
                        type={'ClusterPool'}
                        title={'ClusterPool YAML'}
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
                    />
                </PageSection>
            </AcmErrorBoundary>
        </AcmPage>
    )
}
