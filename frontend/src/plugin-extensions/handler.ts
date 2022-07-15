/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isApplicationAction } from './extensions'
import { ApplicationActionProps } from './properties'
import { AcmExtension } from './types'

// Type guards
export function IsAcmExtensions() {
    const acmExtension: AcmExtension = {}

    // Resolving application action to acm compatible type
    const [applicationAction, reslovedApplicationAction] = useResolvedExtensions(isApplicationAction)
    if (reslovedApplicationAction) {
        acmExtension.applicationAction = applicationAction.map((action) => action.properties as ApplicationActionProps)
    }

    // list of all acm supported extensions
    return acmExtension
}
