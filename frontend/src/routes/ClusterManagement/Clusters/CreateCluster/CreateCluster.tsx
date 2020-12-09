import { AcmPage, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { NavigationPath } from '../../../../NavigationPath'
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


export default function CreateClusterPage() {
    const { t } = useTranslation(['cluster'])
    const i18n = (key: any) => {
      return t(key)
    }

//              portals={Portals}
//              fetchControl={fetchControl}
//              createControl={createControl}
//              i18n={i18n}
//                controlData={controlData}
//                template={hiveTemplate}

    return (
        <AcmPage>
            <AcmPageHeader title={t('managed.createCluster')} breadcrumb={[{ text: t('clusters'), to: NavigationPath.clusters }]} />
            <PageSection className="pf-c-content">
              <TemplateEditor
                title={'Application YAML'}
                monacoEditor={<MonacoEditor />}
                controlData={controlData}
                template={hiveTemplate}
              />
            </PageSection>
        </AcmPage>
    )
}
