/* Copyright Contributors to the Open Cluster Management project */
import { SupportedExtensions } from '../supportedExtensions'
import { IAcmRowAction } from '../../ui-components'
import { Extension, ExtensionDeclaration, ResolvedCodeRefProperties, CodeRef} from '../types'

export type AddActionProps = ExtensionDeclaration<
  SupportedExtensions.ACM_ADD_ACTION,
  {
    /** ID used to identify the action. */
    id: string;
    /** IAcmRowActionProps object.*/
    iAcmRowAction: CodeRef<IAcmRowAction<any>>
  }
>

// Type guards
export const isAddActionProps = (e: Extension): e is ResolvedCodeRefProperties<AddActionProps> =>
   e.type === SupportedExtensions.ACM_ADD_ACTION
