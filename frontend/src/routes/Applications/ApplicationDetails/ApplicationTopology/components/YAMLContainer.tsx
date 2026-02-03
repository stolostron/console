/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useEffect, useState } from 'react'
import { TFunction } from 'react-i18next'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { getResource } from '../../../../../resources/utils'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { AcmAlert, AcmLoadingPage } from '../../../../../ui-components'

const typesWithoutDefaultName = ['replicaset', 'pod', 'replicationcontroller', 'controllerrevision']

export interface IYAMLContainerProps {
  node: any
  containerRef?: HTMLDivElement
  t: TFunction
  hubClusterName: string
}

export function YAMLContainer(props: IYAMLContainerProps) {
  let name = props.node?.name ?? ''
  let cluster = props.node?.cluster ?? props.node?.specs?.clustersNames?.[0] ?? ''
  const remoteArgoCluster = props.node?.specs?.raw?.status?.cluster
  if (remoteArgoCluster) {
    cluster = remoteArgoCluster
  }
  const namespace = props.node?.namespace ?? ''
  const type = props.node?.type ?? ''
  const kind = type === 'placements' || type === 'placement' ? 'placementdecision' : type
  let apiVersion = props.node?.specs?.raw?.apiVersion ?? '' // only works for app definition, for resource we need data from search
  const isDesign = props.node?.specs?.isDesign ?? false
  const editorTitle = `${kind[0].toUpperCase() + kind.substring(1)} YAML`
  const [resource, setResource] = useState<any>(undefined)
  const [resourceError, setResourceError] = useState({ message: '', stack: '' })
  const t = props.t
  const hubClusterName = props.hubClusterName

  if (type === 'project') {
    apiVersion = 'project.openshift.io/v1'
  }
  if (typesWithoutDefaultName.includes(type)) {
    const typeModel = props.node?.specs?.[`${kind}Model`]
    if (typeModel && Object.keys(typeModel).length > 0) {
      const modelArray = typeModel[Object.keys(typeModel)[0]]
      name = modelArray[0]?.name
      cluster = modelArray[0]?.cluster
    }
  }

  if (!cluster) {
    // default to hub cluster name if we still don't have a cluster for resources like AnsibleJobs
    cluster = hubClusterName
  }

  if (!apiVersion) {
    const resourceModel = props.node?.specs?.[`${kind}Model`]
    if (resourceModel && Object.keys(resourceModel).length > 0) {
      const modelArray = resourceModel[Object.keys(resourceModel)[0]]
      const apigroup = modelArray[0]?.apigroup
      const apiver = modelArray[0]?.apiversion
      apiVersion = apigroup ? apigroup + '/' + apiver : apiver
    }
  }

  useEffect(() => {
    let isComponentMounted = true
    if ((cluster === hubClusterName || isDesign) && !remoteArgoCluster) {
      const resourceResult = getResource({
        apiVersion,
        kind,
        metadata: { namespace, name },
      }).promise
      resourceResult
        .then((response) => {
          if (isComponentMounted) {
            setResource(response)
            setResourceError({ message: '', stack: '' })
          }
        })
        .catch((err) => {
          console.error('Error getting resource: ', err)
          setResourceError(err.message)
        })
      return () => {
        isComponentMounted = false
      }
    } else {
      fleetResourceRequest('GET', cluster, {
        apiVersion,
        kind,
        name,
        namespace,
      })
        .then((res: any) => {
          if ('errorMessage' in res) {
            setResourceError(res.errorMessage)
          } else {
            if (isComponentMounted) {
              setResource(res)
              setResourceError({ message: '', stack: '' })
            }
          }
        })
        .catch((err) => {
          console.error('Error getting resource: ', err)
          setResourceError(err)
        })
      return () => {
        isComponentMounted = false
      }
    }
  }, [cluster, kind, apiVersion, name, namespace, isDesign, remoteArgoCluster, hubClusterName])

  if (!resource && resourceError.message === '') {
    return <AcmLoadingPage />
  }

  // need to set height for div below or else SyncEditor height will increaase indefinitely
  return (
    <Fragment>
      {resourceError.message !== '' && (
        <AcmAlert
          noClose={true}
          variant={'danger'}
          isInline={true}
          title={`${t('Error querying for resource:')} ${name}`}
          subtitle={resourceError.message}
        />
      )}
      <SyncEditor
        variant="toolbar"
        id="code-content"
        editorTitle={editorTitle}
        resources={[resource]}
        filters={['*.metadata.managedFields']}
        readonly={true}
      />
    </Fragment>
  )
}
