/* Copyright Contributors to the Open Cluster Management project */

import { useTranslation } from '../../../../../lib/acm-i18next'
import {
  AcmAlert,
  AcmForm,
  AcmKubernetesLabelsInput,
  AcmNumberInput,
  AcmSelect,
  AcmSubmit,
  AcmTable,
  AcmTextInput,
} from '../../../../../ui-components'
import {
  ActionGroup,
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Panel,
  PanelMain,
  PanelMainBody,
  Stack,
  StackItem,
  SelectOption,
} from '@patternfly/react-core'
import {
  ClusterImageSetK8sResource,
  getOCPVersions,
  getVersionFromReleaseImage,
  HostedClusterK8sResource,
  OpenshiftVersionOptionType,
} from '@openshift-assisted/ui-lib/cim'
import { NodePool, NodePoolApiVersion, NodePoolKind } from '../../../../../resources'
import {
  createResource,
  HypershiftCloudPlatformType,
  IRequestResult,
  patchResource,
  ResourceError,
  resultsSettled,
} from '../../../../../resources/utils'
import { Fragment, useEffect, useState } from 'react'

export type ListItems = {
  key: string
  value?: string | number | React.ReactNode
  edit?: React.ReactNode
}

export function NodePoolForm(props: {
  hostedCluster: HostedClusterK8sResource
  close: () => void
  clusterImages?: ClusterImageSetK8sResource[]
  refNodepool?: NodePool // used to populate modal with data from existing nodepool
  nodepool?: NodePool
}): JSX.Element {
  const { t } = useTranslation()

  const [imageOptions, setNodepoolImageOptions] = useState<OpenshiftVersionOptionType[]>()
  const [name, setName] = useState<string>()
  const [selectedImage, setSelectedImage] = useState<string>()
  const [replicas, setReplicas] = useState<number>(props.nodepool?.spec.replicas ? props.nodepool.spec.replicas : 1)

  // AWS specific properties
  const [awsInstanceProfile, setAwsInstanceProfile] = useState<string>()
  const [awsInstanceType, setAwsInstanceType] = useState<string>()
  const [awsRootVolumeSize, setAwsRootVolumeSize] = useState<number>(120)
  const [awsRootVolumeType, setAwsRootVolumeType] = useState<string>('gp3')
  const [awsSecurityGroups, setAwsSecurityGroups] = useState<Record<string, string>>()
  const [awsSubnetID, setAwsSubnetID] = useState<string>()

  const [resourceErrors, setResourceErrors] = useState<any[]>([])
  const [useHCImage, setUseHCImage] = useState<boolean>(false)
  const isEdit = !!props.nodepool

  // Need to account for different types of cloud providers ie. AWS, Azure
  const nodepoolCommonProperties = {
    nodepoolNamespace: {
      key: t('Namespace'),
      value: props.hostedCluster.metadata?.namespace,
    },
    nodepoolName: {
      key: t('Name'),
      value: props.nodepool?.metadata.name,
      edit: (
        <AcmTextInput
          id="nodepool-name"
          label={t('Node pool name')}
          labelHelp={t('The name for the node pool.')}
          onChange={(_event, value) => setName(value)}
          value={name}
          isRequired
        />
      ),
    },
    nodepoolOpenshiftVersion: {
      key: t('OpenShift version'),
      value: props.nodepool?.status?.version,
      edit: (
        <AcmSelect
          id="nodepool-openshift-version-dropdown"
          label={t('OpenShift version')}
          value={selectedImage}
          isRequired
          onChange={(image) => {
            setSelectedImage(image)
          }}
        >
          {imageOptions?.map((option) => (
            <SelectOption key={option.version} value={option.version}>
              {option.version}
            </SelectOption>
          ))}
        </AcmSelect>
      ),
    },
    nodepoolReplicas: {
      key: t('Number of nodes'),
      value: undefined,
      edit: (
        <AcmNumberInput
          label={t('Number of nodes')}
          id="nodepool-replicas"
          value={replicas}
          onChange={(e: React.FormEvent<HTMLInputElement>) => {
            const newReplicas = Number((e.target as HTMLInputElement).value)
            if (newReplicas < 0) {
              setReplicas(0)
            } else {
              setReplicas(newReplicas)
            }
          }}
          onMinus={() => {
            const newReplicas = replicas - 1
            if (newReplicas < 0) {
              setReplicas(0)
            } else {
              setReplicas(newReplicas)
            }
          }}
          onPlus={() => setReplicas(replicas + 1)}
          required
        />
      ),
    },
  }

  const nodepoolAWSProperties = {
    nodepoolInstanceProfile: {
      key: t('Instance profile'),
      value: props.nodepool?.spec.platform.aws?.instanceProfile,
      edit: (
        <AcmTextInput
          id="nodepool-instanceprofile"
          label={t('Instance profile')}
          labelHelp={t('The instance profile for the node pool.')}
          onChange={(_event, value) => setAwsInstanceProfile(value)}
          isRequired
          value={awsInstanceProfile}
        />
      ),
    },
    nodepoolInstanceType: {
      key: t('Instance type'),
      value: props.nodepool?.spec.platform.aws?.instanceType,
      edit: (
        <AcmTextInput
          id="nodepool-instancetype"
          label={t('Instance type')}
          labelHelp={t('The instance type for the node pool.')}
          onChange={(_event, value) => setAwsInstanceType(value)}
          isRequired
          value={awsInstanceType}
        />
      ),
    },
    nodepoolRootVolumeSize: {
      key: t('Root volume size'),
      value: props.nodepool?.spec.platform.aws?.rootVolume.size,
      edit: (
        <AcmNumberInput
          id="nodepool-rootvolumesize"
          label={t('Root volume size')}
          labelHelp={t('The root volume size for the node pool.')}
          onChange={(e: React.FormEvent<HTMLInputElement>) =>
            setAwsRootVolumeSize(Number((e.target as HTMLInputElement).value))
          }
          required
          value={awsRootVolumeSize}
          onMinus={() => setAwsRootVolumeSize(replicas - 1)}
          onPlus={() => setAwsRootVolumeSize(replicas + 1)}
        />
      ),
    },
    nodepoolRootVolumeType: {
      key: t('Root volume type'),
      value: props.nodepool?.spec.platform.aws?.rootVolume.size,
      edit: (
        <AcmTextInput
          id="nodepool-rootvolumetype"
          label={t('Root volume type')}
          labelHelp={t('The root volume type for the node pool.')}
          onChange={(_event, value) => setAwsRootVolumeType(value)}
          isRequired
          value={awsRootVolumeType}
        />
      ),
    },
    nodepoolSecurityGroups: {
      key: t('Security groups'),
      value:
        props.nodepool?.spec.platform.aws?.securityGroups &&
        props.nodepool?.spec.platform.aws?.securityGroups.length > 0
          ? props.nodepool?.spec.platform.aws?.securityGroups[0].id
          : '',
      edit: (
        <AcmKubernetesLabelsInput
          id="nodepool-rootvolumetype"
          label={t('Security groups')}
          value={awsSecurityGroups}
          onChange={setAwsSecurityGroups}
        />
      ),
    },
    nodepoolSubnet: {
      key: t('Subnet ID'),
      value: props.nodepool?.spec.platform.aws?.subnet.id,
      edit: (
        <AcmTextInput
          id="nodepool-subnetid"
          label={t('Subnet ID')}
          labelHelp={t('The subnet ID for the node pool.')}
          onChange={(_event, value) => setAwsSubnetID(value)}
          isRequired
          value={awsSubnetID}
          isDisabled={props.refNodepool ? true : false}
        />
      ),
    },
  }

  //Checks if minor version of image is >= 11
  const isValidImage = (version: string | undefined) => {
    if (!version) {
      return false
    }
    const versionParts = version.split('.')
    if (Number(versionParts[1]) < 11) {
      return false
    }
    return true
  }

  // nodepool version need to be within n-2 and cannot be greater than hostedcluster
  const isWithinTwoVersions = (cpVersion: string | undefined, npVersion: string | undefined) => {
    if (!cpVersion || !npVersion) {
      return false
    }
    const cpVersionParts = cpVersion.split('.')
    const npVersionParts = npVersion.split('.')

    if (cpVersionParts[0] > npVersionParts[0] || cpVersionParts[0] < npVersionParts[0]) {
      return false
    }

    const versionDiff = Number(cpVersionParts[1]) - Number(npVersionParts[1])
    if (versionDiff <= 2 && versionDiff > -1) {
      return true
    }

    return false
  }

  useEffect(() => {
    const ver = getVersionFromReleaseImage(props.hostedCluster.spec.release.image)
    if (ver && selectedImage === undefined && props.clusterImages && props.clusterImages.length > 0) {
      const availableImages = getOCPVersions(props.clusterImages)
      const filteredImages: any[] = []
      availableImages.forEach((image) => {
        if (image.version <= ver && isWithinTwoVersions(ver, image.version) && isValidImage(image.version)) {
          filteredImages.push(image)
        }
      })

      //If HCP image is not in filtered images, add it to the list in order to be selectable
      let hcpVerFound = false
      filteredImages.forEach((image: OpenshiftVersionOptionType) => {
        if (image.version === ver) {
          hcpVerFound = true
        }
      })

      if (!hcpVerFound) {
        const hcpImage: OpenshiftVersionOptionType = {
          label: 'N/A',
          value: ver,
          version: ver,
          default: true,
          supportLevel: 'beta',
        }
        filteredImages.push(hcpImage)
      }

      if (filteredImages.length > 0) {
        setNodepoolImageOptions(filteredImages)
        setSelectedImage(filteredImages[0].version)
        setUseHCImage(false)
      } else {
        setSelectedImage(getVersionFromReleaseImage(props.hostedCluster.spec.release.image))
        setUseHCImage(true)
      }
    }
    if (!props.clusterImages || props.clusterImages.length === 0 || selectedImage === ver) {
      setUseHCImage(true)
    }

    if (props.hostedCluster.spec.platform?.type === HypershiftCloudPlatformType.AWS) {
      if ((props.refNodepool?.spec.platform?.aws?.securityGroups?.length || -1) > 0) {
        const sgs: any = {}
        props.refNodepool?.spec.platform?.aws?.securityGroups.forEach((sg: any) => {
          sgs[sg.id] = ''
        })
        setAwsSecurityGroups({ ...sgs })
      }
    }

    if (props.refNodepool) {
      setAwsInstanceProfile(props.refNodepool.spec.platform.aws?.instanceProfile)
      setAwsInstanceType(props.refNodepool.spec.platform.aws?.instanceType)
      setAwsSubnetID(props.refNodepool.spec.platform.aws?.subnet.id)
    }
  }, [
    props.hostedCluster.spec.platform.type,
    props.refNodepool?.spec.platform?.aws?.securityGroups,
    props.clusterImages,
    props.hostedCluster.spec.release.image,
    props.refNodepool,
    selectedImage,
  ])

  const nodepoolItems: ListItems[] = [
    nodepoolCommonProperties.nodepoolNamespace,
    nodepoolCommonProperties.nodepoolName,
    nodepoolCommonProperties.nodepoolOpenshiftVersion,
    nodepoolCommonProperties.nodepoolReplicas,
  ]

  if (!isEdit) {
    switch (props.hostedCluster.spec.platform.type) {
      case HypershiftCloudPlatformType.AWS:
        nodepoolItems.push(
          nodepoolAWSProperties.nodepoolInstanceProfile,
          nodepoolAWSProperties.nodepoolInstanceType,
          nodepoolAWSProperties.nodepoolRootVolumeSize,
          nodepoolAWSProperties.nodepoolRootVolumeType,
          nodepoolAWSProperties.nodepoolSecurityGroups,
          nodepoolAWSProperties.nodepoolSubnet
        )
        break
      case HypershiftCloudPlatformType.Azure:
        break
      case HypershiftCloudPlatformType.PowerVS:
        break
      default:
        break
    }
  }

  const createNodepool = () => {
    let platform: any
    if (props.hostedCluster.spec.platform.type === HypershiftCloudPlatformType.AWS) {
      platform = {
        aws: {
          instanceProfile: awsInstanceProfile || '',
          instanceType: awsInstanceType || '',
          rootVolume: {
            size: awsRootVolumeSize,
            type: awsRootVolumeType,
          },
          securityGroups: Object.keys(awsSecurityGroups || {}).map((sg) => {
            return {
              id: sg,
            }
          }),
          subnet: {
            id: awsSubnetID || '',
          },
        },
        type: HypershiftCloudPlatformType.AWS,
      }
    }

    const nodepoolYAML: NodePool = {
      apiVersion: NodePoolApiVersion,
      kind: NodePoolKind,
      metadata: {
        name,
        namespace: props.hostedCluster.metadata?.namespace,
        labels: {
          'hypershift.openshift.io/auto-created-for-infra': props.hostedCluster.spec.infraID || '',
        },
      },
      spec: {
        clusterName: props.hostedCluster.metadata?.name || '',
        management: {
          autoRepair: false,
          replace: {
            rollingUpdate: {
              maxSurge: 1,
              maxUnavailable: 0,
            },
            strategy: 'RollingUpdate',
          },
          upgradeType: 'Replace',
        },
        platform,
        release: {
          image: useHCImage
            ? props.hostedCluster.spec?.release.image || ''
            : props.clusterImages?.find((image) => !!selectedImage && image.spec?.releaseImage.includes(selectedImage))
                ?.spec?.releaseImage || '',
        },
        replicas,
      },
    }

    const createResult = createResource(nodepoolYAML)

    return {
      promise: new Promise((resolve, reject) => {
        createResult.promise
          .then((data) => {
            return resolve(data)
          })
          .catch((err: ResourceError) => {
            reject(err)
          })
      }),
      abort: () => {
        createResult.abort()
      },
    }
  }

  const updateNodepool = () => {
    const resourceYAML = {
      apiVersion: NodePoolApiVersion,
      kind: NodePoolKind,
      metadata: {
        name: props.nodepool?.metadata.name,
        namespace: props.nodepool?.metadata.namespace,
      },
    } as NodePool

    const patchYAML = {
      spec: {
        replicas,
      },
    }

    const patchResult = patchResource(resourceYAML, patchYAML)
    return {
      promise: new Promise((resolve, reject) => {
        patchResult.promise
          .then((data) => {
            return resolve(data)
          })
          .catch((err: ResourceError) => {
            reject(err)
          })
      }),
      abort: () => {
        patchResult.abort()
      },
    }
  }

  return (
    <AcmForm style={{ gap: 0 }}>
      {resourceErrors.length === 0 ? (
        <Fragment>
          <Panel isScrollable>
            <PanelMain>
              <PanelMainBody>
                <Stack hasGutter>
                  {nodepoolItems.map(({ key, value, edit }) => (
                    <StackItem key={key}>
                      {(isEdit || key === 'Namespace') && value !== undefined ? (
                        <DescriptionList isHorizontal>
                          <DescriptionListGroup key={key}>
                            <DescriptionListTerm>{key}</DescriptionListTerm>
                            <DescriptionListDescription>{value}</DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      ) : (
                        <Fragment>{edit}</Fragment>
                      )}
                    </StackItem>
                  ))}
                </Stack>
              </PanelMainBody>
            </PanelMain>
          </Panel>
          <ActionGroup>
            <AcmSubmit
              key="submit-hypershift-addnodepool-action"
              id="submit-button-nodepool-form"
              isDisabled={isEdit && replicas === props.nodepool?.spec.replicas}
              variant={ButtonVariant.primary}
              onClick={async () => {
                const errors: any[] = []
                const resultArr: IRequestResult[] = []
                if (!isEdit) {
                  resultArr.push(createNodepool())
                } else {
                  resultArr.push(updateNodepool())
                }

                const requestResult = resultsSettled(resultArr)
                const promiseResults = await requestResult.promise
                promiseResults.forEach((promiseResult) => {
                  if (promiseResult.status === 'rejected') {
                    errors.push({
                      name,
                      msg: promiseResult.reason,
                    })
                  }
                })

                await new Promise((resolve) => setTimeout(resolve, 500))
                setResourceErrors(errors)
                if (errors.length === 0) {
                  props.close()
                }
              }}
              label={isEdit ? t('update') : t('Add')}
              processingLabel={t('Processing')}
            />
            <Button variant="link" onClick={props.close} key="cancel-nodepool-form" id="cancel-nodepool-form">
              {t('cancel')}
            </Button>
          </ActionGroup>
        </Fragment>
      ) : (
        <Fragment>
          <AcmAlert isInline noClose variant="danger" title={t('there.were.errors')} />
          <AcmTable
            items={resourceErrors}
            emptyState={undefined} // only shown when resourceErrors.length > 0
            columns={[
              {
                header: t('Name'),
                cell: (error) => {
                  return error.name
                },
              },
              {
                header: t('Error'),
                cell: (error) => {
                  // remove backslashes
                  return JSON.stringify(error.msg.message).replaceAll('\\', '')
                },
              },
            ]}
            keyFn={(error) => error.name as string}
            tableActions={[]}
            rowActions={[]}
            perPageOptions={[]}
            autoHidePagination
          />
          <Button variant="link" onClick={props.close} key="hypershift-nodepool-error-close">
            {t('Close')}
          </Button>
        </Fragment>
      )}
    </AcmForm>
  )
}
