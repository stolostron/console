/* Copyright Contributors to the Open Cluster Management project */
import { useRolesContext, useCurrentRole } from '../RolesPage'
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'

const RoleYaml = () => {
  const { loading } = useRolesContext()
  const role = useCurrentRole()

  return <RBACResourceYaml resource={role} loading={loading} resourceType="Role" />
}

export { RoleYaml }
