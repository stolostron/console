/* Copyright Contributors to the Open Cluster Management project */

import { generatePath, NavigateFunction } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../NavigationPath'
import { ApplicationSetKind, IResource, PlacementKind } from '../../../resources'
import { createResources } from '../../../resources/utils'
import { argoAppSetQueryString } from './actions'

export interface CreateArgoResourcesOptions {
  resources: IResource[]
  toast: {
    addAlert: (alert: {
      title: string
      message: string
      type: 'success' | 'danger' | 'warning' | 'info'
      autoClose?: boolean
    }) => void
  }
  t: (key: string, options?: Record<string, unknown>) => string
  submitForm: () => void
  navigate: NavigateFunction
}

export async function createArgoResources({
  resources,
  toast,
  t,
  submitForm,
  navigate,
}: CreateArgoResourcesOptions): Promise<void> {
  // Filter out Placement resources to create first
  const placementResources: IResource[] = []
  const remainingResources = resources.filter((resource) => {
    if (resource.kind === PlacementKind) {
      placementResources.push(resource)
      return false
    }
    return true
  })

  // Create Placement resources first
  if (placementResources.length > 0) {
    await createResources(placementResources)
  }

  // Create remaining resources (including ApplicationSet)
  return createResources(remainingResources).then(() => {
    const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
    if (applicationSet) {
      toast.addAlert({
        title: t('Application set created'),
        message: t('{{name}} was successfully created.', { name: applicationSet.metadata?.name }),
        type: 'success',
        autoClose: true,
      })
    }
    submitForm()
    navigate({
      pathname: generatePath(NavigationPath.applicationOverview, {
        namespace: applicationSet?.metadata?.namespace ?? '',
        name: applicationSet?.metadata?.name ?? '',
      }),
      search: argoAppSetQueryString,
    })
  })
}
