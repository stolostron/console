import { Alert, AlertVariant, Button, ButtonVariant } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
    WizDetailsHidden,
    EditMode,
    WizKeyValue,
    Section,
    WizSelect,
    Step,
    WizardCancel,
    WizardPage,
    WizardSubmit,
    WizCheckbox,
    WizNumberInput,
} from '../../src'
import { IResource } from '../../src/common/resource'
import { ConfigMap } from '../common/resources/IConfigMap'
import { ICredential } from '../common/resources/ICredential'
import { IPolicyAutomation, PolicyAutomationType } from '../common/resources/IPolicyAutomation'

export function PolicyAutomationWizard(props: {
    title: string
    breadcrumb?: { label: string; to?: string }[]
    policy: IResource
    credentials: IResource[]
    configMaps?: ConfigMap[]
    createCredentialsCallback: () => void
    editMode?: EditMode
    yamlEditor?: () => ReactNode
    resource: IPolicyAutomation
    onSubmit: WizardSubmit
    onCancel: WizardCancel
    getAnsibleJobsCallback: (credential: ICredential) => Promise<string[]>
    isAnsibleOperatorInstalled: boolean
}) {
    const ansibleCredentials = useMemo(
        () => props.credentials.filter((credential) => credential.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'),
        [props.credentials]
    )
    const ansibleCredentialNames = useMemo(
        () => ansibleCredentials.map((credential) => credential.metadata?.name ?? ''),
        [ansibleCredentials]
    )
    const [jobNames, setJobNames] = useState<string[]>()
    const [alert, setAlert] = useState<{ title: string; message: string }>()

    function getOperatorError() {
        const openShiftConsoleConfig = props.configMaps?.find((configmap) => configmap.metadata?.name === 'console-public')
        const openShiftConsoleUrl: string = openShiftConsoleConfig?.data?.consoleURL
        return (
            <div>
                {'The Ansible Automation Platform Resource Operator is required to create an Ansible job. '}
                {openShiftConsoleUrl && openShiftConsoleUrl !== '' ? (
                    <div>
                        {'Install the Operator through the following link: '}
                        <Button
                            isInline
                            variant={ButtonVariant.link}
                            onClick={() =>
                                window.open(openShiftConsoleUrl + '/operatorhub/all-namespaces?keyword=ansible+automation+platform')
                            }
                        >
                            OperatorHub
                            <ExternalLinkAltIcon style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </Button>
                    </div>
                ) : (
                    'Install the Operator through operator hub.'
                )}
            </div>
        )
    }

    useEffect(() => {
        if (props.editMode === EditMode.Edit) {
            const credential = ansibleCredentials.find(
                (credential) => credential.metadata?.name === props.resource.spec?.automationDef?.secret
            )
            props
                .getAnsibleJobsCallback(credential ?? {})
                .then((jobNames) => setJobNames(jobNames))
                .catch((err) => {
                    if (err instanceof Error) {
                        setAlert({ title: 'Failed to get job names from ansible', message: err.message })
                    } else {
                        setAlert({ title: 'Failed to get job names from ansible', message: 'Unknown error' })
                    }
                })
        }
    }, [ansibleCredentials, props])

    return (
        <WizardPage
            title={props.title}
            breadcrumb={props.breadcrumb}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            editMode={props.editMode}
            yamlEditor={props.yamlEditor}
            defaultData={
                props.resource ?? {
                    ...PolicyAutomationType,
                    metadata: {
                        name: `${props.policy.metadata?.name ?? ''}-policy-automation`,
                        namespace: props.policy.metadata?.namespace,
                    },
                    spec: {
                        policyRef: props.policy.metadata?.name,
                        mode: 'once',
                        automationDef: { name: '', secret: '', type: 'AnsibleJob' },
                    },
                }
            }
        >
            <Step label="Automation" id="automation-step">
                {!props.isAnsibleOperatorInstalled && <Alert isInline title={getOperatorError()} variant={AlertVariant.danger} />}
                <Section label="Policy automation">
                    {alert && (
                        <WizDetailsHidden>
                            <Alert title={alert.title} isInline variant="danger">
                                {alert.message}
                            </Alert>
                        </WizDetailsHidden>
                    )}
                    <WizSelect
                        id="secret"
                        label="Ansible credential"
                        path="spec.automationDef.secret"
                        options={ansibleCredentialNames}
                        onValueChange={(value, item) => {
                            if ((item as IPolicyAutomation).spec?.automationDef?.name) {
                                ;(item as IPolicyAutomation).spec.automationDef.name = ''
                            }
                            const credential = ansibleCredentials.find((credential) => credential.metadata?.name === value)
                            if (credential) {
                                setAlert(undefined)
                                setJobNames(undefined)
                                props
                                    .getAnsibleJobsCallback(credential)
                                    .then((jobNames) => setJobNames(jobNames))
                                    .catch((err) => {
                                        if (err instanceof Error) {
                                            setAlert({ title: 'Failed to get job names from ansible', message: err.message })
                                        } else {
                                            setAlert({ title: 'Failed to get job names from ansible', message: 'Unknown error' })
                                        }
                                    })
                            }
                        }}
                        footer={
                            <>
                                <Button
                                    id={'create-credential'}
                                    isInline
                                    variant={ButtonVariant.link}
                                    onClick={props.createCredentialsCallback}
                                >
                                    {'Create credential'}
                                </Button>
                            </>
                        }
                        required
                    />
                    <WizSelect
                        id="job"
                        label="Ansible job"
                        path="spec.automationDef.name"
                        options={jobNames}
                        hidden={(item) => !item.spec?.automationDef?.secret}
                        required
                    />
                    <WizKeyValue
                        id="extra_vars"
                        path="spec.automationDef.extra_vars"
                        label="Extra variables"
                        placeholder="Add variable"
                        hidden={(item) => !item.spec?.automationDef?.name}
                    />
                    <WizSelect
                        id="mode"
                        label="Schedule"
                        labelHelp={
                            <div>
                                <p>
                                    <strong>Run everyEvent:</strong> When a policy is violated, the automation runs every time for each
                                    unique policy violation per managed cluster.
                                </p>
                                <p>
                                    <strong>Run once:</strong> When a policy is violated, the automation runs one time, after which it is
                                    disabled.
                                </p>
                                <p>
                                    <strong>Disabled:</strong> The automation does not run automatically.
                                </p>
                                <p>{`(To run automation manually, select "Disabled" and check the "Manual run" checkbox.)`}</p>
                            </div>
                        }
                        path="spec.mode"
                        options={[
                            { label: 'Once', value: 'once' },
                            { label: 'EveryEvent', value: 'everyEvent' },
                            { label: 'Disabled', value: 'disabled' },
                        ]}
                        hidden={(item) => !item.spec?.automationDef?.name}
                        required
                        onValueChange={(value, item) => {
                            if (
                                value !== 'disabled' &&
                                item.metadata?.annotations?.['policy.open-cluster-management.io/rerun'] === 'true'
                            ) {
                                item.metadata.annotations['policy.open-cluster-management.io/rerun'] = 'false'
                            }
                        }}
                    />
                    <WizCheckbox
                        hidden={(item) => item.spec?.mode !== 'disabled'}
                        path="metadata.annotations.policy\.open-cluster-management\.io/rerun"
                        label="Manual run: Set this automation to run once. After the automation runs, it is set to disabled."
                        inputValueToPathValue={(inputValue) => {
                            // inputValue is either true or false - this fn returns the string of the current boolean.
                            if (inputValue) {
                                return 'true'
                            } else {
                                return 'false'
                            }
                        }}
                    />
                    <WizNumberInput
                        hidden={(item) => item.spec?.mode !== 'everyEvent'}
                        path="spec.delayAfterRunSeconds"
                        label="Delay After Run Seconds"
                        labelHelp="DelayAfterRunSeconds is the minimum seconds before an automation can be restarted on the same cluster. 
                        When a policy is violated, the automation runs one time before the delay period.
                        If the policy is violated multiple times during the delay period and kept in the violated state, 
                        the automation runs one time after the delay period. 
                        The default is 0 seconds and is only applicable for the everyEvent mode."
                        helperText="The period in seconds."
                    />
                </Section>
            </Step>
        </WizardPage>
    )
}
