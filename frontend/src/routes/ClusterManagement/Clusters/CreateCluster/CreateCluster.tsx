import React, { useState } from 'react'
import { AcmPage, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { get, keyBy } from 'lodash-es'
import './style.scss'

// data
import {controlData} from './controlData/ControlData'

//import TemplateEditor from 'temptifly'
import TemplateEditor from 'C:/Users/jswanke/git/temptifly/src'

// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickCommand.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens'
declare const window: any;
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

// template
declare function require(module: string): any;
let hiveTemplate = require('./templates/hive-template.hbs');

// where to put Create/Cancel buttons
const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  createBtn: 'create-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
})

export default function CreateClusterPage() {

    // create portals for buttons in header
    const portals = 
      <div className='portal-controls'>
        <div id={Portals.editBtn} />
        <div id={Portals.cancelBtn} />
        <div id={Portals.createBtn} />
      </div>
      
    // create button
    const [clusterName, setClusterName] = useState<string>()
    const [clusterNamespace, setClusterNamespace] = useState<string>()
    const createResource = (resourceJSON: any[]) => {
      if (resourceJSON) {
        //handleCreateCluster(resourceJSON)
        const map =keyBy(resourceJSON, 'kind')
        setClusterName(get(map, 'ClusterDeployment.metadata.name'))
        setClusterNamespace(get(map, 'ClusterDeployment.metadata.namespace'))
      }
    }

    // cancel button
    const history = useHistory()
    const cancelCreate = () => {
        history.push(NavigationPath.clusters)
    }
    const createControl = {
      createResource,
      cancelCreate,
      //creationStatus: mutateStatus,
      //creationMsg: mutateErrorMsgs,
    }
  
    // setup translation
    const { t } = useTranslation(['create'])
    const i18n = (key: any, arg: any) => {
      return t(key, arg)
    }

    return (
        <AcmPage>
            <AcmPageHeader 
              title={t('managed.createCluster')} 
              breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }]}
              actions={portals}
            />
            <PageSection className="pf-c-content">
              <TemplateEditor
                type={'cluster'}
                title={'Cluster YAML'}
                monacoEditor={<MonacoEditor />}
                controlData={controlData}
                template={hiveTemplate}
                portals={Portals}
                createControl={createControl}
                i18n={i18n}
              />
            </PageSection>
        </AcmPage>
    )
}
