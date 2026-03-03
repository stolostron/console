/* Copyright Contributors to the Open Cluster Management project */

import {
  Alert,
  Button,
  Stack,
  Content,
  Title,
  FormFieldGroupHeader,
  Form,
  FormFieldGroupExpandable,
} from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { klona } from 'klona/json'
import { Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import set from 'set-value'
import {
  EditMode,
  useEditMode,
  Radio,
  Section,
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
  WizRadioGroup,
  WizSelect,
  WizSingleSelect,
  WizStringsInput,
  WizTextArea,
  WizTextInput,
  ItemContext,
  useItem,
  useData,
} from '@patternfly-labs/react-form-wizard'
import { FormGroup as CoreFormGroup, Radio as CoreRadio } from '@patternfly/react-core'
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
  isSaving?: boolean
}) {
  const { t } = useTranslation()
  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Policy steps'),
    contentAriaLabel: t('Policy content'),
  })
  const defaultData = props.resources ?? [
    {
      ...PolicyType,
      metadata: { name: '', namespace: '' },
      spec: { disabled: false },
    },
  ]

  return (
    <WizardPage
      id="policy-wizard"
      wizardStrings={translatedWizardStrings}
      title={props.title}
      breadcrumb={props.breadcrumb}
      description={t(
        'A policy generates reports and validates cluster violations based on specified security standards, categories, and controls.'
      )}
      yamlEditor={props.yamlEditor}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      editMode={props.editMode}
      defaultData={defaultData}
      isLoading={props.isSaving}
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
          defaultPlacementSpec={{
            tolerations: [
              {
                key: 'cluster.open-cluster-management.io/unreachable',
                operator: 'Exists',
              },
              {
                key: 'cluster.open-cluster-management.io/unavailable',
                operator: 'Exists',
              },
            ],
          }}
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
        collapsedPlaceholder={t('Expand to edit')}
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

        {/* OperatorPolicy */}
        <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'OperatorPolicy'}>
          <OperatorPolicy />
        </WizHidden>

        {/* ConfigurationPolicy */}
        <WizHidden hidden={(template: any) => template?.objectDefinition?.kind !== 'ConfigurationPolicy'}>
          <div>
            <Title headingLevel="h6">{t('Configuration Policy')}</Title>
            <Content component="small">
              {t('A configuration policy creates configuration objects on managed clusters.')}
            </Content>
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
            collapsedPlaceholder={t('Expand to edit')}
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
            collapsedPlaceholder={t('Expand to edit')}
          >
            <MatchExpression />
          </WizArrayInput>
        </WizHidden>

        <WizHidden hidden={(template: any) => template?.objectDefinition?.apiVersion?.includes('gatekeeper.sh/')}>
          <WizRadioGroup path="objectDefinition.spec.remediationAction" label={t('Remediation')}>
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
              id="informOnly"
              label={t('Inform Only')}
              value="informOnly"
              description={t(
                "Reports the violation, which requires manual remediation. This cannot be overridden by the parent policy's remediation action."
              )}
            />
          </WizRadioGroup>

          <WizSelect
            path="objectDefinition.spec.severity"
            label={t('Severity')}
            placeholder={t('Select severity')}
            options={[
              { label: t('low'), value: 'low' },
              { label: t('medium'), value: 'medium' },
              { label: t('high'), value: 'high' },
              { label: t('critical'), value: 'critical' },
            ]}
            required
          />
        </WizHidden>

        <WizHidden hidden={(template: any) => !template?.objectDefinition?.apiVersion?.includes('gatekeeper.sh/')}>
          <Content>
            <Content component="p">
              {t('Gatekeeper policy templates must be customized using the YAML editor.')}
            </Content>
          </Content>
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

function OperatorPolicy() {
  const { t } = useTranslation()
  const template: any = useItem()

  const { update } = useData()

  const [allNamespacesMode, setAllNamespacesMode] = useState<boolean>(
    !template?.objectDefinition?.spec?.operatorGroup?.targetNamespaces
  )

  const setTargetNamespace = useCallback(
    (targetNamespace: string | undefined | null) => {
      // Handle when given a null value
      if (!targetNamespace) {
        if (template?.objectDefinition?.spec?.operatorGroup?.name === 'default') {
          delete template.objectDefinition.spec.operatorGroup.name
        }

        if (template?.objectDefinition?.spec?.operatorGroup?.targetNamespaces) {
          // If the operator group only has targetNamespaces set, then remove the entire operatorGroup section from
          // the policy.
          if (Object.keys(template?.objectDefinition?.spec?.operatorGroup).length === 1) {
            delete template.objectDefinition.spec.operatorGroup
          } else {
            delete template.objectDefinition.spec.operatorGroup.targetNamespaces
          }

          update()
        }

        return
      }

      if (allNamespacesMode) {
        return
      }

      if (!template?.objectDefinition) {
        return
      }

      if (!template.objectDefinition?.spec) {
        template.objectDefinition.spec = { operatorGroup: {} }
      }

      if (!template.objectDefinition.spec?.operatorGroup) {
        template.objectDefinition.spec.operatorGroup = {}
      }

      if (!template.objectDefinition.spec.operatorGroup?.name) {
        template.objectDefinition.spec.operatorGroup.name = 'default'
      }

      if (
        template.objectDefinition.spec.operatorGroup.targetNamespaces &&
        template.objectDefinition.spec.operatorGroup.targetNamespaces[0] === targetNamespace
      ) {
        return
      }

      template.objectDefinition.spec.operatorGroup.targetNamespaces = [targetNamespace]

      update()
    },
    [allNamespacesMode, template, update]
  )

  useEffect(() => {
    setTargetNamespace(template?.objectDefinition?.spec?.subscription?.namespace || '')
  }, [allNamespacesMode, template, setTargetNamespace])

  return (
    <Fragment>
      <div>
        <Title headingLevel="h6">{t('Operator policy')}</Title>
        <Content component="small">{t('An Operator policy creates operators on managed clusters.')}</Content>
      </div>

      <WizTextInput
        path="objectDefinition.metadata.name"
        label={t('Name')}
        required
        helperText={t('Name needs to be unique to the namespace on each of the managed clusters.')}
        validation={validateKubernetesResourceName}
      />

      <CoreFormGroup fieldId="operator-namespaces" label={t('Installation Mode')} isRequired={true}>
        <CoreRadio
          id="operator-all-namespaces"
          name="operator-namespaces"
          label={t('All namespaces on the cluster (default)')}
          checked={allNamespacesMode}
          onChange={(_event, checked: boolean) => {
            setAllNamespacesMode(checked)

            if (checked) {
              setTargetNamespace(null)
            }
          }}
        />
        <CoreRadio
          id="operator-single-namespace"
          name="operator-namespaces"
          label={t('A specific namespace on the cluster')}
          checked={!allNamespacesMode}
          onChange={(_event, checked: boolean) => {
            setAllNamespacesMode(!checked)
          }}
        />
      </CoreFormGroup>

      <WizTextInput
        path="objectDefinition.spec.subscription.namespace"
        label={t('Installed Namespace')}
        labelHelp={t('The operator is installed in this namespace.')}
        required={!allNamespacesMode}
        onValueChange={(value: any) => {
          setTargetNamespace(value)
        }}
      />

      <Form>
        <FormFieldGroupExpandable
          isExpanded
          header={<FormFieldGroupHeader titleText={{ text: 'Operator Subscription', id: 'form-field-group-sub' }} />}
        >
          <WizTextInput
            path="objectDefinition.spec.subscription.name"
            label={t('Name')}
            labelHelp={t(
              'operatorPolicy.subscription.labelHelper',
              'This is the package name of the Operator to install, which might be different from the Display Name used in the catalog.'
            )}
            required
          />
          <WizTextInput
            path="objectDefinition.spec.subscription.channel"
            label={t('Channel')}
            labelHelp={t('operatorPolicy.channel.labelHelper')}
          />
          <WizTextInput
            path="objectDefinition.spec.subscription.source"
            label={t('Source')}
            labelHelp={t('operatorPolicy.source.labelHelper')}
          />
          <WizTextInput
            path="objectDefinition.spec.subscription.sourceNamespace"
            label={t('Source Namespace')}
            labelHelp={t('operatorPolicy.sourceNamespace.labelHelper')}
          />
          <WizTextInput
            path="objectDefinition.spec.subscription.startingCSV"
            label={t('Starting CSV')}
            placeholder={t('Enter the ClusterServiceVersion')}
            labelHelp={t(
              'operatorPolicy.startingCsv.labelHelper',
              `If you want to install a particular version of your Operator, specify the startingCSV property.`
            )}
          />
        </FormFieldGroupExpandable>
      </Form>
      <WizRadioGroup path="objectDefinition.spec.upgradeApproval" label={t('Update Approval')}>
        <Radio id="operator-policy-automatic" label={t('Automatic')} value="Automatic" />
        <Radio id="operator-policy-none" label={t('None')} value="None" />
      </WizRadioGroup>
      <WizStringsInput
        id="operator-policy-versions"
        path={`objectDefinition.spec.versions`}
        label={t('Allowed Cluster Service Versions')}
        placeholder={t('Add versions')}
        labelHelp={t(
          'operatorpolicy.version.labelHelper',
          `Versions is a list of non-empty strings that specify which installed versions are compliant when set to 'inform' mode, and which installPlans are approved when you set the parameter to 'enforce' mode.`
        )}
      />
    </Fragment>
  )
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
          <Content component="small">{getComplianceType(template)}</Content>
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
          collapsedPlaceholder={t('Expand to edit')}
        >
          <WizTextInput
            path="default.memory"
            label={t('Memory limit')}
            placeholder={t('Enter memory limit')}
            helperText={t('Examples: 512Mi, 2Gi')}
          />
          <WizTextInput
            path="defaultRequest.memory"
            label={t('Memory request')}
            placeholder={t('Enter memory request')}
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
          collapsedPlaceholder={t('Expand to edit')}
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
          collapsedPlaceholder={t('Expand to edit')}
        >
          <WizStringsInput label={t('API Groups')} path="apiGroups" />
          <WizStringsInput label={t('Resources')} path="resources" required />
          <WizStringsInput label={t('Verbs')} path="verbs" required />
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
  const result = text?.replaceAll(/([A-Z])/g, ' $1') ?? ''
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
          <p className="pf-v6-c-form__helper-text">
            {t(
              'Only add placement to this policy if you want it to be placed in addition to the policy set placement.'
            )}
          </p>
        </Alert>
      )}
    </WizDetailsHidden>
  )
}
