/* Copyright Contributors to the Open Cluster Management project */
import { Label } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { Group, ServiceAccount, User } from '../../resources/rbac'

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
          <CheckCircleIcon
            style={{
              color: 'var(--pf-t--global--icon--color--status--success--default)',
            }}
          />
        </span>
        Active
      </Label>
    )
  } else {
    return (
      <Label variant="outline">
        <span style={{ paddingRight: '8px' }}>
          <ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />
        </span>
        Inactive
      </Label>
    )
  }
}
