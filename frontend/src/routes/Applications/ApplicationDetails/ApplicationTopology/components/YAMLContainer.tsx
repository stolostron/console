/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import { Fragment, useEffect, useState } from 'react'
import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { AcmAlert, AcmLoadingPage } from '../../../../../ui-components'
import { getResource } from '../../../../../resources'

const typesWithoutDefaultName = ['replicaset', 'pod', 'replicationcontroller', 'controllerrevision']

export interface IYAMLContainerProps {
  node: any
  containerRef: HTMLDivElement
  t: TFunction
}

export function YAMLContainer(props: IYAMLContainerProps) {
  let name = _.get(props.node, 'name', '')
  let cluster = _.get(props.node, 'cluster', _.get(props.node, 'specs.clustersNames', [''])[0])
  const remoteArgoCluster = _.get(props.node, 'specs.raw.status.cluster')
  if (remoteArgoCluster) {
    cluster = remoteArgoCluster
  }
  const namespace = _.get(props.node, 'namespace', '')
  const type = _.get(props.node, 'type', '')
  const kind = type === 'placements' ? 'placementdecision' : type
  let apiVersion = _.get(props.node, 'specs.raw.apiVersion', '') // only works for app definition, for resource we need data from search
  const isDesign = _.get(props.node, 'specs.isDesign', false)
  const editorTitle = `${kind[0].toUpperCase() + kind.substring(1)} YAML`
  const [resource, setResource] = useState<any>(undefined)
  const [resourceError, setResourceError] = useState({ message: '', stack: '' })
  const t = props.t

  if (type === 'project') {
    apiVersion = 'project.openshift.io/v1'
  }
  if (typesWithoutDefaultName.includes(type)) {
    const typeModel = _.get(props.node, `specs.${kind}Model`)
    if (typeModel && Object.keys(typeModel).length > 0) {
      const modelArray = typeModel[Object.keys(typeModel)[0]]
      name = _.get(modelArray[0], 'name')
      cluster = _.get(modelArray[0], 'cluster')
    }
  }

  if (!cluster) {
    // default to local-cluster if we still don't have a cluster for resources like AnsibleJobs
    cluster = 'local-cluster'
  }

  if (!apiVersion) {
    const resourceModel = _.get(props.node, `specs.${kind}Model`)
    if (resourceModel && Object.keys(resourceModel).length > 0) {
      const modelArray = resourceModel[Object.keys(resourceModel)[0]]
      const apigroup = _.get(modelArray[0], 'apigroup')
      const apiver = _.get(modelArray[0], 'apiversion')
      apiVersion = apigroup ? apigroup + '/' + apiver : apiver
    }
  }

  useEffect(() => {
    let isComponentMounted = true
    if ((cluster === 'local-cluster' || isDesign) && !remoteArgoCluster) {
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
      fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
        .then((viewResponse) => {
          if (viewResponse.message) {
            setResourceError({ message: viewResponse.message, stack: '' })
          } else {
            if (isComponentMounted) {
              setResource(viewResponse.result)
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
  }, [cluster, kind, apiVersion, name, namespace, isDesign, remoteArgoCluster])

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
