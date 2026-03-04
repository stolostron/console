/* Copyright Contributors to the Open Cluster Management project */
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { BulkActionModalProps } from '../../../components/BulkActionModal'
import AcmTimestamp from '../../../lib/AcmTimestamp'
import { NavigationPath } from '../../../NavigationPath'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { IRequestResult } from '../../../resources/utils/resource-request'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'
import { RoleAssignmentLabel } from './RoleAssignmentLabel'
import { RoleAssignmentStatusComponent, RoleAssignmentStatusComponentProps } from './RoleAssignmentStatusComponent'

// Component for rendering clickable role links
const RoleLinkCell = ({ roleName }: { roleName: string }) => (
  <Link to={generatePath(NavigationPath.roleDetails, { id: roleName })}>{roleName}</Link>
)

// Component for rendering clickable cluster links
const ClusterSetLinksCell = ({ clusterSetNames }: { clusterSetNames: string[] }) =>
  clusterSetNames.length ? (
    <RoleAssignmentLabel
      elements={clusterSetNames}
      numLabel={3}
      renderElement={(clusterSetName) => (
        <Link
          key={clusterSetName}
          to={generatePath(NavigationPath.clusterSetOverview, {
            id: clusterSetName,
          })}
        >
          {clusterSetName}
        </Link>
      )}
    />
  ) : (
    '-'
  )
// Component for rendering clickable cluster links
const ClusterLinksCell = ({ clusterNames }: { clusterNames: string[] }) => (
  <RoleAssignmentLabel
    elements={clusterNames}
    numLabel={3}
    renderElement={(clusterName) => (
      <Link
        key={clusterName}
        to={generatePath(NavigationPath.clusterOverview, {
          namespace: clusterName,
          name: clusterName,
        })}
      >
        {clusterName}
      </Link>
    )}
  />
)

// Component for rendering namespaces with label group
const NamespacesCell = ({ namespaces }: { namespaces?: string[] }) => (
  <RoleAssignmentLabel elements={namespaces} numLabel={5} />
)

const renderSubjectNameCell = (name: string, kind: string) => {
  if (!name || name.trim() === '') {
    return '-'
  }

  const linkPath =
    kind === 'Group'
      ? generatePath(NavigationPath.identitiesGroupsDetails, { id: name })
      : generatePath(NavigationPath.identitiesUsersDetails, { id: name })

  return <Link to={linkPath}>{name}</Link>
}

// Component for rendering created timestamp placeholder
const renderCreatedCell = (roleAssignment: FlattenedRoleAssignment) => (
  <AcmTimestamp timestamp={roleAssignment.status?.createdAt ?? undefined} />
)

// Cell renderer functions
const renderRoleCell = (roleAssignment: FlattenedRoleAssignment) => (
  <RoleLinkCell roleName={roleAssignment.clusterRole} />
)

const renderNamespacesCell = (roleAssignment: FlattenedRoleAssignment) => (
  <NamespacesCell namespaces={roleAssignment.targetNamespaces} />
)

const renderStatusCell = (props: {
  roleAssignment: FlattenedRoleAssignment
  callbackMap: RoleAssignmentStatusComponentProps['callbackMap']
  isCallbackProcessing: boolean
  areActionButtonsDisabled?: boolean
}) => <RoleAssignmentStatusComponent {...props} />

const renderClusterSetsCell = (roleAssignment: FlattenedRoleAssignment) => (
  <ClusterSetLinksCell clusterSetNames={roleAssignment.clusterSetNames} />
)
const renderClustersCell = (roleAssignment: FlattenedRoleAssignment) => (
  <ClusterLinksCell clusterNames={roleAssignment.clusterNames} />
)

// Component for rendering action dropdown
const ActionCell = ({
  roleAssignment,
  setModalProps,
  deleteAction,
  canDelete,
  canPatch,
  onEdit,
}: {
  roleAssignment: FlattenedRoleAssignment
  setModalProps: React.Dispatch<React.SetStateAction<BulkActionModalProps<FlattenedRoleAssignment> | { open: false }>>
  deleteAction: (roleAssignment: FlattenedRoleAssignment) => IRequestResult<unknown>
  canDelete: boolean
  canPatch: boolean
  onEdit: (roleAssignment: FlattenedRoleAssignment) => void
}) => (
  <RoleAssignmentActionDropdown
    roleAssignment={roleAssignment}
    setModalProps={setModalProps}
    deleteAction={deleteAction}
    canDelete={canDelete}
    canPatch={canPatch}
    onEdit={onEdit}
  />
)

// Action cell renderer (needs access to component state)
const renderActionCell = ({
  roleAssignment,
  setModalProps,
  deleteAction,
  canDelete,
  canPatch,
  onEdit,
}: {
  roleAssignment: FlattenedRoleAssignment
  setModalProps: React.Dispatch<React.SetStateAction<BulkActionModalProps<FlattenedRoleAssignment> | { open: false }>>
  deleteAction: (roleAssignment: FlattenedRoleAssignment) => IRequestResult<unknown>
  canDelete: boolean
  canPatch: boolean
  onEdit: (roleAssignment: FlattenedRoleAssignment) => void
}) => (
  <ActionCell
    roleAssignment={roleAssignment}
    setModalProps={setModalProps}
    deleteAction={deleteAction}
    canDelete={canDelete}
    canPatch={canPatch}
    onEdit={onEdit}
  />
)

export {
  renderActionCell,
  renderClustersCell,
  renderClusterSetsCell,
  renderCreatedCell,
  renderNamespacesCell,
  renderRoleCell,
  renderStatusCell,
  renderSubjectNameCell,
}
