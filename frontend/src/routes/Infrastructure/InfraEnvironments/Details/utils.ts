/* Copyright Contributors to the Open Cluster Management project */
import { createResource, patchResource } from '../../../../resources'
import { isEqual } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'

const { getBareMetalHostCredentialsSecret } = CIM

const appendPatch = (patches: any, path: string, newVal: object | string | boolean, existingVal?: object | string) => {
    if (!isEqual(newVal, existingVal)) {
        patches.push({
            op: existingVal ? 'replace' : 'add',
            path,
            value: newVal,
        })
    }
}

export type ModalProps = {
    bmh: CIM.BareMetalHostK8sResource
    nmState: CIM.NMStateK8sResource
    secret: CIM.SecretK8sResource
}

export const onEditBMH =
    (editModal: ModalProps | undefined) => async (values: CIM.AddBmcValues, nmState: CIM.NMStateK8sResource) => {
        let newSecret
        if (editModal?.secret) {
            const patches: any[] = []
            appendPatch(patches, '/data/username', values.username, atob(editModal.secret.data.username))
            appendPatch(patches, '/data/password', values.password, atob(editModal.secret.data.password))
            if (patches.length) {
                await patchResource(editModal.secret, patches).promise
            }
        } else {
            const secret = getBareMetalHostCredentialsSecret(values, editModal?.bmh?.metadata.namespace)
            newSecret = await createResource<any>(secret).promise
        }

        if (editModal?.nmState) {
            const patches: any[] = []
            appendPatch(patches, '/spec/config', nmState.spec.config, editModal.nmState.spec.config)
            appendPatch(patches, '/spec/interfaces', nmState.spec.interfaces, editModal.nmState.spec.interfaces)
            if (patches.length) {
                await patchResource(editModal.nmState, patches).promise
            }
        } else {
            await createResource<any>(nmState).promise
        }

        if (editModal?.bmh) {
            const patches: any[] = []
            appendPatch(patches, '/spec/bmc/address', values.bmcAddress, editModal.bmh.spec.bmc.address)
            appendPatch(
                patches,
                '/spec/bmc/disableCertificateVerification',
                values.disableCertificateVerification,
                editModal.bmh.spec.bmc.disableCertificateVerification
            )
            appendPatch(patches, '/spec/bootMACAddress', values.bootMACAddress, editModal.bmh.spec.bootMACAddress)
            appendPatch(patches, '/spec/online', values.online, editModal.bmh.spec.online)

            if (newSecret) {
                appendPatch(
                    patches,
                    '/spec/bmc/credentialsName',
                    newSecret.metadata.name,
                    editModal.bmh.spec.bmc.credentialsName
                )
            }
            if (patches.length) {
                await patchResource(editModal.bmh, patches).promise
            }
        }
    }
