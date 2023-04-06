/* Copyright Contributors to the Open Cluster Management project */

import { ICatalogBreadcrumb } from '@stolostron/react-data-view'
import { NavigationPath } from '../../../../../../NavigationPath'

export const breadcrumbs = (hcType: string, t: any) => {
  const newBreadcrumbs: ICatalogBreadcrumb[] = [
    { label: t('Clusters'), to: NavigationPath.clusters },
    { label: t('Infrastructure'), to: NavigationPath.createCluster },
    { label: t('Control plane type - {{hcType}}', { hcType: hcType }) },
  ]
  return newBreadcrumbs
}
