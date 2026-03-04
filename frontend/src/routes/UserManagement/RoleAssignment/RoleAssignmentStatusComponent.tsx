/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  ExpandableSection,
  ExpandableSectionVariant,
  Label,
  Panel,
  PanelMain,
  PanelMainBody,
  Popover,
  PopoverPosition,
  PopoverProps,
  Spinner,
  TooltipProps,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'

/** Callback key for reason from API, plus MissingNamespaces for message-based "create missing projects" action. */
export type RoleAssignmentCallbackReason = NonNullable<RoleAssignmentStatus['reason']> | 'MissingNamespaces'

/** Matches Kubernetes-style "namespaces \"...\" not found" (e.g. from Failed to apply manifest). */
const MISSING_NAMESPACES_MESSAGE_REGEX = /namespaces\s+["'][^"']*["']\s+not\s+found/i

/** Checks if the message contains a missing namespaces message. */
const isMissingNamespacesMessage = (reason: RoleAssignmentStatus['reason'], message: string | undefined): boolean => {
  if (!message || reason !== 'ApplicationFailed') {
    return false
  } else {
    const lower = message.toLowerCase()
    return (
      MISSING_NAMESPACES_MESSAGE_REGEX.test(message) || (lower.includes('namespaces') && lower.includes('not found'))
    )
  }
}

/**
 * Reason footer component for the status tooltip.
 * Displays the callback button if the reason is MissingNamespaces or the message contains a missing namespaces message.
 * Displays the error message if the reason is ApplicationFailed.
 * @param roleAssignment - The role assignment to display the status for
 * @param callbackMap - A map of callbacks per reason. The key is the reason and the value is the callback function. This is used to display the callback button in the status tooltip.
 * @param areActionButtonsDisabled - Whether the action buttons are disabled
 * @param isCallbackProcessing - Whether the callback processing is in progress
 * @returns The reason footer component
 */
const ReasonFooter = ({
  roleAssignment,
  callbackMap,
  areActionButtonsDisabled,
  isCallbackProcessing,
}: {
  roleAssignment: FlattenedRoleAssignment
  callbackMap: RoleAssignmentStatusComponentProps['callbackMap']
  areActionButtonsDisabled?: boolean
  isCallbackProcessing?: boolean
}) => {
  const { t } = useTranslation()
  const isMissingNamespaces = isMissingNamespacesMessage(roleAssignment.status?.reason, roleAssignment.status?.message)
  const callback: (roleAssignment: FlattenedRoleAssignment) => void =
    callbackMap[
      isMissingNamespaces ? 'MissingNamespaces' : roleAssignment.status?.reason ?? ('' as RoleAssignmentCallbackReason)
    ]

  return isMissingNamespaces ? (
    <Button
      variant="primary"
      onClick={() => {
        if (callback) {
          callback(roleAssignment)
        } else {
          console.error('No callback method implemented for reason', roleAssignment.status?.reason)
        }
      }}
      isDisabled={areActionButtonsDisabled || !callback}
      isLoading={isCallbackProcessing}
    >
      {t('Create missing projects')}
    </Button>
  ) : null
}

/**
 * Reason string component for the status tooltip.
 * Displays the reason string for the status tooltip.
 * @param reason - The reason to display the string for
 * @returns The reason string component
 */
const ReasonString = ({ reason }: { reason: RoleAssignmentStatus['reason'] }) => {
  const { t } = useTranslation()
  switch (reason) {
    case 'Processing':
      return t('Processing')
    case 'InvalidReference':
      return t('Invalid reference')
    case 'NoMatchingClusters':
      return t('No matching clusters')
    case 'SuccessfullyApplied':
      return t('Successfully applied')
    case 'ApplicationFailed':
      return t('Application failed')
    default:
      return reason
  }
}

/**
 * Status tooltip component for the role assignment status.
 * Displays the status icon, label, body content, and footer content.
 * @param roleAssignment - The role assignment to display the status for
 * @param icon - The icon to display the status for
 * @param label - The label to display the status for
 * @param bodyContent - The body content to display the status for
 * @param footerContent - The footer content to display the status for
 * @param callbackMap - A map of callbacks per reason. The key is the reason and the value is the callback function. This is used to display the callback button in the status tooltip.
 * @param isCallbackProcessing - Whether the callback processing is in progress
 * @param areActionButtonsDisabled - Whether the action buttons are disabled
 * @returns The status tooltip component
 */
const StatusTooltip = ({
  roleAssignment,
  icon,
  label,
  bodyContent,
  footerContent,
  callbackMap,
  isCallbackProcessing,
  areActionButtonsDisabled,
}: {
  roleAssignment: FlattenedRoleAssignment
  icon: TooltipProps['children']
  label: string
  bodyContent?: PopoverProps['bodyContent']
  footerContent?: PopoverProps['footerContent']
  callbackMap: Record<RoleAssignmentCallbackReason, (roleAssignment: FlattenedRoleAssignment) => void>
  isCallbackProcessing: boolean
  areActionButtonsDisabled?: boolean
}) => {
  const { t } = useTranslation()
  const reason = roleAssignment.status?.reason ?? t('Not available')
  const message = roleAssignment.status?.message ?? t('Not available')

  return (
    <Popover
      triggerAction="hover"
      headerContent={<ReasonString reason={reason} />}
      bodyContent={
        bodyContent ?? (
          <Panel isScrollable>
            <PanelMain tabIndex={0} maxHeight="150px">
              <PanelMainBody style={{ padding: '0px' }}>{message}</PanelMainBody>
            </PanelMain>
          </Panel>
        )
      }
      footerContent={
        footerContent ?? (
          <ReasonFooter
            roleAssignment={roleAssignment}
            callbackMap={callbackMap}
            areActionButtonsDisabled={areActionButtonsDisabled}
            isCallbackProcessing={isCallbackProcessing}
          />
        )
      }
      position={PopoverPosition.left}
    >
      <Label variant="outline" isDisabled={isCallbackProcessing} aria-disabled={isCallbackProcessing}>
        <span style={{ paddingRight: '8px' }}>{icon}</span>
        {label}
      </Label>
    </Popover>
  )
}

export type RoleAssignmentStatusComponentProps = {
  roleAssignment: FlattenedRoleAssignment
  callbackMap: Record<RoleAssignmentCallbackReason, (roleAssignment: FlattenedRoleAssignment) => void>
  isCallbackProcessing?: boolean
  areActionButtonsDisabled?: boolean
}

/**
 * Role assignment status component.
 * Displays the status icon, label, body content, and footer content.
 * @param roleAssignment - The role assignment to display the status for
 * @param callbackMap - A map of callbacks per reason. The key is the reason and the value is the callback function. This is used to display the callback button in the status tooltip.
 * @param isCallbackProcessing - Whether the callback processing is in progress
 * @param areActionButtonsDisabled - Whether the action buttons are disabled
 * @returns The role assignment status component
 */
const RoleAssignmentStatusComponent = ({
  roleAssignment,
  callbackMap,
  isCallbackProcessing,
  areActionButtonsDisabled,
}: RoleAssignmentStatusComponentProps) => {
  const { t } = useTranslation()
  const [isErrorExpanded, setIsErrorExpanded] = useState(false)
  const onErrorToggle = () => setIsErrorExpanded(!isErrorExpanded)

  const commonStatusTooltipProps = {
    roleAssignment,
    callbackMap,
    isCallbackProcessing: isCallbackProcessing ?? false,
    areActionButtonsDisabled,
  }

  switch (true) {
    case isCallbackProcessing:
      return (
        <StatusTooltip
          icon={<Spinner isInline aria-label={t('Creating common projects')} />}
          label={t('Creating common projects')}
          {...commonStatusTooltipProps}
        />
      )
    case roleAssignment.status?.status === 'Active':
      return (
        <StatusTooltip
          icon={<CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />}
          label={t('Active')}
          {...commonStatusTooltipProps}
        />
      )
    case roleAssignment.status?.status === 'Error':
      return (
        <StatusTooltip
          icon={<ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />}
          label={t('Error')}
          bodyContent={
            <Panel isScrollable>
              <PanelMain>
                <PanelMainBody>
                  <ExpandableSection
                    variant={ExpandableSectionVariant.truncate}
                    toggleText={isErrorExpanded ? t('Show less') : t('Show more')}
                    onToggle={onErrorToggle}
                    isExpanded={isErrorExpanded}
                  >
                    {roleAssignment.status?.message ?? t('Not available')}
                  </ExpandableSection>
                </PanelMainBody>
              </PanelMain>
            </Panel>
          }
          {...commonStatusTooltipProps}
        />
      )
    case roleAssignment.status?.status === 'Pending':
      return (
        <StatusTooltip
          icon={<Spinner isInline aria-label={t('Role Assignment being applied')} />}
          label={t('Pending')}
          {...commonStatusTooltipProps}
        />
      )
    default:
      return <p>{t('Unknown')}</p>
  }
}

export { RoleAssignmentStatusComponent }
