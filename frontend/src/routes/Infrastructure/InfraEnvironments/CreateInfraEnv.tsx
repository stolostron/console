/* Copyright Contributors to the Open Cluster Management project */
import { AcmErrorBoundary, AcmPage, AcmPageContent, AcmPageHeader } from '@open-cluster-management/ui-components'
import { PageSection } from '@patternfly/react-core'
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
import { createProject, createResource, IResource } from '../../../resources'
import { deleteResources } from '../../../lib/delete-resources'

const controlData = [
    {
        name: 'creation.ocp.cloud.connection',
        tooltip: 'tooltip.creation.ocp.cloud.connection',
        id: 'ai',
        type: 'custom',
        component: <InfraEnvForm />,
        providerId: 'aiNetwork',
    },
]

// where to put Create/Cancel buttons
const Portals = Object.freeze({
    editBtn: 'edit-button-portal-id',
    createBtn: 'create-button-portal-id',
    cancelBtn: 'cancel-button-portal-id',
})

const CreateInfraEnv: React.FC = () => {
    const template = Handlebars.compile(infraEnvTemplate)
    const history = useHistory()
    const { t } = useTranslation()
    const { t: tEditor } = useTranslation()
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
                    return
                }
            }

            const promises = createResources.map((resource: any) => createResource(resource).promise)
            // All resources must be resolved
            const responses = await Promise.allSettled(promises)
            const error = responses.find((result) => result.status === 'rejected')

            if (error) {
                const resourcesToDelete = createResources
                    .filter((r) => r.apiVersion && r.kind && r.metadata?.name && r.metadata?.namespace)
                    .map(
                        (r) =>
                            ({
                                apiVersion: r.apiVersion,
                                kind: r.kind,
                                metadata: { name: r.metadata.name, namespace: r.metadata.namespace },
                            } as IResource)
                    )
                try {
                    await deleteResources(resourcesToDelete).promise
                } finally {
                    setCreationStatus({
                        status: 'ERROR',
                        messages: [{ message: (error as PromiseRejectedResult).reason?.message }],
                    })
                }
            } else {
                setCreationStatus({ status: 'DONE', messages: [] })
                history.push(NavigationPath.infraEnvironments)
            }
        }
    }

    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('Create infrastructure environment')}
                    breadcrumb={[
                        { text: t('Infrastructure environments'), to: NavigationPath.infraEnvironments },
                        { text: t('Create infrastructure environment'), to: '' },
                    ]}
                    switches={switches}
                    actions={portals}
                />
            }
        >
            <AcmErrorBoundary>
                <AcmPageContent id="create-infra-env">
                    <PageSection className="pf-c-content" variant="light" isFilled>
                        <TemplateEditor
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
