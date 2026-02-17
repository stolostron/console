/* Copyright Contributors to the Open Cluster Management project */
import { IApplicationResource } from './model/application-resource'
import { OCPAppResource } from '../../resources/ocp-app-resource'
import { ApplicationStatus } from './model/application-status'

const isOCPAppResource = (resource: IApplicationResource): resource is OCPAppResource<ApplicationStatus> =>
  'label' in resource

export { isOCPAppResource }
