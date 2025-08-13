/* Copyright Contributors to the Open Cluster Management project */
import { Label } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { User, Group, ServiceAccount } from '../../resources/rbac'

export interface IdentityStatusProps {
  identity: User | Group | ServiceAccount
}

export function isIdentityActive(identity: User | Group | ServiceAccount): boolean {
  switch (identity.kind) {
    case 'User':
      // TODO: add status logic once its implemented on backend
      return true
    case 'Group':
      // TODO: add status logic once its implemented on backend
      return true
    case 'ServiceAccount':
      // TODO: add status logic once its implemented on backend
      return true
    default:
      return false
  }
}

export const IdentityStatus = ({ identity }: IdentityStatusProps) => {
  const isActive = isIdentityActive(identity)

  if (isActive) {
    return (
      <Label variant="outline">
        <span style={{ paddingRight: '8px' }}>
          <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)' }} />
        </span>
        Active
      </Label>
    )
  } else {
    return (
      <Label variant="outline">
        <span style={{ paddingRight: '8px' }}>
          <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />
        </span>
        Inactive
      </Label>
    )
  }
}

export default IdentityStatus
