/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from "react-i18next";
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { fireManagedClusterView } from "../../../../../resources/managedclusterview"
import { SyncEditor } from "../../../../../components/SyncEditor/SyncEditor";
import { AcmAlert, AcmLoadingPage } from "@stolostron/ui-components";
import { CodeEditor, Language } from "@patternfly/react-code-editor";

export interface IYAMLContainerProps {
    node: any[]
    t: TFunction
}

export function YAMLContainer(props: IYAMLContainerProps) {
    const name = _.get(props.node, 'name', '')
    const cluster = _.get(props.node, 'cluster', '') || _.get(props.node, 'specs.clustersNames', [])[0]
    const namespace = _.get(props.node, 'namespace', '')
    const kind = _.get(props.node, 'type', '')
    const apiVersion = _.get(props.node, 'specs.raw.apiVersion', '') // only works for app definition, for resource we need data from search
    const editorTitle = `${kind[0].toUpperCase() + kind.substring(1)} YAML`
    //const [resource, setResource] = useState(undefined)
    const [resourceError, setResourceError] = useState({message: '', stack: ''})
    const t = props.t

    const result = {
        apiVersion:"apps.open-cluster-management.io/v1",
        "kind":"Subscription",
        "metadata":{
           "annotations":{
              "apps.open-cluster-management.io/cluster-admin":"true",
              "apps.open-cluster-management.io/git-current-commit":"29cdefe210be5cbc2b4346d11ee7ca3f668c7596",
              "apps.open-cluster-management.io/github-branch":"main",
              "apps.open-cluster-management.io/github-path":"helloworld",
              "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"apps.open-cluster-management.io/v1\",\"kind\":\"Subscription\",\"metadata\":{\"annotations\":{\"apps.open-cluster-management.io/github-branch\":\"main\",\"apps.open-cluster-management.io/github-path\":\"helloworld\"},\"labels\":{\"app\":\"feng-helloworld\"},\"name\":\"feng-helloworld-subscription\",\"namespace\":\"feng\"},\"spec\":{\"channel\":\"helloworld-ch/helloworld-channel\",\"placement\":{\"placementRef\":{\"group\":\"apps.open-cluster-management.io\",\"kind\":\"PlacementRule\",\"name\":\"feng-helloworld-placement\"}}}}\n",
              "open-cluster-management.io/user-group":"c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk",
              "open-cluster-management.io/user-identity":"a3ViZTphZG1pbg=="
           },
           "creationTimestamp":"2022-02-07T19:12:56Z",
           "generation":2,
           "labels":{
              "app":"feng-helloworld",
              "app.kubernetes.io/part-of":"feng-helloworld"
           },
           "managedFields":[
              {
                 "apiVersion":"apps.open-cluster-management.io/v1",
                 "fieldsType":"FieldsV1",
                 "fieldsV1":{
                    "f:metadata":{
                       "f:annotations":{
                          ".":{
                             
                          },
                          "f:apps.open-cluster-management.io/github-branch":{
                             
                          },
                          "f:apps.open-cluster-management.io/github-path":{
                             
                          },
                          "f:kubectl.kubernetes.io/last-applied-configuration":{
                             
                          }
                       },
                       "f:labels":{
                          ".":{
                             
                          },
                          "f:app":{
                             
                          }
                       }
                    },
                    "f:spec":{
                       ".":{
                          
                       },
                       "f:channel":{
                          
                       },
                       "f:placement":{
                          ".":{
                             
                          },
                          "f:placementRef":{
                             ".":{
                                
                             },
                             "f:kind":{
                                
                             },
                             "f:name":{
                                
                             }
                          }
                       }
                    }
                 },
                 "manager":"kubectl-client-side-apply",
                 "operation":"Update",
                 "time":"2022-02-07T19:12:56Z"
              },
              {
                 "apiVersion":"apps.open-cluster-management.io/v1",
                 "fieldsType":"FieldsV1",
                 "fieldsV1":{
                    "f:metadata":{
                       "f:annotations":{
                          "f:apps.open-cluster-management.io/cluster-admin":{
                             
                          },
                          "f:apps.open-cluster-management.io/git-current-commit":{
                             
                          }
                       }
                    },
                    "f:status":{
                       ".":{
                          
                       },
                       "f:lastUpdateTime":{
                          
                       },
                       "f:phase":{
                          
                       }
                    }
                 },
                 "manager":"subscription-hub-reconciler",
                 "operation":"Update",
                 "time":"2022-02-15T03:26:50Z"
              }
           ],
           "name":"feng-helloworld-subscription",
           "namespace":"feng",
           "resourceVersion":"39201352",
           "uid":"16809557-349b-4717-b0ca-8a9b529ee0e6"
        },
        "spec":{
           "channel":"helloworld-ch/helloworld-channel",
           "placement":{
              "placementRef":{
                 "kind":"PlacementRule",
                 "name":"feng-helloworld-placement"
              }
           },
           "secondaryChannel":""
        },
        "status":{
           "lastUpdateTime":"2022-02-07T19:12:57Z",
           "phase":"Propagated"
        }
     }
 
    // useEffect(() => {
    //     fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
    //         .then((viewResponse) => {
    //             if (viewResponse.message) {
    //                 setResourceError(viewResponse.message)
    //             } else {
    //                 setResource(viewResponse.result)
    //             }
    //         })
    //         .catch((err) => {
    //             console.error('Error getting ersource: ', err)
    //             setResourceError(err)
    //         })
    // }, [cluster, kind, apiVersion, name, namespace])

    if (!result && resourceError.message !== '') {
        return (
            <AcmLoadingPage />
        )
    }

    // need to set height for div below or else SyncEditor height will increaase indefinitely
    return (
        <div style={{height: '100vh'}}>
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
                resources={[result]}
                onClose={(): void => {}}
                readonly={true}
                onEditorChange={(): void => {}}
                hideCloseButton={true}
            />
        </div>
    )
}