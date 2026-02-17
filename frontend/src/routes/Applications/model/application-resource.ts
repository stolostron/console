/* Copyright Contributors to the Open Cluster Management project */

import { IResource, OCPAppResource } from '../../../resources'
import { ApplicationStatus } from './application-status'

export type IApplicationResource = IResource<ApplicationStatus> | OCPAppResource<ApplicationStatus>
