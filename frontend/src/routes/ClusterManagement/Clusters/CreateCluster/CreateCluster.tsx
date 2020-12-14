import React from 'react'
import { AcmPage, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { get, keyBy } from 'lodash-es'
import './style.scss'

// data
import {controlData} from './controlData/ControlData'

import TemplateEditor from 'temptifly'
import 'temptifly/dist/styles.css'

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
    const history = useHistory()

    // create portals for buttons in header
    const portals = 
      <div className='portal-controls'>
        <div id={Portals.editBtn} />
        <div id={Portals.cancelBtn} />
        <div id={Portals.createBtn} />
      </div>
      
    // create button
    const createResource = (resourceJSON: any[]) => {
      if (resourceJSON) {
        
        //handleCreateCluster(resourceJSON)

        // redirect to created cluster
        const map =keyBy(resourceJSON, 'kind')
        const clusterName = get(map, 'ClusterDeployment.metadata.name')
        history.push(NavigationPath.clusterDetails.replace(':id', clusterName as string))
      }
    }

    // cancel button
    const cancelCreate = () => {
        history.push(NavigationPath.clusters)
    }

    // pause creation to create something else
    const pauseCreate = () => {
      //    const {
      //      history: { location },
      //      updateFormState,
      //      savedFormData
      //    } = this.props
      //    const { controlData } = this.state
      //    // persist user selections if they click Add connection
      //    if (location.search === '?createCluster') {
      //      updateFormState(controlData)
      //    } else {
      //      savedFormData && updateFormState(null)
      //    }
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
                createControl={{
                  createResource,
                  cancelCreate,
                  pauseCreate,
                  //creationStatus: mutateStatus,
                  //creationMsg: mutateErrorMsgs,
                }}
                i18n={i18n}
              />
            </PageSection>
        </AcmPage>
    )
}
