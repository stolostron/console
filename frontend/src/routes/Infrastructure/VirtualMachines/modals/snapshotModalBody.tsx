/* Copyright Contributors to the Open Cluster Management project */
import {
  Alert,
  AlertVariant,
  ExpandableSection,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Skeleton,
  Stack,
  StackItem,
  TextArea,
  TextInput,
  ValidatedOptions,
} from '@patternfly/react-core'
import { ExclamationCircleIcon } from '@patternfly/react-icons'
import { Dispatch, FC, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../lib/acm-i18next'
import { DOC_LINKS } from '../../../../lib/doc-util'
import { IResource } from '../../../../resources'
import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'
import { getBackendUrl, getRequest } from '../../../../resources/utils/resource-request'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { printableVMStatus } from '../utils'

// kubevirt modal - https://github.com/kubevirt-ui/kubevirt-plugin/blob/5f2e9729034fcd97ebdb2ad2e8fed214a16d77a9/src/utils/components/SnapshotModal/SnapshotModal.tsx
// https://kubevirt.io/user-guide/operations/snapshot_restore_api/#snapshot-a-virtualmachine
enum deadlineUnits {
  Hours = 'h',
  Minutes = 'm',
  Seconds = 's',
}

const generateSnapshotName = (vmName: string) => {
  const date = new Date().toISOString().replaceAll(/\D/g, '') // yyyyMMddkkmmss
  return `${vmName}-snapshot-${date}`
}

const SnapshotDeadlineFormField: FC<{
  deadline: string
  deadlineUnit: string
  setDeadline: React.Dispatch<React.SetStateAction<string>>
  setDeadlineUnit: React.Dispatch<React.SetStateAction<deadlineUnits>>
  setIsError: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ deadline, deadlineUnit, setDeadline, setDeadlineUnit, setIsError }) => {
  const { t } = useTranslation()

  const [deadlineError, setDeadlineError] = useState<boolean>(false)

  const validateSnapshotDeadline = (deadline: string): string | undefined => {
    if (deadline?.length > 0) {
      if (!Number(deadline)) {
        return t('Deadline must be a number')
      }
      if (Number(deadline) <= 0) {
        return t('Deadline must be greater than 0')
      }
    }
    return undefined
  }

  const handleDeadlineChange = (value: string, event: FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    const error = validateSnapshotDeadline(value)
    setIsError(!!error)
    setDeadlineError(!!error)
    setDeadline(value)
  }

  const handleDeadlineUnitChange = (value: deadlineUnits, event: FormEvent<HTMLSelectElement>) => {
    event.preventDefault()
    setDeadlineUnit(value)
  }

  const validated = deadlineError ? ValidatedOptions.error : ValidatedOptions.default

  return (
    <FormGroup fieldId="deadline" label={t('Deadline')}>
      <Grid hasGutter>
        <GridItem span={8}>
          <TextInput
            id="deadline"
            onChange={(event, value: string) => handleDeadlineChange(value, event)}
            type="text"
            value={deadline}
          />
        </GridItem>
        <GridItem span={4}>
          <FormSelect
            id="deadline-unit"
            onChange={(event, value) => handleDeadlineUnitChange(value as deadlineUnits, event)}
            value={deadlineUnit}
          >
            <FormSelectOption key="Hours" label={t('Hours (h)')} value={deadlineUnits.Hours} />
            <FormSelectOption key="Minutes" label={t('Minutes (m)')} value={deadlineUnits.Minutes} />
            <FormSelectOption key="Seconds" label={t('Seconds (s)')} value={deadlineUnits.Seconds} />
          </FormSelect>
        </GridItem>
      </Grid>
      <FormHelperText>
        <HelperText>
          <HelperTextItem
            icon={
              validated === ValidatedOptions.error && (
                <ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />
              )
            }
            variant={validated}
          >
            {deadlineError}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  )
}

const SnapshotSupportedVolumeList: React.FC<{
  supportedVolumes: any[]
}> = ({ supportedVolumes }) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const volumesCount = supportedVolumes.length
  const volumeCountMsg = t('Disks included in this snapshot ({{volumes}})', {
    volumes: volumesCount,
  })

  return (
    <FormGroup fieldId="snapshot-supported-volume-list">
      {volumesCount > 0 ? (
        <ExpandableSection
          isExpanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          toggleText={volumeCountMsg}
        >
          <Stack>{supportedVolumes?.map((vol) => <StackItem key={vol.name}>{vol.name}</StackItem>)}</Stack>
        </ExpandableSection>
      ) : (
        <b>{volumeCountMsg}</b>
      )}
    </FormGroup>
  )
}

const UnsupportedVolumesAlert: React.FC<{
  unsupportedVolumes: { enabled: boolean; name: string; reason?: string }[]
}> = ({ unsupportedVolumes }) => {
  const { t } = useTranslation()
  if (unsupportedVolumes.length === 0) {
    return null
  }
  return (
    <FormGroup fieldId="snapshot-unsupported-volumes-alert">
      <Alert
        title={t('The following disk will not be included in the snapshot', {
          count: unsupportedVolumes?.length,
        })}
        isInline
        variant={AlertVariant.warning}
      >
        <Stack hasGutter>
          <StackItem>
            <Stack>
              {unsupportedVolumes?.map((vol) => (
                <StackItem key={vol.name}>
                  <strong>{vol.name}</strong> - {vol.reason}
                </StackItem>
              ))}
            </Stack>
          </StackItem>
          <StackItem>
            {t('Edit the disk or contact your cluster admin for further details.', {
              count: unsupportedVolumes?.length,
            })}
          </StackItem>
          <StackItem>
            <a href={DOC_LINKS.VM_SNAPSHOT} rel="noreferrer" target="_blank">
              {t('Learn more about snapshots')}
            </a>
          </StackItem>
        </Stack>
      </Alert>
    </FormGroup>
  )
}

export function SnapshotModalBody(
  props: Readonly<{
    item: any
    setSnapshotReqBody: Dispatch<SetStateAction<object>>
    getVMError: boolean | undefined
    setGetVMError: Dispatch<SetStateAction<boolean | undefined>>
  }>
) {
  const { item, setSnapshotReqBody, getVMError, setGetVMError } = props
  const { t } = useTranslation()
  const { isFineGrainedRbacEnabledState } = useSharedAtoms()
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  const [vmLoading, setVMLoading] = useState<any>(true)
  const [vm, setVM] = useState<any>({})
  const [snapshotName, setSnapshotName] = useState<string>(generateSnapshotName(item.name))
  const [description, setDescription] = useState<string>('')
  const [deadline, setDeadline] = useState<string>('')
  const [deadlineUnit, setDeadlineUnit] = useState<deadlineUnits>(deadlineUnits.Seconds)

  useEffect(() => {
    if (isFineGrainedRbacEnabled) {
      const url = getBackendUrl() + `/virtualmachines/get/${item.cluster}/${item.name}/${item.namespace}`
      getRequest<IResource>(url)
        .promise.then((response) => {
          setVMLoading(false)
          setVM(response)
        })
        .catch((err) => {
          console.error('Error getting VirtualMachine: ', err)
          setGetVMError(true)
          setVMLoading(false)
        })
    } else {
      fleetResourceRequest('GET', item.cluster, {
        apiVersion: item.apiversion,
        kind: item.kind,
        name: item.name,
        namespace: item.namespace,
      })
        .then((res) => {
          setVMLoading(false)
          if ('errorMessage' in res) {
            console.error(`Error fetching parent VM: ${res.errorMessage}`)
            setGetVMError(true)
          } else {
            setVM(res)
            setGetVMError(false)
          }
        })
        .catch((err) => {
          console.error('Error getting VirtualMachine: ', err)
          setGetVMError(true)
          setVMLoading(false)
        })
    }

    return () => setGetVMError(false)
  }, [isFineGrainedRbacEnabled, item, setGetVMError])

  const isVMRunning = item?.status === printableVMStatus.Running
  const { supportedVolumes, unsupportedVolumes } = useMemo(() => {
    const volumeSnapshotStatuses: { name: string; enabled: boolean; reason?: string }[] =
      vm?.status?.volumeSnapshotStatuses || []
    const supportedVolumes = volumeSnapshotStatuses?.filter((status) => status?.enabled)
    const unsupportedVolumes = volumeSnapshotStatuses?.filter((status) => !status?.enabled)
    return {
      supportedVolumes,
      unsupportedVolumes,
    }
  }, [vm])

  useEffect(() => {
    const snapshotResource: any = {
      apiVersion: 'snapshot.kubevirt.io/v1beta1',
      kind: 'VirtualMachineSnapshot',
      metadata: {
        name: snapshotName,
        namespace: vm?.metadata?.namespace,
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
        source: {
          apiGroup: 'kubevirt.io',
          kind: 'VirtualMachine',
          name: vm?.metadata?.name,
        },
      },
    }
    if (description) {
      snapshotResource.metadata.annotations = { description }
    }
    if (deadline) {
      snapshotResource.spec.failureDeadline = `${deadline}${deadlineUnit}`
    }
    setSnapshotReqBody(snapshotResource)
  }, [deadline, deadlineUnit, description, setSnapshotReqBody, snapshotName, vm])

  return (
    <Form>
      {getVMError && (
        <Alert
          isInline
          title={t(
            'Error occurred while fetching VirtualMachine {{vmName}}. Please make sure the VirtualMachine exists and try the action again.',
            { vmName: item.name }
          )}
          variant={'warning'}
        />
      )}
      {isVMRunning ? (
        <Alert
          title={
            <Stack hasGutter>
              <StackItem>{t('Taking snapshot of running VirtualMachine.')}</StackItem>
            </Stack>
          }
          isInline
          variant={AlertVariant.info}
        />
      ) : null}
      <FormGroup fieldId="name" isRequired label={t('Name')}>
        <TextInput
          id="vmName"
          onChange={(_, newName: string) => setSnapshotName(newName)}
          type="text"
          value={snapshotName}
        />
      </FormGroup>
      <FormGroup fieldId="description" label={t('Description')}>
        <TextArea
          id="description"
          onChange={(_, newDescription: string) => setDescription(newDescription)}
          value={description}
        />
      </FormGroup>
      <SnapshotDeadlineFormField
        deadline={deadline}
        deadlineUnit={deadlineUnit}
        setDeadline={setDeadline}
        setDeadlineUnit={setDeadlineUnit}
        setIsError={() => {}}
      />
      {vmLoading ? (
        <>
          <Skeleton width="45%" />
          <Skeleton width="45%" />
        </>
      ) : (
        <>
          <SnapshotSupportedVolumeList supportedVolumes={supportedVolumes} />
          <UnsupportedVolumesAlert unsupportedVolumes={unsupportedVolumes} />
        </>
      )}
    </Form>
  )
}
