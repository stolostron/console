/* Copyright Contributors to the Open Cluster Management project */
import { Label, Spinner, Tooltip } from '@patternfly/react-core'
import { useTranslation } from '../../../lib/acm-i18next'
import { RoleAssignmentStatus } from '../../../resources/multicluster-role-assignment'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'

type RoleAssignmentStatusComponentProps = {
  status?: RoleAssignmentStatus
}
const RoleAssignmentStatusComponent = ({ status }: RoleAssignmentStatusComponentProps) => {
  const { t } = useTranslation()

  switch (status?.status) {
    case 'Active':
      return (
        <Label variant="outline">
          <span style={{ paddingRight: '8px' }}>
            <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)' }} />
          </span>
          {t('Active')}
        </Label>
      )
    case 'Error':
      return (
        <Tooltip content={status.reason}>
          <Label variant="outline">
            <span style={{ paddingRight: '8px' }}>
              <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />
            </span>
            {t('Error')}
          </Label>
        </Tooltip>
      )
    case 'Pending':
      return (
        <Tooltip content={t('Role assignment is being applied')}>
          <Label variant="outline">
            <span style={{ paddingRight: '8px' }}>
              <Spinner isInline aria-label="Role Assignment being applied" />
            </span>
            {t('Pending')}
          </Label>
        </Tooltip>
      )
    default:
      return <p>{t('Unknown')}</p>
  }
}

export { RoleAssignmentStatusComponent }
