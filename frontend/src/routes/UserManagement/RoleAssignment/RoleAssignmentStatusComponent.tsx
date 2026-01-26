/* Copyright Contributors to the Open Cluster Management project */
import { Label, Spinner, Tooltip, TooltipProps } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { useTranslation } from '../../../lib/acm-i18next'
import { RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'

type RoleAssignmentStatusComponentProps = {
  status?: RoleAssignmentStatus
}

const StatusTooltip = ({ status, children }: { status: RoleAssignmentStatus; children: TooltipProps['children'] }) => (
  <Tooltip content={`${status.reason}: ${status.message}`}>{children}</Tooltip>
)

const RoleAssignmentStatusComponent = ({ status }: RoleAssignmentStatusComponentProps) => {
  const { t } = useTranslation()

  switch (status?.status) {
    case 'Active':
      return (
        <StatusTooltip status={status}>
          <Label variant="outline">
            <span style={{ paddingRight: '8px' }}>
              <CheckCircleIcon
                style={{
                  color: 'var(--pf-t--global--icon--color--status--success--default)',
                }}
              />
            </span>
            {t('Active')}
          </Label>
        </StatusTooltip>
      )
    case 'Error':
      return (
        <StatusTooltip status={status}>
          <Label variant="outline">
            <span style={{ paddingRight: '8px' }}>
              <ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />
            </span>
            {t('Error')}
          </Label>
        </StatusTooltip>
      )
    case 'Pending':
      return (
        <StatusTooltip status={status}>
          <Label variant="outline">
            <span style={{ paddingRight: '8px' }}>
              <Spinner isInline aria-label="Role Assignment being applied" />
            </span>
            {t('Pending')}
          </Label>
        </StatusTooltip>
      )
    default:
      return <p>{t('Unknown')}</p>
  }
}

export { RoleAssignmentStatusComponent }
