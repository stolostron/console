/* Copyright Contributors to the Open Cluster Management project */
import { Label, Panel, PanelMain, PanelMainBody, Popover, Spinner, TooltipProps } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../lib/acm-i18next'
import { RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'

type RoleAssignmentStatusComponentProps = {
  status?: RoleAssignmentStatus
}

const StatusTooltip = ({
  status,
  icon,
  label,
}: {
  status: RoleAssignmentStatus
  icon: TooltipProps['children']
  label: string
}) => {
  const { t } = useTranslation()
  const reason = status.reason ?? t('Not available')
  const message = status.message ?? t('Not available')

  return (
    <Popover
      triggerAction="hover"
      headerContent={reason}
      bodyContent={
        <Panel isScrollable>
          <PanelMain tabIndex={0} maxHeight="150px">
            <PanelMainBody style={{ padding: '0px' }}>{message}</PanelMainBody>
          </PanelMain>
        </Panel>
      }
    >
      <Label variant="outline">
        <span style={{ paddingRight: '8px' }}>{icon}</span>
        {label}
      </Label>
    </Popover>
  )
}

const RoleAssignmentStatusComponent = ({ status }: RoleAssignmentStatusComponentProps) => {
  const { t } = useTranslation()

  switch (status?.status) {
    case 'Active':
      return (
        <StatusTooltip
          status={status}
          icon={<CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />}
          label={t('Active')}
        />
      )
    case 'Error':
      return (
        <StatusTooltip
          status={status}
          icon={<ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />}
          label={t('Error')}
        />
      )
    case 'Pending':
      return (
        <StatusTooltip
          status={status}
          icon={<Spinner isInline aria-label="Role Assignment being applied" />}
          label={t('Pending')}
        />
      )
    default:
      return <p>{t('Unknown')}</p>
  }
}

export { RoleAssignmentStatusComponent }
