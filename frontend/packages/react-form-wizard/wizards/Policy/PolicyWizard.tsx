import { Alert, Button, Stack, Text, Title } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { klona } from 'klona/json'
import { Fragment, ReactNode, useContext, useMemo } from 'react'
import set from 'set-value'
import {
    EditMode,
    Radio,
    Section,
    WizSelect,
    Step,
    StringsMapInput,
    WizardCancel,
    WizardPage,
    WizardSubmit,
    WizArrayInput,
    WizCheckbox,
    WizDetailsHidden,
    WizHidden,
    WizItemSelector,
    WizKeyValue,
    WizNumberInput,
    WizRadioGroup,
    WizSingleSelect,
    WizStringsInput,
    WizTextInput,
} from '../../src'
import { useEditMode } from '../../src/contexts/EditModeContext'
import { ItemContext, useItem } from '../../src/contexts/ItemContext'
import { IResource } from '../../src/common/resource'
import { IClusterSetBinding } from '../common/resources/IClusterSetBinding'
import { PlacementBindingKind } from '../common/resources/IPlacementBinding'
import { PlacementRuleKind } from '../common/resources/IPlacementRule'
import { PolicyApiGroup, PolicyKind, PolicyType } from '../common/resources/IPolicy'
import { Sync } from '../../src/Sync'
import { isValidKubernetesResourceName, validatePolicyName } from '../common/validation'
import { MatchExpression, MatchExpressionCollapsed } from '../Placement/MatchExpression'
import { PlacementSection } from '../Placement/PlacementSection'
import { Specifications } from './specifications'

export function PolicyWizard(props: {
    title: string
    namespaces: string[]
    policies: IResource[]
    placements: IResource[]
    placementRules: IResource[]
    clusters: IResource[]
    clusterSets: IResource[]
    clusterSetBindings: IClusterSetBinding[]
    editMode?: EditMode
    resources?: IResource[]
    yamlEditor?: () => ReactNode
    gitSource?: string
    onSubmit: WizardSubmit
    onCancel: WizardCancel
}) {
    return (
        <WizardPage
            title={props.title}
            description="A policy generates reports and validates cluster compliance based on specified security standards, categories, and controls."
            yamlEditor={props.yamlEditor}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            editMode={props.editMode}
            defaultData={
                props.resources ?? [
                    {
                        ...PolicyType,
                        metadata: { name: '', namespace: '' },
                        spec: { disabled: false },
                    },
                ]
            }
        >
            <Step label="Details" id="details">
                {props.editMode !== EditMode.Edit && (
                    <Fragment>
                        <Sync kind={PolicyKind} path="metadata.namespace" />
                        <Sync kind={PolicyKind} path="metadata.name" suffix="-placement" />
                        <Sync kind={PolicyKind} path="metadata.name" targetKind={PlacementBindingKind} targetPath="subjects.0.name" />
                    </Fragment>
                )}

                <Sync kind={PolicyKind} path="metadata.namespace" />
                <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
                    <Section label="Details" prompt="Enter the details for the policy">
                        {props.gitSource && (
                            <WizDetailsHidden>
                                <Alert title="This policy is managed externally" variant="warning" isInline>
                                    <Fragment>
                                        <p>Any changes made here may be overridden by the content of an upstream repository.</p>
                                        <Button
                                            icon={<ExternalLinkAltIcon />}
                                            isInline
                                            variant="link"
                                            component="a"
                                            href={props.gitSource}
                                            target="_blank"
                                        >
                                            {props.gitSource}
                                        </Button>
                                    </Fragment>
                                </Alert>
                            </WizDetailsHidden>
                        )}

                        <ItemContext.Consumer>
                            {(item: IResource) => (
                                <Fragment>
                                    <WizTextInput
                                        id="name"
                                        path="metadata.name"
                                        label="Name"
                                        required
                                        validation={validatePolicyName}
                                        readonly={item.metadata?.uid !== undefined}
                                    />
                                    <WizSingleSelect
                                        id="namespace"
                                        path="metadata.namespace"
                                        label="Namespace"
                                        placeholder="Select namespace"
                                        helperText="The namespace on the hub cluster where the policy resources will be created."
                                        options={props.namespaces}
                                        required
                                        readonly={item.metadata?.uid !== undefined}
                                    />
                                </Fragment>
                            )}
                        </ItemContext.Consumer>
                        <WizCheckbox
                            path="spec.disabled"
                            label="Disable policy"
                            helperText="Select to disable the policy from being propagated to managed clusters."
                        />
                    </Section>
                </WizItemSelector>
            </Step>
            <Step label="Policy templates" id="templates">
                <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
                    <PolicyWizardTemplates policies={props.policies} />
                </WizItemSelector>
            </Step>
            <Step label="Placement" id="placement">
                <PolicyPolicySets />
                <PlacementSection
                    existingPlacements={props.placements}
                    existingPlacementRules={props.placementRules}
                    existingClusterSets={props.clusterSets}
                    existingClusterSetBindings={props.clusterSetBindings}
                    bindingSubjectKind={PolicyKind}
                    bindingSubjectApiGroup={PolicyApiGroup}
                    defaultPlacementKind={PlacementRuleKind}
                    clusters={props.clusters}
                    allowNoPlacement
                    withoutOnlineClusterCondition
                />
            </Step>
            <Step label="Policy annotations" id="security-groups">
                <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
                    <Section label="Policy annotations">
                        <StringsMapInput
                            id="standards"
                            path={`metadata.annotations.policy\\.open-cluster-management\\.io/standards`}
                            label="Standards"
                            map={(value: string | undefined) => {
                                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
                            }}
                            unmap={(values: string[]) => values.join(', ')}
                            labelHelp="The name or names of security standards the policy is related to. For example, National Institute of Standards and Technology (NIST) and Payment Card Industry (PCI)."
                        />
                        <StringsMapInput
                            id="categories"
                            path={`metadata.annotations.policy\\.open-cluster-management\\.io/categories`}
                            label="Categories"
                            map={(value: string | undefined) => {
                                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
                            }}
                            unmap={(values: string[]) => values.join(', ')}
                            labelHelp="A security control category represent specific requirements for one or more standards. For example, a System and Information Integrity category might indicate that your policy contains a data transfer protocol to protect personal information, as required by the HIPAA and PCI standards."
                        />
                        <StringsMapInput
                            id="controls"
                            path={`metadata.annotations.policy\\.open-cluster-management\\.io/controls`}
                            label="Controls"
                            map={(value: string | undefined) => {
                                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
                            }}
                            unmap={(values: string[]) => values.join(', ')}
                            labelHelp="The name of the security control that is being checked. For example, the certificate policy controller."
                        />
                    </Section>
                </WizItemSelector>
            </Step>
        </WizardPage>
    )
}

export function PolicyWizardTemplates(props: { policies: IResource[] }) {
    const policy = useContext(ItemContext)
    const editMode = useEditMode()
    const selectorPath = 'objectDefinition.spec.namespaceSelector'
    const selectorMatchLabels = `${selectorPath}.matchLabels`
    return (
        <Section label="Templates" description="A policy contains  policy templates that create policies on managed clusters.">
            <WizRadioGroup
                path="spec.remediationAction"
                label="Remediation"
                labelHelp="Optional. Specifies the remediation of your policy. The parameter values are enforce and inform. If specified, the spec.remediationAction value that is defined overrides the remediationAction parameter defined in the child policy, from the policy-templates section. For example, if spec.remediationAction value section is set to enforce, then the remediationAction in the policy-templates section is set to enforce during runtime. Important: Some policies might not support the enforce feature."
            >
                <Radio id="inform" label="Inform" value="inform" description="Reports the violation, which requires manual remediation." />
                <Radio
                    id="enforce"
                    label="Enforce"
                    value="enforce"
                    description="Automatically runs remediation action that is defined in the source, if this feature is supported."
                />
                <Radio
                    id="policyTemplateRemediation"
                    label="Use policy template remediation"
                    value={undefined}
                    description="Remediation action will be determined by what is set in the policy template definitions."
                />
            </WizRadioGroup>
            <WizArrayInput
                id="templates"
                path="spec.policy-templates"
                label="Policy templates"
                placeholder="Add policy template"
                // required
                dropdownItems={Specifications.map((specification) => {
                    return {
                        label: specification.description,
                        action: () => {
                            for (const group of ['categories', 'standards', 'controls']) {
                                const existingValue: string = get(
                                    policy,
                                    `metadata.annotations.policy\\.open-cluster-management\\.io/${group}`,
                                    ''
                                )
                                const addValue: string = get(specification, `${group}`, '')
                                const newValue: string = existingValue
                                    .split(',')
                                    .concat(addValue.split(','))
                                    .map((v) => v.trim())
                                    .filter((value, index, array) => array.indexOf(value) === index)
                                    .filter((value) => value)
                                    .join(', ')
                                set(policy, `metadata.annotations.policy\\.open-cluster-management\\.io/${group}`, newValue, {
                                    preservePaths: false,
                                })
                            }

                            const newPolicyTemplates = klona(specification.policyTemplates)

                            const policyName = get(policy, 'metadata.name')
                            if (policyName) {
                                newPolicyTemplates.forEach((t) => {
                                    const name: string = get(t, 'objectDefinition.metadata.name')
                                    if (name) {
                                        set(t, 'objectDefinition.metadata.name', name.replace('{{name}}', policyName))
                                    }
                                })
                            }

                            // make each policy template name unique in policy and globally
                            if (policy) {
                                const existingTemplates = get(policy, 'spec.policy-templates')
                                for (const newPolicyTemplate of newPolicyTemplates) {
                                    const name: string = get(newPolicyTemplate, 'objectDefinition.metadata.name')
                                    if (!name) continue
                                    let counter = 1
                                    let newName = name
                                    while (
                                        (Array.isArray(existingTemplates) &&
                                            existingTemplates.find((existingTemplate) => {
                                                return get(existingTemplate, 'objectDefinition.metadata.name') === newName
                                            })) ||
                                        isExistingTemplateName(newName, props.policies)
                                    ) {
                                        newName = name + '-' + (counter++).toString()
                                    }
                                    set(newPolicyTemplate, 'objectDefinition.metadata.name', newName)
                                }
                            }

                            return newPolicyTemplates
                        },
                    }
                })}
                collapsedContent="objectDefinition.metadata.name"
                defaultCollapsed={editMode !== EditMode.Create}
            >
                {/* CertificatePolicy */}
                <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'CertificatePolicy'}>
                    <div>
                        <Title headingLevel="h6">Certificate Policy</Title>
                    </div>

                    <WizTextInput
                        path="objectDefinition.metadata.name"
                        label="Name"
                        required
                        validation={isValidKubernetesResourceName}
                        helperText="Name needs to be unique to the namespace on each of the managed clusters."
                    />
                    <WizTextInput path="objectDefinition.spec.minimumDuration" label="Minimum duration" required />
                </WizHidden>

                {/* IamPolicy */}
                <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'IamPolicy'}>
                    <div>
                        <Title headingLevel="h6">IAM Policy</Title>
                    </div>

                    <WizTextInput
                        path="objectDefinition.metadata.name"
                        label="Name"
                        required
                        helperText="Name needs to be unique to the namespace on each of the managed clusters."
                        validation={isValidKubernetesResourceName}
                    />
                    <WizNumberInput path="objectDefinition.spec.maxClusterRoleBindingUsers" label="Limit cluster role bindings" required />
                </WizHidden>

                {/* ConfigurationPolicy */}
                <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ConfigurationPolicy'}>
                    <div>
                        <Title headingLevel="h6">Configuration Policy</Title>
                        <Text component="small">A configuration policy creates configuration objects on managed clusters.</Text>
                    </div>

                    <WizTextInput
                        path="objectDefinition.metadata.name"
                        label="Name"
                        required
                        helperText="Name needs to be unique to the namespace on each of the managed clusters."
                        validation={isValidKubernetesResourceName}
                    />

                    <WizRadioGroup
                        path="objectDefinition.spec.pruneObjectBehavior"
                        label="Prune Object Behavior"
                        labelHelp="Optional. Specifies how related objects on the managed cluster are pruned when the policy is deleted. The parameter values are None, DeleteIfCreated, and DeleteAll."
                    >
                        <Radio
                            id="deleteIfCreated"
                            label="Delete If Created"
                            value="DeleteIfCreated"
                            description="Attempts to delete objects known to be created by the policy when the policy is deleted."
                        />
                        <Radio
                            id="deleteAll"
                            label="Delete All"
                            value="DeleteAll"
                            description="Attempts to delete all of the objects related to the deleted policy."
                        />
                        <Radio
                            id="none"
                            label="None"
                            value="None"
                            description="Does not delete any resources when the policy is deleted. This value is used by default."
                        />
                    </WizRadioGroup>

                    <WizArrayInput
                        path="objectDefinition.spec.object-templates"
                        label="Configuration objects"
                        // placeholder="Add configuration object"
                        collapsedContent="objectDefinition.metadata.name"
                    >
                        <ObjectTemplate />
                    </WizArrayInput>
                </WizHidden>

                <WizHidden hidden={(template: any) => template?.objectDefinition?.spec?.namespaceSelector === undefined}>
                    <WizStringsInput
                        id="include-namespaces"
                        path={`${selectorPath}.include`}
                        label="Include namespaces"
                        placeholder="Add namespace"
                    />
                    <WizStringsInput
                        id="exclude-namespaces"
                        path={`${selectorPath}.exclude`}
                        label="Exclude namespaces"
                        placeholder="Add namespace"
                    />
                    <WizKeyValue
                        label="Namespaces match labels"
                        path={selectorMatchLabels}
                        placeholder="Add label"
                        hidden={(item) => get(item, selectorMatchLabels) === undefined}
                    />
                    <WizArrayInput
                        label="Namespaces match label expressions"
                        path={`${selectorPath}.matchExpressions`}
                        placeholder="Add expression"
                        collapsedContent={<MatchExpressionCollapsed />}
                        newValue={{ key: '', operator: 'In', values: [] }}
                        defaultCollapsed={editMode !== EditMode.Create}
                    >
                        <MatchExpression />
                    </WizArrayInput>
                </WizHidden>

                <WizRadioGroup path="objectDefinition.spec.remediationAction" label="Remediation">
                    <Radio
                        id="inform"
                        label="Inform"
                        value="inform"
                        description="Reports the violation, which requires manual remediation."
                    />
                    <Radio
                        id="enforce"
                        label="Enforce"
                        value="enforce"
                        description="Automatically runs remediation action that is defined in the source, if this feature is supported."
                    />
                </WizRadioGroup>

                <WizSelect
                    path="objectDefinition.spec.severity"
                    label="Severity"
                    placeholder="Select severity"
                    options={['low', 'medium', 'high']}
                    required
                />
            </WizArrayInput>
        </Section>
    )
}

function isExistingTemplateName(name: string, policies: IResource[]) {
    for (const policy of policies) {
        const existingTemplates = get(policy, 'spec.policy-templates')
        if (Array.isArray(existingTemplates)) {
            if (
                existingTemplates.find((existingTemplate) => {
                    return get(existingTemplate, 'objectDefinition.metadata.name') === name
                })
            ) {
                return true
            }
        }
    }
    return false
}

function ObjectTemplate() {
    const template: any = useItem()
    return (
        <Fragment>
            <WizHidden hidden={(template: any) => template?.complianceType === undefined}>
                <Stack>
                    <Text component="small">
                        {template?.complianceType === 'musthave'
                            ? 'Must have'
                            : template?.complianceType === 'mustonlyhave'
                            ? 'Must only have'
                            : template?.complianceType === 'mustnothave'
                            ? 'Must not have'
                            : template?.complianceType}
                    </Text>
                    <WizHidden hidden={(template: any) => template?.objectDefinition?.kind === undefined}>
                        <Title headingLevel="h6">{pascalCaseToSentenceCase(template?.objectDefinition?.kind)}</Title>
                    </WizHidden>
                </Stack>
            </WizHidden>

            <WizHidden hidden={(template: any) => template?.complianceType !== undefined || template?.objectDefinition?.kind === undefined}>
                <Title headingLevel="h6">{template?.objectDefinition?.kind}</Title>
            </WizHidden>

            <WizTextInput
                path="objectDefinition.metadata.name"
                label="Name"
                required
                hidden={(template: any) => template?.objectDefinition?.metadata?.name === undefined}
            />

            <WizTextInput
                path="objectDefinition.metadata.namespace"
                label="Namespace"
                required
                hidden={(template: any) => template?.objectDefinition?.metadata?.namespace === undefined}
            />

            <WizKeyValue
                path="objectDefinition.metadata.labels"
                label="Labels"
                hidden={(template: any) => template?.objectDefinition?.metadata?.labels === undefined}
            />

            <WizKeyValue
                path="objectDefinition.metadata.annotations"
                label="Annotations"
                hidden={(template: any) => template?.objectDefinition?.metadata?.annotations === undefined}
            />

            <WizTextInput
                path="objectDefinition.status.phase"
                label="Phase"
                hidden={(template: any) => template?.objectDefinition?.status?.phase === undefined}
            />

            {/* LimitRange */}
            <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'LimitRange'}>
                <WizArrayInput
                    path="objectDefinition.spec.limits"
                    label="Limits"
                    placeholder="Add limit"
                    collapsedContent={'default.memory'}
                >
                    <WizTextInput
                        path="default.memory"
                        label="Memory limit"
                        placeholder="Enter memory limit"
                        required
                        helperText="Examples: 512Mi, 2Gi"
                    />
                    <WizTextInput
                        path="defaultRequest.memory"
                        label="Memory request"
                        placeholder="Enter memory request"
                        required
                        helperText="Examples: 512Mi, 2Gi"
                    />
                </WizArrayInput>
            </WizHidden>

            {/* SecurityContextConstraints */}
            <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'SecurityContextConstraints'}>
                <WizCheckbox path="objectDefinition.allowHostDirVolumePlugin" label="Allow host dir volume plugin" />
                <WizCheckbox path="objectDefinition.allowHostIPC" label="Allow host IPC" />
                <WizCheckbox path="objectDefinition.allowHostNetwork" label="Allow host network" />
                <WizCheckbox path="objectDefinition.allowHostPID" label="Allow host PID" />
                <WizCheckbox path="objectDefinition.allowHostPorts" label="Allow host ports" />
                <WizCheckbox path="objectDefinition.allowPrivilegeEscalation" label="Allow privilege escalation" />
                <WizCheckbox path="objectDefinition.allowPrivilegedContainer" label="Allow privileged container" />
            </WizHidden>

            {/* ScanSettingBinding */}
            <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ScanSettingBinding'}>
                <WizArrayInput id="profiles" label="Profiles" path="objectDefinition.profiles" collapsedContent="name">
                    <WizTextInput path="kind" label="Kind" required />
                    <WizTextInput path="name" label="Name" required />
                </WizArrayInput>
            </WizHidden>

            {/* Role */}
            <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'Role'}>
                <WizArrayInput id="rules" label="Rules" path="objectDefinition.rules" collapsedContent="name" placeholder="Add rule">
                    <WizStringsInput label="API Groups" path="apiGroups" />
                    <WizStringsInput label="Resources" path="resources" />
                    <WizStringsInput label="Verbs" path="verbs" />
                </WizArrayInput>
            </WizHidden>

            {/* ComplianceCheckResult */}
            {/* <Hidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ComplianceCheckResult'}>
                <TextInput
                    path={`objectDefinition.metadata.labels.compliance\\.openshift\\.io/check-status`}
                    label="Check status"
                    required
                />
                <TextInput path={`objectDefinition.metadata.labels.compliance\\.openshift\\.io/suite`} label="Suite" required />
            </Hidden> */}
        </Fragment>
    )
}

function pascalCaseToSentenceCase(text: string) {
    const result = text?.replace(/([A-Z])/g, ' $1') ?? ''
    const finalResult = result.charAt(0).toUpperCase() + result.slice(1)
    return finalResult
}

function PolicyPolicySets() {
    const resources = useItem() as IResource[]

    const policy = useMemo(() => resources?.find((resource) => resource.kind === PolicyKind), [resources])

    const placements = useMemo(() => {
        if (!policy) return undefined
        const placements: {
            placement?: string
            placementBinding?: string
            policySet?: string
        }[] = get(policy, 'status.placement')
        if (!Array.isArray(placements)) return undefined
        return placements
    }, [policy])

    const policySets = useMemo(() => {
        if (!Array.isArray(placements)) return undefined
        const policySets = placements
            .map((placement) => placement.policySet)
            .filter((policySet) => policySet !== undefined && policySet !== '')
        if (policySets.length === 0) return undefined
        return policySets
    }, [placements])

    return (
        <WizDetailsHidden>
            {policySets && (
                <Alert
                    title={
                        policySets.length === 1
                            ? 'Policy placement is managed by a policy set.'
                            : 'Policy placement is managed by policy sets.'
                    }
                    isInline
                    variant="warning"
                >
                    <p>
                        {policySets.length === 1
                            ? 'This policy is placed by the policy set: '
                            : 'This policy is placed by the policy sets: '}
                        <b>{policySets.join(', ')}</b>
                    </p>
                    <p className="pf-v5-c-form__helper-text">
                        Only add placement to this policy if you want it to be placed in addition to the policy set placement.
                    </p>
                </Alert>
            )}
        </WizDetailsHidden>
    )
}
