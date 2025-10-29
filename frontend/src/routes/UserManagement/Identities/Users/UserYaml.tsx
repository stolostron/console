/* Copyright Contributors to the Open Cluster Management project */
import { RBACResourceYaml } from '../../../../components/RBACResourceYaml'
import { useUserGroups } from './useUserGroups'

const UserYaml = () => {
  const { userWithGroups } = useUserGroups()

  return <RBACResourceYaml resource={userWithGroups} resourceType="User" loading={false} />
}

export { UserYaml }
