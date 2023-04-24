/* Copyright Contributors to the Open Cluster Management project */

import { Alert, Button, Stack, Text, TextContent, Title } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { klona } from 'klona/json'
import { Fragment, ReactNode, useContext, useMemo } from 'react'
import set from 'set-value'
import {
  EditMode,
  useEditMode,
  Radio,
  Section,
  Select,
  Step,
  StringsMapInput,
  Sync,
  WizardCancel,
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
  WizTextArea,
  WizTextInput,
  ItemContext,
  useItem,
} from '@patternfly-labs/react-form-wizard'
import { WizardPage } from '../../WizardPage'
import { NavigationPath } from '../../../NavigationPath'
import { IResource } from '../../common/resources/IResource'
import { IClusterSetBinding } from '../../common/resources/IClusterSetBinding'
import { PlacementBindingKind } from '../../common/resources/IPlacementBinding'
import { PolicyApiGroup, PolicyKind, PolicyType } from '../../common/resources/IPolicy'
import { validateKubernetesResourceName, validatePolicyName } from '../../../lib/validation'
import { MatchExpression, MatchExpressionCollapsed } from '../../Placement/MatchExpression'
import { PlacementSection } from '../../Placement/PlacementSection'
import { Specifications } from './specifications'
import { useWizardStrings } from '../../../lib/wizardStrings'
import { useTranslation } from '../../../lib/acm-i18next'

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
  breadcrumb?: { text: string; to?: string }[]
  gitSource?: string
  onSubmit: WizardSubmit
  onCancel: WizardCancel
}) {
  const { t } = useTranslation()
  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Policy steps'),
    contentAriaLabel: t('Policy content'),
  })

  return (
    <WizardPage
      id="policy-wizard"
      wizardStrings={translatedWizardStrings}
      title={props.title}
      breadcrumb={props.breadcrumb}
      description={t(
        'A policy generates reports and validates cluster compliance based on specified security standards, categories, and controls.'
      )}
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
      <Step label={t('Details')} id="details">
        {props.editMode !== EditMode.Edit && (
          <Fragment>
            <Sync kind={PolicyKind} path="metadata.namespace" />
            <Sync kind={PolicyKind} path="metadata.name" suffix="-placement" />
            <Sync
              kind={PolicyKind}
              path="metadata.name"
              targetKind={PlacementBindingKind}
              targetPath="subjects.0.name"
            />
          </Fragment>
        )}

        <Sync kind={PolicyKind} path="metadata.namespace" />
        <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
          <Section label={t('Details')} prompt={t('Enter the details for the policy')}>
            {props.gitSource && (
              <WizDetailsHidden>
                <Alert title={t('This policy is managed externally')} variant="warning" isInline>
                  <Fragment>
                    <p>{t('Any changes made here may be overridden by the content of an upstream repository.')}</p>
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
              {() => (
                <Fragment>
                  <WizTextInput
                    id="name"
                    path="metadata.name"
                    label={t('Name')}
                    placeholder={t('Enter the name')}
                    required
                    validation={validatePolicyName}
                    readonly={props.editMode === EditMode.Edit}
                  />
                  <WizTextArea
                    id="description"
                    path={`metadata.annotations.policy\\.open-cluster-management\\.io/description`}
                    label={t('Description')}
                    placeholder={t('Enter the description')}
                  />
                  <WizSingleSelect
                    id="namespace"
                    path="metadata.namespace"
                    label={t('Namespace')}
                    placeholder={t('Select namespace')}
                    helperText={t('The namespace on the hub cluster where the policy resources will be created.')}
                    options={props.namespaces}
                    required
                    readonly={props.editMode === EditMode.Edit}
                  />
                </Fragment>
              )}
            </ItemContext.Consumer>
            <WizCheckbox
              path="spec.disabled"
              label={t('Disable policy')}
              helperText={t('Select to disable the policy from being propagated to managed clusters.')}
            />
          </Section>
        </WizItemSelector>
      </Step>
      <Step label={t('Policy templates')} id="templates">
        <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
          <PolicyWizardTemplates policies={props.policies} />
        </WizItemSelector>
      </Step>
      <Step label={t('Placement')} id="placement">
        <PolicyPolicySets />
        <PlacementSection
          existingPlacements={props.placements}
          existingPlacementRules={props.placementRules}
          createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
          existingClusterSets={props.clusterSets}
          existingClusterSetBindings={props.clusterSetBindings}
          bindingSubjectKind={PolicyKind}
          bindingSubjectApiGroup={PolicyApiGroup}
          clusters={props.clusters}
          allowNoPlacement
          withoutOnlineClusterCondition
        />
      </Step>
      <Step label={t('Policy annotations')} id="security-groups">
        <WizItemSelector selectKey="kind" selectValue={PolicyKind}>
          <Section label={t('Policy annotations')}>
            <StringsMapInput
              id="standards"
              path={`metadata.annotations.policy\\.open-cluster-management\\.io/standards`}
              label={t('Standards')}
              map={(value: string | undefined) => {
                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
              }}
              unmap={(values: string[]) => values.join(', ')}
              labelHelp={t(
                'The name or names of security standards the policy is related to. For example, National Institute of Standards and Technology (NIST) and Payment Card Industry (PCI).'
              )}
              placeholder={t('Add')}
            />
            <StringsMapInput
              id="categories"
              path={`metadata.annotations.policy\\.open-cluster-management\\.io/categories`}
              label={t('Categories')}
              map={(value: string | undefined) => {
                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
              }}
              unmap={(values: string[]) => values.join(', ')}
              labelHelp={t(
                'A security control category represent specific requirements for one or more standards. For example, a System and Information Integrity category might indicate that your policy contains a data transfer protocol to protect personal information, as required by the HIPAA and PCI standards.'
              )}
              placeholder={t('Add')}
            />
            <StringsMapInput
              id="controls"
              path={`metadata.annotations.policy\\.open-cluster-management\\.io/controls`}
              label={t('Controls')}
              map={(value: string | undefined) => {
                return value !== undefined ? value.split(',').map((v) => v.trimStart()) : []
              }}
              unmap={(values: string[]) => values.join(', ')}
              labelHelp={t(
                'The name of the security control that is being checked. For example, the certificate policy controller.'
              )}
              placeholder={t('Add')}
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
  const { t } = useTranslation()
  return (
    <Section
      label={t('Templates')}
      description={t('A policy contains  policy templates that create policies on managed clusters.')}
    >
      <WizRadioGroup
        path="spec.remediationAction"
        label={t('Remediation')}
        labelHelp={t(
          'Optional. Specifies the remediation of your policy. The parameter values are enforce and inform. If specified, the spec.remediationAction value that is defined overrides the remediationAction parameter defined in the child policy, from the policy-templates section. For example, if spec.remediationAction value section is set to enforce, then the remediationAction in the policy-templates section is set to enforce during runtime. Important: Some policies might not support the enforce feature.'
        )}
      >
        <Radio
          id="inform"
          label={t('Inform')}
          value="inform"
          description={t('Reports the violation, which requires manual remediation.')}
        />
        <Radio
          id="enforce"
          label={t('Enforce')}
          value="enforce"
          description={t(
            'Automatically runs remediation action that is defined in the source, if this feature is supported.'
          )}
        />
        <Radio
          id="policyTemplateRemediation"
          label={t('Use policy template remediation')}
          value={undefined}
          description={t('Remediation action will be determined by what is set in the policy template definitions.')}
        />
      </WizRadioGroup>
      <WizArrayInput
        id="templates"
        path="spec.policy-templates"
        label={t('Policy templates')}
        placeholder={t('Add policy template')}
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
            label={t('Name')}
            required
            validation={validateKubernetesResourceName}
            helperText={t('Name needs to be unique to the namespace on each of the managed clusters.')}
          />
          <WizTextInput path="objectDefinition.spec.minimumDuration" label={t('Minimum duration')} required />
        </WizHidden>

        {/* IamPolicy */}
        <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'IamPolicy'}>
          <div>
            <Title headingLevel="h6">{t('IAM Policy')}</Title>
          </div>

          <WizTextInput
            path="objectDefinition.metadata.name"
            label={t('Name')}
            required
            helperText={t('Name needs to be unique to the namespace on each of the managed clusters.')}
            validation={validateKubernetesResourceName}
          />
          <WizNumberInput
            path="objectDefinition.spec.maxClusterRoleBindingUsers"
            label={t('Limit cluster role bindings')}
            required
          />
        </WizHidden>

        {/* ConfigurationPolicy */}
        <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ConfigurationPolicy'}>
          <div>
            <Title headingLevel="h6">{t('Configuration Policy')}</Title>
            <Text component="small">
              {t('A configuration policy creates configuration objects on managed clusters.')}
            </Text>
          </div>

          <WizTextInput
            path="objectDefinition.metadata.name"
            label={t('Name')}
            required
            helperText={t('Name needs to be unique to the namespace on each of the managed clusters.')}
            validation={validateKubernetesResourceName}
          />

          <WizRadioGroup
            path="objectDefinition.spec.pruneObjectBehavior"
            label={t('Prune Object Behavior')}
            labelHelp={t(
              'Optional. Specifies how related objects on the managed cluster are pruned when the policy is deleted. The parameter values are None, DeleteIfCreated, and DeleteAll.'
            )}
          >
            <Radio
              id="deleteIfCreated"
              label={t('Delete If Created')}
              value="DeleteIfCreated"
              description={t(
                'Attempts to delete objects known to be created by the policy when the policy is deleted.'
              )}
            />
            <Radio
              id="deleteAll"
              label={t('Delete All')}
              value="DeleteAll"
              description={t('Attempts to delete all of the objects related to the deleted policy.')}
            />
            <Radio
              id="none"
              label={t('None')}
              value="None"
              description={t(
                'Does not delete any resources when the policy is deleted. This value is used by default.'
              )}
            />
          </WizRadioGroup>

          <WizArrayInput
            path="objectDefinition.spec.object-templates"
            label={t('Configuration objects')}
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
            label={t('Include namespaces')}
            placeholder={t('Add namespace')}
          />
          <WizStringsInput
            id="exclude-namespaces"
            path={`${selectorPath}.exclude`}
            label={t('Exclude namespaces')}
            placeholder={t('Add namespace')}
          />
          <WizKeyValue
            label={t('Namespaces match labels')}
            path={selectorMatchLabels}
            placeholder={t('Add label')}
            hidden={(item) => get(item, selectorMatchLabels) === undefined}
          />
          <WizArrayInput
            label={t('Namespaces match label expressions')}
            path={`${selectorPath}.matchExpressions`}
            placeholder={t('Add expression')}
            collapsedContent={<MatchExpressionCollapsed />}
            newValue={{ key: '', operator: 'In', values: [] }}
            defaultCollapsed={editMode !== EditMode.Create}
          >
            <MatchExpression />
          </WizArrayInput>
        </WizHidden>

        <WizHidden hidden={(template: any) => template?.objectDefinition?.apiVersion?.includes('gatekeeper.sh/')}>
          <WizRadioGroup path="objectDefinition.spec.remediationAction" label="Remediation">
            <Radio
              id="inform"
              label={t('Inform')}
              value="inform"
              description={t('Reports the violation, which requires manual remediation.')}
            />
            <Radio
              id="enforce"
              label={t('Enforce')}
              value="enforce"
              description={t(
                'Automatically runs remediation action that is defined in the source, if this feature is supported.'
              )}
            />
          </WizRadioGroup>

          <Select
            path="objectDefinition.spec.severity"
            label={t('Severity')}
            placeholder={t('Select severity')}
            options={[
              { label: t('low'), value: 'low' },
              { label: t('medium'), value: 'medium' },
              { label: t('high'), value: 'high' },
            ]}
            required
          />
        </WizHidden>

        <WizHidden hidden={(template: any) => !template?.objectDefinition?.apiVersion?.includes('gatekeeper.sh/')}>
          <TextContent>
            <Text>{t('Gatekeeper policy templates must be customized using the YAML editor.')}</Text>
          </TextContent>
        </WizHidden>
      </WizArrayInput>
    </Section>
  )
}

export function isExistingTemplateName(name: string, policies: IResource[]) {
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
  const { t } = useTranslation()
  function getComplianceType(template: any) {
    switch (template?.complianceType) {
      case 'musthave':
        return t('Must have')
      case 'mustonlyhave':
        return t('Must only have')
      case 'mustnothave':
        return t('Must not have')
      default:
        return template?.complianceType
    }
  }
  return (
    <Fragment>
      <WizHidden hidden={(template: any) => template?.complianceType === undefined}>
        <Stack>
          <Text component="small">{getComplianceType(template)}</Text>
          <WizHidden hidden={(template: any) => template?.objectDefinition?.kind === undefined}>
            <Title headingLevel="h6">{pascalCaseToSentenceCase(template?.objectDefinition?.kind)}</Title>
          </WizHidden>
        </Stack>
      </WizHidden>

      <WizHidden
        hidden={(template: any) =>
          template?.complianceType !== undefined || template?.objectDefinition?.kind === undefined
        }
      >
        <Title headingLevel="h6">{template?.objectDefinition?.kind}</Title>
      </WizHidden>

      <WizTextInput
        path="objectDefinition.metadata.name"
        label={t('Name')}
        required
        hidden={(template: any) => template?.objectDefinition?.metadata?.name === undefined}
      />

      <WizTextInput
        path="objectDefinition.metadata.namespace"
        label={t('Namespace')}
        required
        hidden={(template: any) => template?.objectDefinition?.metadata?.namespace === undefined}
      />

      <WizKeyValue
        path="objectDefinition.metadata.labels"
        label={t('Labels')}
        hidden={(template: any) => template?.objectDefinition?.metadata?.labels === undefined}
      />

      <WizKeyValue
        path="objectDefinition.metadata.annotations"
        label={t('Annotations')}
        hidden={(template: any) => template?.objectDefinition?.metadata?.annotations === undefined}
      />

      <WizTextInput
        path="objectDefinition.status.phase"
        label={t('Phase')}
        hidden={(template: any) => template?.objectDefinition?.status?.phase === undefined}
      />

      {/* LimitRange */}
      <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'LimitRange'}>
        <WizArrayInput
          path="objectDefinition.spec.limits"
          label={t('Limits')}
          placeholder={t('Add limit')}
          collapsedContent={'default.memory'}
        >
          <WizTextInput
            path="default.memory"
            label={t('Memory limit')}
            placeholder={t('Enter memory limit')}
            required
            helperText={t('Examples: 512Mi, 2Gi')}
          />
          <WizTextInput
            path="defaultRequest.memory"
            label={t('Memory request')}
            placeholder={t('Enter memory request')}
            required
            helperText={t('Examples: 512Mi, 2Gi')}
          />
        </WizArrayInput>
      </WizHidden>

      {/* SecurityContextConstraints */}
      <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'SecurityContextConstraints'}>
        <WizCheckbox path="objectDefinition.allowHostDirVolumePlugin" label={t('Allow host dir volume plugin')} />
        <WizCheckbox path="objectDefinition.allowHostIPC" label={t('Allow host IPC')} />
        <WizCheckbox path="objectDefinition.allowHostNetwork" label={t('Allow host network')} />
        <WizCheckbox path="objectDefinition.allowHostPID" label={t('Allow host PID')} />
        <WizCheckbox path="objectDefinition.allowHostPorts" label={t('Allow host ports')} />
        <WizCheckbox path="objectDefinition.allowPrivilegeEscalation" label={t('Allow privilege escalation')} />
        <WizCheckbox path="objectDefinition.allowPrivilegedContainer" label={t('Allow privileged container')} />
      </WizHidden>

      {/* ScanSettingBinding */}
      <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ScanSettingBinding'}>
        <WizArrayInput
          id="profiles"
          label={t('Profiles')}
          path="objectDefinition.profiles"
          collapsedContent={t('name')}
        >
          <WizTextInput path="kind" label={t('Kind')} required />
          <WizTextInput path="name" label={t('Name')} required />
        </WizArrayInput>
      </WizHidden>

      {/* Role */}
      <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'Role'}>
        <WizArrayInput
          id="rules"
          label={t('Rules')}
          path="objectDefinition.rules"
          collapsedContent={t('name')}
          placeholder={t('Add rule')}
        >
          <WizStringsInput label={t('API Groups')} path="apiGroups" />
          <WizStringsInput label={t('Resources')} path="resources" />
          <WizStringsInput label={t('Verbs')} path="verbs" />
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

export function pascalCaseToSentenceCase(text: string) {
  const result = text?.replace(/([A-Z])/g, ' $1') ?? ''
  const finalResult = result.charAt(0).toUpperCase() + result.slice(1)
  return finalResult
}

function PolicyPolicySets() {
  const resources = useItem() as IResource[]
  const { t } = useTranslation()
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
              ? t('Policy placement is managed by a policy set.')
              : t('Policy placement is managed by policy sets.')
          }
          isInline
          variant="warning"
        >
          <p>
            {policySets.length === 1
              ? t('This policy is placed by the policy set: ')
              : t('This policy is placed by the policy sets: ')}
            <b>{policySets.join(', ')}</b>
          </p>
          <p className="pf-c-form__helper-text">
            {t(
              'Only add placement to this policy if you want it to be placed in addition to the policy set placement.'
            )}
          </p>
        </Alert>
      )}
    </WizDetailsHidden>
  )
}
