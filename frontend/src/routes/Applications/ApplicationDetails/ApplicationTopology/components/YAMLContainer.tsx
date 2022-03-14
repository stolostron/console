/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import { useEffect, useState } from 'react'
import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { SyncEditor } from '../../../../../components/SyncEditor/SyncEditor'
import { AcmAlert, AcmLoadingPage } from '@stolostron/ui-components'
import { getResource } from '../../../../../resources'

export interface IYAMLContainerProps {
    node: any[]
    t: TFunction
}

export function YAMLContainer(props: IYAMLContainerProps) {
    let name = _.get(props.node, 'name', '')
    const cluster = _.get(props.node, 'specs.clustersNames', [''])[0]
    const namespace = _.get(props.node, 'namespace', '')
    const type = _.get(props.node, 'type', '')
    const kind = type === 'placements' ? 'placementrule' : type
    let apiVersion = _.get(props.node, 'specs.raw.apiVersion', '') // only works for app definition, for resource we need data from search
    const isDesign = _.get(props.node, 'specs.isDesign', false)
    const editorTitle = `${kind[0].toUpperCase() + kind.substring(1)} YAML`
    const [resource, setResource] = useState<any>(undefined)
    const [resourceError, setResourceError] = useState({ message: '', stack: '' })
    const t = props.t

    if (type === 'replicaset') {
        const replicasetModel = _.get(props.node, `specs.${kind}Model`)
        if (replicasetModel && Object.keys(replicasetModel).length > 0) {
            const modelArray = replicasetModel[Object.keys(replicasetModel)[0]]
            name = _.get(modelArray[0], 'name')
            apiVersion = _.get(modelArray[0], 'apigroup') + '/' + _.get(modelArray[0], 'apiversion')
        }
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
        if (cluster === 'local-cluster' || isDesign) {
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
                    console.error('Error getting ersource: ', err)
                    setResourceError(err.message)
                })
            return () => {
                isComponentMounted = false
            }
        } else {
            fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
                .then((viewResponse) => {
                    if (viewResponse.message) {
                        setResourceError(viewResponse.message)
                    } else {
                        if (isComponentMounted) {
                            setResource(viewResponse.result)
                            setResourceError({ message: '', stack: '' })
                        }
                    }
                })
                .catch((err) => {
                    console.error('Error getting ersource: ', err)
                    setResourceError(err)
                })
            return () => {
                isComponentMounted = false
            }
        }
    }, [cluster, kind, apiVersion, name, namespace, isDesign])

    if (!resource && resourceError.message === '') {
        return <AcmLoadingPage />
    }

    // need to set height for div below or else SyncEditor height will increaase indefinitely
    return (
        <div style={{ height: '100vh' }}>
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
                onClose={(): void => {}}
                readonly={true}
                onEditorChange={(): void => {}}
                hideCloseButton={true}
            />
        </div>
    )
}
