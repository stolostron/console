/* Copyright Contributors to the Open Cluster Management project */
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
import { makeStyles } from '@material-ui/styles'
import Handlebars from 'handlebars'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MonacoEditor from 'react-monaco-editor'
import { useHistory } from 'react-router'
import TemplateEditor from 'temptifly'

import { NavigationPath } from '../../../NavigationPath'
import infraEnvTemplate from './infraenv-template.hbs'
import InfraEnvForm from './InfraEnvForm'

// include monaco editor
import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import '../Clusters/ManagedClusters/CreateCluster/style.css'
import 'temptifly/dist/styles.css'
import { createProject, createResource } from '../../../resources'

const controlData = [
    {
        id: 'aiStep',
        type: 'step',
        title: 'Configure environment',
    },
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'ai',
        type: 'custom',
        component: <InfraEnvForm />,
        providerId: 'aiNetwork',
    },
]

const useStyles = makeStyles({
    wizardBody: {
        '& .pf-c-wizard__outer-wrap .pf-c-wizard__main .pf-c-wizard__main-body': {
            height: '100%',
        },
    },
})

// where to put Create/Cancel buttons
const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

const CreateInfraEnv: React.FC = () => {
    const template = Handlebars.compile(infraEnvTemplate)
    const classes = useStyles()
    const history = useHistory()
    const { t } = useTranslation(['infraenv', 'common'])
    const { t: tEditor } = useTranslation(['create'])
    const i18n = (key: any, arg: any) => {
        return tEditor(key, arg)
    }

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
    const [creationStatus, setCreationStatus] = useState<{
        status: string
        messages: any[] | undefined
    }>()

    const createInfraEnv = async (resourceJSON: { createResources: any[] }) => {
        if (resourceJSON) {
            setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
            const { createResources } = resourceJSON
            const infraEnv = createResources.find((r) => r.kind === 'InfraEnv')
            try {
                await createProject(infraEnv.metadata.namespace).promise
            } catch (err) {
                if ((err as unknown as { code: number }).code !== 409) {
                    setCreationStatus({
                        status: 'ERROR',
                        messages: [{ message: (err as unknown as Error).message }],
                    })
                }
            }
            const promises = createResources.map((resource: any) => createResource(resource))
            try {
                await Promise.allSettled(promises)
                setCreationStatus({ status: 'DONE', messages: [] })
                history.push(NavigationPath.infraEnvironments)
            } catch (err) {
                setCreationStatus({
                    status: 'ERROR',
                    messages: [{ message: (err as unknown as Error).message }],
                })
            }
        }
    }

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('infraenv:createInfraEnv.title')}
                    titleTooltip={
                        <>
                            {t('infraenv:createInfraEnv.title.tooltip')}
                            <a
                                href="foo"
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('infraenv:infraenvs'), to: NavigationPath.infraEnvironments },
                        { text: t('infraenv:createInfraEnv.title'), to: '' },
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
                            type="Infra env"
                            title="InfraEnv YAML"
                            monacoEditor={<MonacoEditor />}
                            controlData={controlData}
                            template={template}
                            portals={Portals}
                            createControl={{
                                createResource: createInfraEnv,
                                cancelCreate: () => history.push(NavigationPath.infraEnvironments),
                                pauseCreate: () => {},
                                creationStatus: creationStatus?.status,
                                creationMsg: creationStatus?.messages,
                            }}
                            logging={process.env.NODE_ENV !== 'production'}
                            i18n={i18n}
                        />
                    </PageSection>
                </AcmPageContent>
            </AcmErrorBoundary>
        </AcmPage>
    )
}

export default CreateInfraEnv
