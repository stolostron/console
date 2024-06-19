/* Copyright Contributors to the Open Cluster Management project */

import { PolicyAutomation, PolicySet } from '../../../resources'
import { PolicyTableItem } from './Policies'
import { NavigationPath } from '../../../NavigationPath'
import { Link } from 'react-router-dom-v5-compat'
import { PolicySetList } from '../common/util'
import moment from 'moment'
import { PolicyActionDropdown } from '../components/PolicyActionDropdown'
import { AcmButton } from '../../../ui-components/AcmButton'
import { AutomationDetailsSidebar } from '../components/AutomationDetailsSidebar'
import { ButtonVariant } from '@patternfly/react-core'
import { TFunction } from 'react-i18next'

export function handleNameCell(item: PolicyTableItem) {
  return (
    <Link
      to={NavigationPath.policyDetails
        .replace(':namespace', item.policy.metadata.namespace as string)
        .replace(':name', item.policy.metadata.name as string)}
      state={{
        from: NavigationPath.policies,
      }}
    >
      {item.policy.metadata.name}
    </Link>
  )
}

export function handleStatusCell(item: PolicyTableItem, t: TFunction<string, undefined>) {
  const disabled: string = t('Disabled')
  const enabled: string = t('Enabled')
  return <span>{item.policy.spec.disabled === true ? disabled : enabled}</span>
}

export function handlePolicySetCell(item: PolicyTableItem, policySets: PolicySet[]) {
  const policySetsMatch = policySets.filter(
    (policySet: PolicySet) =>
      policySet.metadata.namespace === item.policy.metadata.namespace &&
      policySet.spec.policies.includes(item.policy.metadata.name!)
  )
  if (policySetsMatch.length > 0) {
    return <PolicySetList policySets={policySetsMatch} />
  }
  return '-'
}

export function handleCreatedCell(item: PolicyTableItem) {
  if (item.policy.metadata?.creationTimestamp) {
    return <span>{moment(new Date(item.policy.metadata?.creationTimestamp)).fromNow()}</span>
  }
  return '-'
}

export function handleBtnCell(item: PolicyTableItem, setModal: (modal: React.ReactNode) => void) {
  return <PolicyActionDropdown setModal={setModal} item={item} isKebab={true} />
}

export function handleActionGroupCell(item: PolicyTableItem, t: TFunction<string, undefined>) {
  const disabled: string = t('policy.table.actionGroup.status.disabled')
  const enabled: string = t('policy.table.actionGroup.status.enabled')
  return <span>{item.policy.spec.disabled === true ? disabled : enabled}</span>
}

export function handleAutomationCell(
  item: PolicyTableItem,
  policyAutomations: PolicyAutomation[],
  canUpdatePolicyAutomation: boolean,
  unauthorizedMessage: string,
  setDrawerContext: any,
  setModal: any,
  canCreatePolicyAutomation: boolean,
  t: TFunction<string, undefined>
) {
  const policyAutomationMatch = policyAutomations.find(
    (pa: PolicyAutomation) => pa.spec.policyRef === item.policy.metadata.name
  )
  const configure: string = t('Configure')

  if (policyAutomationMatch) {
    return (
      <AcmButton
        isDisabled={!canUpdatePolicyAutomation}
        tooltip={!canUpdatePolicyAutomation ? unauthorizedMessage : ''}
        isInline
        variant={ButtonVariant.link}
        onClick={() =>
          setDrawerContext({
            isExpanded: true,
            onCloseClick: () => {
              setDrawerContext(undefined)
            },
            title: policyAutomationMatch.metadata.name,
            panelContent: (
              <AutomationDetailsSidebar
                setModal={setModal}
                policyAutomationMatch={policyAutomationMatch}
                policy={item.policy}
                onClose={() => setDrawerContext(undefined)}
              />
            ),
            panelContentProps: { defaultSize: '40%' },
            isInline: true,
            isResizable: true,
          })
        }
      >
        {policyAutomationMatch.metadata.name}
      </AcmButton>
    )
  } else {
    return (
      <AcmButton
        isDisabled={!canCreatePolicyAutomation}
        tooltip={!canCreatePolicyAutomation ? unauthorizedMessage : ''}
        isInline
        variant={ButtonVariant.link}
        component={Link}
        to={NavigationPath.createPolicyAutomation
          .replace(':namespace', item.policy.metadata.namespace as string)
          .replace(':name', item.policy.metadata.name as string)}
      >
        {configure}
      </AcmButton>
    )
  }
}
