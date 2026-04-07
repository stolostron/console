/* Copyright Contributors to the Open Cluster Management project */
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'
import { useUserDetailsContext } from './UserPage'
import { useUserGroups } from './useUserGroups'

const UserYaml = () => {
  const { user } = useUserDetailsContext()
  const { userWithGroups } = useUserGroups()

  return <RBACResourceYaml resource={user ? userWithGroups : undefined} resourceType="User" loading={false} />
}

export { UserYaml }
