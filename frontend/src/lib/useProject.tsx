import { Project, projectMethods } from '../library/resources/project'
import { ResourceList } from '../library/resources/resource'
import { useQuery } from './useQuery'

export function useProjects() {
    return useQuery<ResourceList<Project>>(projectMethods.listCluster)
}
