/* Copyright Contributors to the Open Cluster Management project */
import { Stack, StackItem } from '@patternfly/react-core'
import { Dispatch, SetStateAction, useEffect } from 'react'
import { Trans, useTranslation } from '../../../../lib/acm-i18next'

export function SnapshotRestoreModalBody(
  props: Readonly<{ item: any; vm: any; setSnapshotRestoreReqBody: Dispatch<SetStateAction<object>> }>
) {
  const { t } = useTranslation()
  const { item, vm, setSnapshotRestoreReqBody } = props

  useEffect(() => {
    setSnapshotRestoreReqBody({
      apiVersion: 'snapshot.kubevirt.io/v1beta1',
      kind: 'VirtualMachineRestore',
      metadata: {
        name: `${item.name}-${Date.now()}`,
        namespace: item.namespace,
        ownerReferences: [
          {
            apiVersion: vm?.apiVersion,
            blockOwnerDeletion: false,
            kind: vm?.kind,
            name: vm?.metadata?.name,
            uid: vm?.metadata?.uid,
          },
        ],
      },
      spec: {
        target: {
          apiGroup: 'kubevirt.io',
          kind: 'VirtualMachine',
          name: vm?.metadata?.name,
        },
        virtualMachineSnapshotName: item.name,
      },
    })
  }, [item, setSnapshotRestoreReqBody, vm])

  return (
    <Stack hasGutter>
      <StackItem>
        {t('Are you sure you want to restore {{sourceVM}} from snapshot {{snapshotName}}', {
          sourceVM: item.sourceName,
          snapshotName: item.name,
        })}
      </StackItem>
      <StackItem>
        <Trans i18nKey={t('snapshot.restore.modal.body')} components={{ bold: <strong /> }} />
      </StackItem>
    </Stack>
  )
}
