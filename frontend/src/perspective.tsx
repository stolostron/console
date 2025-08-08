/* Copyright Contributors to the Open Cluster Management project */

import { NavigationPath } from './NavigationPath'
import { MulticlusterIcon } from '@patternfly/react-icons'

export const icon = { default: MulticlusterIcon }

export const getLandingPageURL = () => NavigationPath.managedClusters

export const getImportRedirectURL = (namespace: string) => `/k8s/cluster/projects/${namespace}/workloads`
