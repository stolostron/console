/* Copyright Contributors to the Open Cluster Management project */
import { Alert, Button, ButtonVariant } from '@patternfly/react-core'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  WizDetailsHidden,
  EditMode,
  WizKeyValue,
  Section,
  Select,
  Step,
  WizardCancel,
  WizardSubmit,
  WizCheckbox,
  WizNumberInput,
} from '@patternfly-labs/react-form-wizard'
import { WizardPage } from '../../WizardPage'
import { IResource } from '../../common/resources/IResource'
import { IPolicyAutomation, PolicyAutomationType } from '../../common/resources/IPolicyAutomation'
import { ConfigMap } from '../../../resources'
import { Trans, useTranslation } from '../../../lib/acm-i18next'
import { useWizardStrings } from '../../../lib/wizardStrings'
import { AutomationProviderHint } from '../../../components/AutomationProviderHint'

export interface PolicyAutomationWizardProps {
  title: string
  breadcrumb?: {
    text: string
    to?: string
  }[]
  policy: IResource
  credentials: IResource[]
  configMaps?: ConfigMap[]
  createCredentialsCallback: () => void
  editMode?: EditMode
  yamlEditor?: () => ReactNode
  resource: IPolicyAutomation
  onSubmit: WizardSubmit
  onCancel: WizardCancel
  getAnsibleJobsCallback: (credential: IResource) => Promise<string[]>
}

export function PolicyAutomationWizard(props: PolicyAutomationWizardProps) {
  const ansibleCredentials = useMemo(
    () =>
      props.credentials.filter(
        (credential) => credential.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
      ),
    [props.credentials]
  )
  const ansibleCredentialNames = useMemo(
    () => ansibleCredentials.map((credential) => credential.metadata?.name ?? ''),
    [ansibleCredentials]
  )
  const [jobNames, setJobNames] = useState<string[]>()
  const [alert, setAlert] = useState<{ title: string; message: string }>()
  const { t } = useTranslation()

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
            setAlert({ title: t('Failed to get job names from Ansible'), message: err.message })
          } else {
            setAlert({ title: t('Failed to get job names from Ansible'), message: 'Unknown error' })
          }
        })
    }
  }, [ansibleCredentials, props, t])

  const translatedWizardStrings = useWizardStrings({
    stepsAriaLabel: t('Policy automation steps'),
    contentAriaLabel: t('Policy automation content'),
  })

  return (
    <WizardPage
      id="policy-automation-wizard"
      wizardStrings={translatedWizardStrings}
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
      <Step label={t('Automation')} id="automation-step">
        <AutomationProviderHint
          component="alert"
          workflowSupportRequired={
            false /* TODO: remove workflowSupportRequired attribute once GRC supports workflow templates */
          }
        />
        <Section label={t('Policy automation')}>
          {alert && (
            <WizDetailsHidden>
              <Alert title={alert.title} isInline variant="danger">
                {alert.message}
              </Alert>
            </WizDetailsHidden>
          )}
          <Select
            id="secret"
            label={t('Ansible credential')}
            path="spec.automationDef.secret"
            placeholder={t('Select the Ansible credential')}
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
                      setAlert({
                        title: t('Failed to get job names from Ansible'),
                        message: err.message,
                      })
                    } else {
                      setAlert({
                        title: t('Failed to get job names from Ansible'),
                        message: t('Unknown error'),
                      })
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
                  {t('Create credential')}
                </Button>
              </>
            }
            required
          />
          <Select
            id="job"
            label={t('Ansible job')}
            path="spec.automationDef.name"
            options={jobNames}
            hidden={(item) => !item.spec?.automationDef?.secret}
            required
          />
          <WizKeyValue
            id="extra_vars"
            path="spec.automationDef.extra_vars"
            label={t('Extra variables')}
            placeholder={t('Add variable')}
            hidden={(item) => !item.spec?.automationDef?.name}
          />
          <WizNumberInput
            path="spec.automationDef.policyViolationsLimit"
            label={t('Policy Violations Limit')}
            labelHelp={t(
              'The maximum number of non-compliant cluster policy details that pass to the Ansible platform as extra variables. When it is set to 0, it means no limit. The default value is 1000.'
            )}
          />
          <Select
            id="mode"
            label={t('Schedule')}
            labelHelp={
              <div>
                <p>
                  {
                    <Trans
                      i18nKey="<bold>Run everyEvent:</bold> When a policy is violated, the automation runs every time for each unique policy violations per managed cluster."
                      components={{ bold: <strong /> }}
                    />
                  }
                </p>
                <p>
                  {
                    <Trans
                      i18nKey="<bold>Run once:</bold> When a policy is violated, the automation runs one time, after which it is disabled."
                      components={{ bold: <strong /> }}
                    />
                  }
                </p>
                <p>
                  {
                    <Trans
                      i18nKey="<bold>Disabled:</bold> The automation does not run automatically."
                      components={{ bold: <strong /> }}
                    />
                  }
                </p>
                <p>{t('To run automation manually, select "Disabled" and check the "Manual run" checkbox.)')}</p>
              </div>
            }
            path="spec.mode"
            options={[
              { label: t('Once'), value: 'once' },
              { label: t('EveryEvent'), value: 'everyEvent' },
              { label: t('Disabled'), value: 'disabled' },
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
            label={t('Manual run: Set this automation to run once. After the automation runs, it is set to disabled.')}
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
            label={t('Delay After Run Seconds')}
            labelHelp={t(
              'DelayAfterRunSeconds is the minimum seconds before an automation can be restarted on the same cluster. When a policy is violated, the automation runs one time before the delay period. If the policy is violated multiple times during the delay period and kept in the violated state, the automation runs one time after the delay period. The default is 0 seconds and is only applicable for the everyEvent mode.'
            )}
            helperText={t('The period in seconds.')}
          />
        </Section>
      </Step>
    </WizardPage>
  )
}
