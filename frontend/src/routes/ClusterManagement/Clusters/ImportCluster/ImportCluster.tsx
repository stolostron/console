/* Copyright Contributors to the Open Cluster Management project */

import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmButton,
    AcmExpandableSection,
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageContent,
    AcmPageHeader,
    AcmSelect,
    AcmSubmit,
    AcmTextArea,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import {
    ActionGroup,
    Button,
    Label,
    PageSection,
    SelectOption,
    Stack,
    StackItem,
    Text,
    TextVariants,
} from '@patternfly/react-core'
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon'
import '@patternfly/react-styles/css/components/CodeEditor/code-editor.css'
import { Fragment, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { deleteResources } from '../../../../lib/delete-resources'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { createResource, ResourceError, ResourceErrorCode } from '../../../../lib/resource-request'
import { NavigationPath } from '../../../../NavigationPath'
import { createKlusterletAddonConfig } from '../../../../resources/klusterlet-add-on-config'
import { createManagedCluster } from '../../../../resources/managed-cluster'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { createProject } from '../../../../resources/project'
import { IResource } from '../../../../resources/resource'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import { useCanJoinClusterSets } from '../../ClusterSets/components/useCanJoinClusterSets'
import { ImportCommand, pollImportYamlSecret } from '../components/ImportCommand'

export default function ImportClusterPage() {
    const { t } = useTranslation(['cluster'])
    return (
        <AcmPage
            header={
                <AcmPageHeader
                    title={t('page.header.import-cluster')}
                    breadcrumb={[
                        { text: t('clusters'), to: NavigationPath.clusters },
                        { text: t('page.header.import-cluster'), to: '' },
                    ]}
                    titleTooltip={
                        <>
                            {t('page.header.import-cluster.tooltip')}
                            <a
                                href={DOC_LINKS.IMPORT_CLUSTER}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'block', marginTop: '4px' }}
                            >
                                {t('common:learn.more')}
                            </a>
                        </>
                    }
                />
            }
        >
            <AcmPageContent id="import-cluster">
                <PageSection variant="light" isFilled>
                    <ImportClusterPageContent />
                </PageSection>
            </AcmPageContent>
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const { t } = useTranslation(['cluster', 'common'])
    const alertContext = useContext(AcmAlertContext)
    const history = useHistory()
    const { canJoinClusterSets } = useCanJoinClusterSets()
    const [clusterName, setClusterName] = useState<string>(sessionStorage.getItem('DiscoveredClusterName') ?? '')
    const [managedClusterSet, setManagedClusterSet] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<Record<string, string> | undefined>({})
    const [submitted, setSubmitted] = useState<boolean>(false)
    const [importCommand, setImportCommand] = useState<string | undefined>()
    //    const [Username, setUsername] = useState<string | undefined>()
    //    const [Password, setPassword] = useState<string | undefined>()
    const [importMode, setimportMode] = useState<string | undefined>()
    // const [credentialMode, setcredentialMode] = useState<string | undefined>()
    const [kubeConfigText, setkubeConfigText] = useState<string | undefined>()
    const [manualButton, setmanualButton] = useState<boolean>(false)
    const [credentialBool] = useState<boolean>(false)
    const onReset = () => {
        setClusterName('')
        setManagedClusterSet(undefined)
        setAdditionaLabels({})
        setSubmitted(false)
        setImportCommand(undefined)
    }

    return (
        <Stack hasGutter>
            <StackItem>
                <AcmExpandableSection label={t('import.form.header')} expanded={true}>
                    <AcmForm id="import-cluster-form">
                        <AcmTextInput
                            id="clusterName"
                            label={t('import.form.clusterName.label')}
                            value={clusterName}
                            isDisabled={submitted}
                            onChange={(name) => setClusterName(name)}
                            placeholder={t('import.form.clusterName.placeholder')}
                            isRequired
                        />
                        <AcmSelect
                            id="managedClusterSet"
                            label={t('import.form.managedClusterSet.label')}
                            placeholder={t('import.form.managedClusterSet.placeholder')}
                            labelHelp={t('import.form.managedClusterSet.labelHelp')}
                            value={managedClusterSet}
                            onChange={(mcs) => setManagedClusterSet(mcs)}
                            isDisabled={
                                canJoinClusterSets === undefined || canJoinClusterSets.length === 0 || submitted
                            }
                        >
                            {canJoinClusterSets?.map((mcs) => (
                                <SelectOption key={mcs.metadata.name} value={mcs.metadata.name}>
                                    {mcs.metadata.name}
                                </SelectOption>
                            ))}
                        </AcmSelect>
                        <AcmLabelsInput
                            id="additionalLabels"
                            label={t('import.form.labels.label')}
                            buttonLabel={t('common:label.add')}
                            value={additionalLabels}
                            onChange={(label) => setAdditionaLabels(label)}
                            placeholder={t('labels.edit.placeholder')}
                            isDisabled={submitted}
                        />
                    </AcmForm>
                </AcmExpandableSection>
            </StackItem>
            <StackItem>
                <AcmExpandableSection label={t('import.mode.header')} expanded={true}>
                    <AcmForm>
                        <AcmSelect
                            id="import-mode"
                            label={t('import.mode.select')}
                            placeholder={t('import.mode.default')}
                            value={importMode}
                            onChange={(id) => {
                                setimportMode(id)
                                switch (id) {
                                    case 'automatic-import':
                                        setmanualButton(false)
                                        break
                                    case 'manual-import':
                                        setmanualButton(true)
                                        break
                                    default:
                                        setmanualButton(false)
                                }
                            }}
                        >
                            <SelectOption key="automatic-import" value="automatic-import">
                                {t('import.auto.choice')}
                            </SelectOption>
                            <SelectOption key="manual-import" value="manual-import">
                                {t('import.manual.choice')}
                            </SelectOption>
                        </AcmSelect>
                        {!manualButton && (
                            <Text component={TextVariants.small}>{t('import.credential.explanation')} </Text>
                        )}
                        {/* {!manualButton && (
                            <AcmSelect
                                label={t('import.credential.select')}
                                placeholder={t('import.credential.default')}
                                value={credentialMode}
                                onChange={(id) => {
                                    setcredentialMode(id)
                                    switch (id) {
                                        case 'credentials':
                                            setcredentialBool(true)
                                            break
                                        case 'kubeconfig':
                                            setcredentialBool(false)
                                            break
                                        default:
                                            setcredentialBool(false)
                                    }
                                }}
                            > */}
                        {/* <SelectOption key="credentials" value="credentials">
                                {t('import.credential.choice')}
                            </SelectOption> */}
                        {/* <SelectOption key="kubeconfig" value="kubeconfig">
                                    {t('import.config.choice')}
                                </SelectOption>
                            </AcmSelect>
                        )} */}

                        {/* <AcmTextInput
                        id="username"
                        label={t('import.username')}
                        placeholder={t('import.username.place')}
                        value={Username}
                        onChange={(username) => {
                            setUsername(username)
                        }}
                        isRequired
                        hidden={manualButton || !credentialBool}
                    />
                    <AcmTextInput
                        id="password"
                        label={t('import.password')}
                        placeholder={t('import.password.place')}
                        value={Password}
                        onChange={(password) => {
                            setPassword(password)
                        }}
                        isRequired            
                        hidden={manualButton || !credentialBool}
                    /> */}
                        <AcmTextArea
                            id="kubeConfigEntry"
                            label={t('import.auto.config.label')}
                            placeholder={t('import.auto.config.prompt')}
                            value={kubeConfigText}
                            onChange={(file) => {
                                setkubeConfigText(file)
                            }}
                            hidden={credentialBool || manualButton}
                            isRequired
                        />

                        {manualButton && <Text component={TextVariants.small}>{t('import.description')}; </Text>}

                        <AcmAlertGroup isInline canClose padTop />
                        <ActionGroup>
                            <AcmSubmit
                                id="submit"
                                variant="primary"
                                isDisabled={!clusterName || submitted}
                                onClick={async () => {
                                    setSubmitted(true)
                                    alertContext.clearAlerts()
                                    /* istanbul ignore next */
                                    const clusterLabels: Record<string, string> = {
                                        cloud: 'auto-detect',
                                        vendor: 'auto-detect',
                                        name: clusterName,
                                        ...additionalLabels,
                                    }
                                    if (managedClusterSet) {
                                        clusterLabels[managedClusterSetLabel] = managedClusterSet
                                    }
                                    const createdResources: IResource[] = []
                                    return new Promise(async (resolve, reject) => {
                                        try {
                                            try {
                                                createdResources.push(await createProject(clusterName).promise)
                                            } catch (err) {
                                                const resourceError = err as ResourceError
                                                if (resourceError.code !== ResourceErrorCode.Conflict) {
                                                    throw err
                                                }
                                            }
                                            createdResources.push(
                                                await createManagedCluster({ clusterName, clusterLabels }).promise
                                            )
                                            createdResources.push(
                                                await createKlusterletAddonConfig({ clusterName, clusterLabels })
                                                    .promise
                                            )

                                            if (!manualButton) {
                                                createdResources.push(
                                                    await createResource<Secret>({
                                                        apiVersion: SecretApiVersion,
                                                        kind: SecretKind,
                                                        metadata: {
                                                            name: 'auto-import-secret',
                                                            namespace: clusterName,
                                                        },
                                                        stringData: {
                                                            autoImportRetry: '2',
                                                            kubeconfig: kubeConfigText,
                                                        },
                                                        type: 'Opaque',
                                                    } as Secret).promise
                                                )
                                                    ? history.push(
                                                          NavigationPath.clusterDetails.replace(
                                                              ':id',
                                                              clusterName as string
                                                          )
                                                      )
                                                    : onReset()
                                            } else {
                                                setImportCommand(await pollImportYamlSecret(clusterName))
                                            }
                                        } catch (err) {
                                            if (err instanceof Error) {
                                                alertContext.addAlert({
                                                    type: 'danger',
                                                    title: err.name,
                                                    message: err.message,
                                                })
                                            }
                                            await deleteResources(createdResources).promise
                                            setSubmitted(false)
                                            reject()
                                        } finally {
                                            resolve(undefined)
                                        }
                                    })
                                }}
                                label={
                                    submitted
                                        ? t('import.form.submitted')
                                        : manualButton
                                        ? t('import.form.submit')
                                        : t('import.auto.button')
                                }
                                processingLabel={t('import.generating')}
                            />

                            {submitted ? (
                                <Label variant="outline" color="blue" icon={<CheckCircleIcon />}>
                                    {t('import.importmode.importsaved')}
                                </Label>
                            ) : (
                                <Link to={NavigationPath.clusters} id="cancel">
                                    <Button variant="link">{t('common:cancel')}</Button>
                                </Link>
                            )}
                        </ActionGroup>
                        {importCommand && (
                            <Fragment>
                                <ImportCommand importCommand={importCommand}>
                                    <ActionGroup>
                                        <Link to={NavigationPath.clusterDetails.replace(':id', clusterName as string)}>
                                            <Button variant="primary">{t('import.footer.viewcluster')}</Button>
                                        </Link>
                                        <AcmButton
                                            variant="secondary"
                                            role="link"
                                            onClick={() => {
                                                sessionStorage.getItem('DiscoveredClusterConsoleURL')
                                                    ? history.push(NavigationPath.discoveredClusters)
                                                    : onReset()
                                            }}
                                        >
                                            {t('import.footer.importanother')}
                                        </AcmButton>
                                    </ActionGroup>
                                </ImportCommand>
                            </Fragment>
                        )}
                    </AcmForm>
                </AcmExpandableSection>
            </StackItem>
        </Stack>
    )
}
