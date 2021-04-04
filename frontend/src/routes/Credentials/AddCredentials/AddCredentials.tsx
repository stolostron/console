/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmEmptyState,
    AcmForm,
    AcmInlineProvider,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
    Provider,
} from '@open-cluster-management/ui-components'
import { AcmTextArea } from '@open-cluster-management/ui-components/lib/AcmTextArea/AcmTextArea'
import { ActionGroup, Button, PageSection, SelectOption, Title } from '@patternfly/react-core'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { featureGatesState, namespacesState, multiClusterHubState } from '../../../atoms'
import { ErrorPage } from '../../../components/ErrorPage'
import { LoadingPage } from '../../../components/LoadingPage'
import { DOC_LINKS } from '../../../lib/doc-util'
import { ProviderID, providers } from '../../../lib/providers'
import { getAuthorizedNamespaces, rbacCreate } from '../../../lib/rbac-util'
import { IRequestResult } from '../../../lib/resource-request'
import {
    validateCertificate,
    validateGCProjectID,
    validateImageMirror,
    validateJSON,
    validateKubernetesDnsName,
    validateLibvirtURI,
    validatePrivateSshKey,
    validatePublicSshKey,
} from '../../../lib/validation'
import { NavigationPath } from '../../../NavigationPath'
import {
    createProviderConnection,
    getProviderConnection,
    getProviderConnectionProviderID,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionDefinition,
    ProviderConnectionKind,
    replaceProviderConnection,
    setProviderConnectionProviderID,
} from '../../../resources/provider-connection'
import { CreateProviderWizard } from './components/CreateProviderWizard'

export default function AddCredentialPage({ match }: RouteComponentProps<{ namespace: string; name: string }>) {
    const { t } = useTranslation(['connection', 'common'])
    return (
        <AcmPage>
            {match?.params.namespace ? (
                <AcmPageHeader
                    title={t('editConnection.title')}
                    titleTooltip={
                        <>
                            {t('addConnection.title.tooltip')}
                            <a
                                href={DOC_LINKS.CREATE_CONNECTION}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('connections'), to: NavigationPath.credentials },
                        { text: t('editConnection.title'), to: '' },
                    ]}
                />
            ) : (
                <AcmPageHeader
                    title={t('addConnection.title')}
                    titleTooltip={
                        <>
                            {t('addConnection.title.tooltip')}
                            <a
                                href={DOC_LINKS.CREATE_CONNECTION}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                    breadcrumb={[
                        { text: t('connections'), to: NavigationPath.credentials },
                        { text: t('addConnection.title'), to: '' },
                    ]}
                />
            )}
            <AcmPageContent id="add-credentials">
                <PageSection variant="light" isFilled>
                    <AddCredentialPageData namespace={match?.params.namespace} name={match?.params.name} />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function AddCredentialPageData(props: { namespace: string; name: string }) {
    const { t } = useTranslation(['connection', 'common'])
    const [namespaces] = useRecoilState(namespacesState)
    const [projects, setProjects] = useState<string[]>([])
    const [error, setError] = useState<Error>()
    const [retry, setRetry] = useState(0)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const [providerConnection, setProviderConnection] = useState<ProviderConnection>({
        apiVersion: ProviderConnectionApiVersion,
        kind: ProviderConnectionKind,
        metadata: {
            name: '',
            namespace: '',
        },
        spec: {
            awsAccessKeyID: '',
            awsSecretAccessKeyID: '',

            baseDomainResourceGroupName: '',
            clientId: '',
            clientSecret: '',
            subscriptionId: '',
            tenantId: '',

            gcProjectID: '',
            gcServiceAccountKey: '',

            username: '',
            password: '',
            vcenter: '',
            cacertificate: '',
            vmClusterName: '',
            datacenter: '',
            datastore: '',

            libvirtURI: '',
            sshKnownHosts: [''],
            imageMirror: '',
            bootstrapOSImage: '',
            clusterOSImage: '',
            additionalTrustBundle: '',

            baseDomain: '',
            pullSecret: '',
            sshPrivatekey: '',
            sshPublickey: '',

            ocmAPIToken: '',
        },
    })

    useEffect(() => {
        setError(undefined)
        setProjects([])
        setIsLoading(true)
    }, [retry])

    // create connection
    useEffect(() => {
        if (!props.namespace) {
            getAuthorizedNamespaces([rbacCreate(ProviderConnectionDefinition)], namespaces)
                .then((namespaces: string[]) => setProjects(namespaces))
                .catch(setError)
                .finally(() => setIsLoading(false))
        }
    }, [props.namespace, namespaces])

    // edit connection
    useEffect(() => {
        if (props.name) {
            setProjects([props.namespace])
            const result = getProviderConnection(props)
            result.promise
                .then((providerConnection) => {
                    setProviderConnection(providerConnection)
                })
                .catch(setError)
                .finally(() => setIsLoading(false))
            return result.abort
        }
    }, [retry, props])

    if (error) {
        return (
            <ErrorPage
                error={error}
                actions={
                    <AcmButton
                        onClick={() => {
                            setRetry(retry + 1)
                        }}
                    >
                        {t('common:retry')}
                    </AcmButton>
                }
            />
        )
    }
    if (isLoading) {
        return <LoadingPage />
    }

    if (projects.length === 0) {
        return (
            <AcmEmptyState
                title={t('common:rbac.title.unauthorized')}
                message={t('common:rbac.namespaces.unauthorized')}
                showIcon={false}
            />
        )
    }

    return <AddCredentialPageContent providerConnection={providerConnection} projects={projects} />
}

const useStyles = makeStyles({
    providerSelect: {
        '& .pf-c-select__toggle-text': {
            padding: '4px 0',
        },
    },
})

export function AddCredentialPageContent(props: { providerConnection: ProviderConnection; projects: string[] }) {
    const { t } = useTranslation(['connection'])
    const history = useHistory()
    const [featureGates] = useRecoilState(featureGatesState)
    const discoveryFeatureGate = featureGates.find((fg) => fg.metadata.name === 'open-cluster-management-discovery')
    const isEditing = () => props.providerConnection.metadata.name !== ''
    const alertContext = useContext(AcmAlertContext)
    const [providerConnection, setProviderConnection] = useState<ProviderConnection>(
        JSON.parse(JSON.stringify(props.providerConnection))
    )
    // useEffect(() => {
    //     setProviderConnection(JSON.parse(JSON.stringify(props.providerConnection)))
    // }, [props.providerConnection])
    // function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
    //     const copy = { ...providerConnection }
    //     update(copy)
    //     setProviderConnection(copy)
    // }
    const [multiClusterHubs] = useRecoilState(multiClusterHubState)
    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }

    // const classes = useStyles()

    return (
        <CreateProviderWizard
            providerConnection={props.providerConnection}
            setProviderConnection={setProviderConnection}
            projects={props.projects}
            discoveryFeatureGate={discoveryFeatureGate}
        />
    )
}
