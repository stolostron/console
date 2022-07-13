/* Copyright Contributors to the Open Cluster Management project */
import { SupportedExtensions } from './supportedExtensions'
import { Extension } from './types'


// Type guards
export const isAcmExtensions = (e: Extension):  e is Extension =>
    (Object.values(SupportedExtensions) as string[]).includes(e.type)
