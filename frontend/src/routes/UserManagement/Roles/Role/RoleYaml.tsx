/* Copyright Contributors to the Open Cluster Management project */
import { useCurrentRole } from '../RolesPage'
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'

const RoleYaml = () => {
  const role = useCurrentRole()

  return <RBACResourceYaml resource={role} loading={false} resourceType="Role" />
}
// TODO: trigger sonar issue
export { RoleYaml }
