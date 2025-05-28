/* Copyright Contributors to the Open Cluster Management project */

import { PageSection, SelectOption } from '@patternfly/react-core'
import { AcmAlert, AcmLoadingPage, AcmLogWindow, AcmSelect } from '../../../../../ui-components'
import { TFunction } from 'react-i18next'
import _ from 'lodash'
import { ReactNode, useEffect, useState } from 'react'
import { fetchRetry, getBackendUrl } from '../../../../../resources/utils'
import { createResourceURL } from '../helpers/diagram-helpers'
import './LogsContainer.css'
import { useLocalHubName } from '../../../../../hooks/use-local-hub'

export interface ILogsContainerProps {
  node: any[]
  t: TFunction
  renderResourceURLLink: (data: any, t: TFunction, isPod: boolean) => ReactNode
}

export function LogsContainer(props: ILogsContainerProps) {
  let resourceError = ''
  const t = props.t
  const podModel = _.get(props.node, 'specs.podModel')
  const pods = podModel && Object.keys(podModel).length > 0 ? podModel[Object.keys(podModel)[0]] : []
  const localHubName = useLocalHubName()

  if (pods.length === 0) {
    resourceError = t('No pods found')
  }

  let initialPod = ''
  let initialContainers: string[] = []
  let initialContainer = ''
  let initialNamespace = ''
  let initialCluster = ''
  let initialPodURL = ''
  if (pods.length > 0) {
    initialPod = pods[0].name
    initialContainers = pods[0].container
      ? pods[0].container.split(';').map((item: string) => {
          return item.trim()
        })
      : []
    initialContainer = initialContainers.length > 0 ? initialContainers[0] : ''
    initialNamespace = pods[0].namespace
    initialCluster = pods[0].cluster
    initialPodURL = createResourceURL(
      {
        cluster: initialCluster,
        type: pods[0].kind,
        namespace: initialNamespace,
        name: initialPod,
        specs: {
          raw: {
            apiVersion: pods[0].apiversion,
          },
        },
      },
      t,
      true
    )
  }
  const [selectedPod, setSelectedPod] = useState<string | ''>(initialPod)
  const [logs, setLogs] = useState<string>('')
  const [logsError, setLogsError] = useState<string>()
  const [container, setContainer] = useState<string>(initialContainer)
  const [currentContainers, setCurrentContainers] = useState<string[]>(initialContainers)
  const [currentPodURL, setCurrentPodURL] = useState<string>(initialPodURL)
  const [currentNamespace, setCurrentNamespace] = useState<string>(initialNamespace)
  const [cluster, setCluster] = useState<string>(initialCluster)

  useEffect(() => {
    if (cluster !== localHubName && container !== '') {
      const abortController = new AbortController()
      const logsResult = fetchRetry({
        method: 'GET',
        url:
          getBackendUrl() +
          `/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${cluster}/clusterstatuses/${cluster}/log/${currentNamespace}/${selectedPod}/${container}?tailLines=1000`,
        signal: abortController.signal,
        retries: process.env.NODE_ENV === 'production' ? 2 : 0,
        headers: { Accept: '*/*' },
      })
      logsResult
        .then((result) => {
          setLogs(result.data as string)
        })
        .catch((err) => {
          setLogsError(err.message)
        })
    } else if (cluster === localHubName && container !== '') {
      const abortController = new AbortController()
      const logsResult = fetchRetry({
        method: 'GET',
        url:
          getBackendUrl() +
          `/api/v1/namespaces/${currentNamespace}/pods/${selectedPod}/log?container=${container}&tailLines=1000`,
        signal: abortController.signal,
        retries: process.env.NODE_ENV === 'production' ? 2 : 0,
        headers: { Accept: '*/*' },
      })
      logsResult
        .then((result) => {
          setLogs(result.data as string)
        })
        .catch((err) => {
          setLogsError(err.message)
        })
    }
  }, [cluster, container, currentNamespace, selectedPod, localHubName])

  if (resourceError !== '') {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying resource logs:')} ${selectedPod}`}
          subtitle={resourceError}
        />
      </PageSection>
    )
  } else if (resourceError === '' && !logsError && logs === '') {
    return (
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )
  }
  if (logsError) {
    return (
      <PageSection>
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying resource logs:')} ${selectedPod}`}
          subtitle={logsError}
        />
      </PageSection>
    )
  }

  return (
    <div>
      {props.renderResourceURLLink(
        {
          data: {
            action: 'open_link',
            targetLink: currentPodURL,
            name: selectedPod,
            namespace: currentNamespace,
            kind: 'pod',
          },
        },
        t,
        true
      )}
      <span className="pod-dropdown label sectionLabel">{t('Select pod')}</span>
      <AcmSelect
        id={'container-select'}
        label={''}
        className="custom-select-class"
        value={selectedPod}
        isRequired={true}
        onChange={(value) => {
          setSelectedPod(value as string)
          const selectedPodData =
            pods.find((item: any) => {
              return item.name === value
            }) || {}
          const selectedPodContainers = selectedPodData.container
            ? selectedPodData.container.split(';').map((item: string) => {
                return item.trim()
              })
            : []
          setCurrentContainers(selectedPodContainers)
          const selectedPodInitialContainer = selectedPodContainers.length > 0 ? selectedPodContainers[0] : ''
          setContainer(selectedPodInitialContainer)
          setCurrentNamespace(selectedPodData.namespace)
          setCluster(selectedPodData.cluster)
          setCurrentPodURL(
            createResourceURL(
              {
                cluster: selectedPodData.cluster,
                type: 'pod',
                namespace: selectedPodData.namespace,
                name: value,
                specs: {
                  raw: {
                    apiVersion: selectedPodData.apiversion,
                  },
                },
              },
              t,
              true
            )
          )
        }}
      >
        {pods.map((pod: any) => {
          return (
            <SelectOption key={pod.name} value={pod.name}>
              {pod.name}
            </SelectOption>
          )
        })}
      </AcmSelect>
      <span className="container-dropdown label sectionLabel">{t('Select container')}</span>
      <AcmLogWindow
        id={'pod-logs-viewer'}
        cluster={cluster}
        namespace={currentNamespace}
        initialContainer={container}
        onSwitchContainer={(newContainer: string | undefined) => {
          setContainer(newContainer || container)
        }}
        containers={currentContainers}
        logs={logs || ''}
      />
    </div>
  )
}
