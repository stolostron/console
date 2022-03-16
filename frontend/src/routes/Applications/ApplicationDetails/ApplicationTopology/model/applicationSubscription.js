/* Copyright Contributors to the Open Cluster Management project */

import { cloneDeep, get, includes, isEmpty } from 'lodash'
import { listResources } from '../../../../../resources/utils/resource-request'

export const ALL_SUBSCRIPTIONS = '__ALL__/SUBSCRIPTIONS__'
const NAMESPACE = 'metadata.namespace'

export const getSubscriptionApplication = async (model, app, selectedChannel, recoilStates) => {
    // get subscriptions to channels (pipelines)
    let subscriptionNames = get(app, 'metadata.annotations["apps.open-cluster-management.io/subscriptions"]')
    if (subscriptionNames && subscriptionNames.length > 0) {
        // filter local hub subscription
        const filteredSubscriptions = subscriptionNames.split(',').filter((subscriptionName) => {
            return !includes(subscriptionName, '-local')
        })
        const subscriptions = cloneDeep(getResources(filteredSubscriptions, recoilStates.subscriptions))

        // what subscriptions does user want to see
        model.channels = []
        model.subscriptions = []
        model.allSubscriptions = subscriptions
        model.allChannels = []
        model.allClusters = []
        model.reports = []

        // get all the channels and find selected subscription from selected channel
        let selectedSubscriptions = getAllChannels(subscriptions, model.channels, selectedChannel)

        // pick subscription based on channel requested by ui or 1st by default
        model.activeChannel = selectedChannel ? selectedChannel : getChannelName(selectedSubscriptions[0])
        // get all requested subscriptions
        selectedSubscriptions = selectedChannel === ALL_SUBSCRIPTIONS ? subscriptions : selectedSubscriptions

        // get reports, hooks and rules
        const { channelsMap, rulesMap, preHooksMap, postHooksMap } = buildSubscriptionMaps(
            selectedSubscriptions,
            model.subscriptions
        )
        selectedSubscriptions.forEach((subscription) => {
            const report =
                recoilStates.subscriptionReports &&
                recoilStates.subscriptionReports.find((report) => {
                    return (
                        get(report, 'metadata.namespace') === get(subscription, 'metadata.namespace') &&
                        get(report, 'metadata.name') === get(subscription, 'metadata.name')
                    )
                })
            if (report) {
                subscription.report = report
                model.reports.push(subscription.report)
            }
        })

        await getAppHooks(preHooksMap, true)
        await getAppHooks(postHooksMap, false)
        getAppRules(rulesMap, model.allClusters, recoilStates.placementRules)

        // get all channels
        getAllAppChannels(model.allChannels, subscriptions, recoilStates.channels)

        getAppChannels(channelsMap, model.allChannels)
    }
    return model
}

const getResources = (names, resources) => {
    const set = new Set(names)
    return resources.filter((resource) => {
        return set.has(`${get(resource, 'metadata.namespace')}/${get(resource, 'metadata.name')}`)
    })
}

const getAllChannels = (subscriptions, channels, selectedChannel) => {
    let selectedSubscriptions = subscriptions.length > 0 ? [subscriptions[0]] : []
    subscriptions.forEach((subscription) => {
        if (get(subscription, 'spec.channel')) {
            const subscriptionChannel = getChannelName(subscription)
            channels.push(subscriptionChannel)
            if (selectedChannel === subscriptionChannel) {
                selectedSubscriptions = [subscription]
            }
        }
    })
    // renders all subscriptions when selected all subscriptions
    if (selectedChannel === '__ALL__/__ALL__//__ALL__/__ALL__') {
        selectedSubscriptions = subscriptions
    }
    return selectedSubscriptions
}

const getChannelName = (subscription) => {
    const {
        metadata: { name: nm, namespace: ns },
        deployablePaths: paths,
        isChucked,
    } = subscription
    const chn = get(subscription, 'spec.channel')
    return `${ns}/${nm}//${chn}${getSubChannelName(paths, isChucked)}`
}

// if channel has sub channels, get subchannel name
export const getSubChannelName = (paths, isChucked) => {
    if (isChucked) {
        const getName = (rname) => {
            let [, name] = rname.split('/')
            name = name.replace(/.[\d.]+$/, '')
            return name
        }

        // get first and last path
        const len = paths.length - 1
        let begName = getName(paths[0])
        let endName = getName(paths[len])

        // find longest common string between paths
        const common = longestCommonSubstring(begName, endName)

        // replace common string in both paths
        begName = begName.replace(common, '')
        endName = endName.replace(common, '')
        return `///${begName}///${endName}`
    }
    return ''
}

const buildSubscriptionMaps = (subscriptions, modelSubscriptions) => {
    const rulesMap = {}
    const channelsMap = {}
    const postHooksMap = {}
    const preHooksMap = {}
    let arr = null

    subscriptions.forEach((subscription) => {
        modelSubscriptions.push(subscription)

        // get post hooks
        const postHooks = get(subscription, 'status.ansiblejobs.posthookjobshistory', [])
        postHooks.forEach((value) => {
            const [deployableNamespace, deployableName] = value.split('/')
            if (deployableNamespace && deployableName) {
                arr = postHooksMap[deployableNamespace]
                if (!arr) {
                    postHooksMap[deployableNamespace] = []
                    arr = postHooksMap[deployableNamespace]
                }
                arr.push({ deployableName, subscription })
            }
        })
        if (postHooks) {
            subscription.posthooks = []
        }

        // get pre hooks
        const preHooks = get(subscription, 'status.ansiblejobs.prehookjobshistory', [])
        preHooks.forEach((value) => {
            const [deployableNamespace, deployableName] = value.split('/')
            if (deployableNamespace && deployableName) {
                arr = preHooksMap[deployableNamespace]
                if (!arr) {
                    preHooksMap[deployableNamespace] = []
                    arr = preHooksMap[deployableNamespace]
                }
                arr.push({ deployableName, subscription })
            }
        })
        if (preHooks) {
            subscription.prehooks = []
        }

        // ditto for channels
        const [chnNamespace, chnName] = get(subscription, 'spec.channel', '').split('/')
        if (chnNamespace && chnName) {
            arr = channelsMap[chnNamespace]
            if (!arr) {
                channelsMap[chnNamespace] = []
                arr = channelsMap[chnNamespace]
            }
            arr.push({ chnName, subscription })
            subscription.channels = []
        }

        // ditto for rules
        const ruleNamespace = get(subscription, NAMESPACE)
        get(subscription, 'spec.placement.placementRef.name', '')
            .split(',')
            .forEach((ruleName) => {
                if (ruleName) {
                    arr = rulesMap[ruleNamespace]
                    if (!arr) {
                        rulesMap[ruleNamespace] = []
                        arr = rulesMap[ruleNamespace]
                    }
                    arr.push({ ruleName, subscription })
                    subscription.rules = []
                }
            })
    })
    return {
        channelsMap,
        rulesMap,
        preHooksMap,
        postHooksMap,
    }
}

const getAppRules = (rulesMap, allClusters, placementRules) => {
    Object.entries(rulesMap).forEach(([namespace, values]) => {
        // stuff rules into subscriptions that use them
        placementRules
            .filter((rule) => {
                return get(rule, 'metadata.namespace') === namespace
            })
            .forEach((rule) => {
                const name = get(rule, 'metadata.name')
                values.forEach(({ ruleName, subscription }) => {
                    if (name === ruleName) {
                        subscription.rules.push(rule)
                        const clusters = get(rule, 'status.decisions', [])
                        clusters.forEach((cluster) => {
                            // get cluster name
                            const clusterName = get(cluster, 'clusterName')
                            if (clusterName && allClusters.indexOf(clusterName) === -1) {
                                allClusters.push(clusterName)
                            }
                        })
                    }
                })
            })
    })
}

// get all channels for all subscriptions
// this is used to build the subscription cards information
const getAllAppChannels = (appAllChannels, allSubscriptions, channels) => {
    // get all channels information
    const channelsMap = {}
    allSubscriptions.forEach((subscription) => {
        const chnlData = get(subscription, 'spec.channel', '').split('/')
        if (chnlData.length === 2) {
            // eslint-disable-next-line prefer-destructuring
            channelsMap[chnlData[0]] = chnlData[1]
        }
    })
    Object.entries(channelsMap).forEach(([channelNS, channelName]) => {
        channels
            .filter((channel) => {
                return get(channel, 'metadata.namespace') === channelNS && get(channel, 'metadata.name') === channelName
            })
            .forEach((channel) => {
                appAllChannels.push(channel)
            })
    })
}

const getAppHooks = async (hooks, isPreHooks) => {
    if (!isEmpty(hooks)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const requests = Object.entries(hooks).map(async ([namespace, values]) => {
            let response
            try {
                response = await listResources({
                    apiVersion: 'tower.ansible.com/v1alpha1',
                    kind: 'AnsibleJob',
                }).promise
            } catch (err) {
                console.error('Error listing resource:', err)
            }

            if (response) {
                response.forEach((deployable) => {
                    const name = get(deployable, 'metadata.name')
                    values.forEach(({ deployableName, subscription }) => {
                        if (name === deployableName) {
                            if (isPreHooks) {
                                if (!subscription.prehooks) {
                                    subscription.prehooks = []
                                }
                                subscription.prehooks.push(deployable)
                            } else {
                                if (!subscription.posthooks) {
                                    subscription.posthooks = []
                                }
                                subscription.posthooks.push(deployable)
                            }
                        }
                    })
                })
            }
        })
        return Promise.all(requests)
    }
}

const longestCommonSubstring = (str1, str2) => {
    let sequence = ''
    const str1Length = str1.length
    const str2Length = str2.length
    const num = new Array(str1Length)
    let maxlen = 0
    let lastSubsBegin = 0
    let i = 0
    let j = 0

    // create matrix
    while (i < str1Length) {
        const subArray = new Array(str2Length)
        j = 0
        while (j < str2Length) {
            subArray[j] = 0
            j += 1
        }
        num[i] = subArray
        i += 1
    }

    // search matrix
    let thisSubsBegin = null
    i = 0
    while (i < str1Length) {
        j = 0
        while (j < str2Length) {
            if (str1[i] !== str2[j]) {
                num[i][j] = 0
            } else {
                if (i === 0 || j === 0) {
                    num[i][j] = 1
                } else {
                    num[i][j] = 1 + num[i - 1][j - 1]
                }
                if (num[i][j] > maxlen) {
                    maxlen = num[i][j]
                    thisSubsBegin = i - num[i][j] + 1
                    if (lastSubsBegin === thisSubsBegin) {
                        sequence += str1[i]
                    } else {
                        lastSubsBegin = thisSubsBegin
                        sequence = str1.substr(lastSubsBegin, i + 1 - lastSubsBegin)
                    }
                }
            }
            j += 1
        }
        i += 1
    }
    return sequence
}

// async getPlacement(resource, apiVersion, namespace) {
//   let placement = '';
//   const argoName = get(resource, 'metadata.ownerReferences[0].name', '');
//   if (argoName) {
//     const applicationset = await this.kubeConnector.getResources(
//       (ns) => `/apis/${apiVersion}/namespaces/${ns}/applicationsets/${argoName}`,
//       { namespaces: [namespace] },
//     );
//     const placementName = get(applicationset[0], 'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]', '');
//     placement = placementName ? await this.kubeConnector.getResources(
//       (ns) => `/apis/cluster.open-cluster-management.io/v1alpha1/namespaces/${ns}/placements/${placementName}`,
//       { namespaces: [namespace] },
//     ) : [];
//   }
//   return placement;
// }

// async getApplications() {
//   const apps = _.flatten(await Promise.all([
//     this.kubeConnector.getResources((ns) => `/apis/app.k8s.io/v1beta1/namespaces/${ns}/applications`),
//     this.kubeConnector.getResources((ns) => `/apis/argoproj.io/v1alpha1/namespaces/${ns}/applications`),
//   ]).catch((err) => {
//     logger.error(err);
//     throw err;
//   }));
//   return _.sortBy(apps.map((app) => ({
//     metadata: app.metadata,
//     raw: app,
//   })), ['metadata.name', 'metadata.namespace']);
// }

// async getApplicationSetRelatedResources(name, namespace) {
//   const argoServerNS = await this.getArgoServerNs();
//   const namespaces = [];

//   argoServerNS.argoServerNS.forEach((ns) => {
//     namespaces.push(ns.name);
//   });
//   const appSets = await this.kubeConnector.getResources(
//     (ns) => `/apis/argoproj.io/v1alpha1/namespaces/${ns}/applicationsets`,
//     { namespaces },
//   ).catch((err) => {
//     logger.error(err);
//     throw err;
//   });

//   const placementMap = {};
//   let appSetBeingDeleted;
//   let placement;

//   appSets.forEach((appSet) => {
//     const appSetName = _.get(appSet, 'metadata.name', '');
//     const appSetNamespace = _.get(appSet, 'metadata.namespace', '');
//     const appSetGenerators = _.get(appSet, 'spec.generators', []);
//     const appSetPlacement = appSetGenerators
//       ? _.get(appSetGenerators[0], 'clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]', '')
//       : '';
//     if (name === appSetName && namespace === appSetNamespace) {
//       appSetBeingDeleted = appSet;
//       placement = appSetPlacement;
//     } else {
//       const placementEntry = placementMap[appSetPlacement];
//       if (placementEntry) {
//         placementEntry.push(appSetName);
//       } else if (appSetPlacement) {
//         placementMap[appSetPlacement] = [appSetName];
//       }
//     }
//   });

//   return {
//     appSetBeingDeleted: {
//       name: appSetBeingDeleted.metadata.name,
//       namespace: appSetBeingDeleted.metadata.namespace,
//     },
//     appSetPlacement: placement,
//     appSetsSharingPlacement: placementMap[placement] || [],
//   };
// }

function getAppChannels(channelsMap, allChannels) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Object.entries(channelsMap).forEach(([_namespace, values]) => {
        allChannels.forEach((channel) => {
            const name = get(channel, 'metadata.name')
            values.forEach(({ chnName, subscription }) => {
                if (name === chnName) {
                    subscription.channels.push(channel)
                }
            })
        })
    })
}

// async getPlacementRules(resources) {
//   const requests = resources.map(async (resource) => {
//     // if this one has a placement rule reference get that
//     const name = _.get(resource, 'spec.placement.placementRef.name');
//     if (name) {
//       const namespace = _.get(resource, NAMESPACE);
//       let response;
//       try {
//         response = await this.kubeConnector.getResources(
//           (ns) => `/apis/apps.open-cluster-management.io/v1/namespaces/${ns}/placementrules`,
//           { kind: 'PlacementRule', namespaces: [namespace] },
//         );
//       } catch (err) {
//         logger.error(err);
//         throw err;
//       }
//       if (Array.isArray(response)) {
//         const [rules] = filterByName([name], response);
//         return _.merge(resource, { rules });
//       }
//     }
//     return resource;
//   });
//   return Promise.all(requests);
// }

// async getApplicationNamespace() {
//   const namespaces = await this.kubeConnector.getNamespaceResources({ });
//   return _.filter(namespaces, (ns) => !_.get(ns, 'metadata.name', '').startsWith('openshift') && !_.get(ns, 'metadata.name', '').startsWith('open-cluster-management'));
// }

// async getManagedCluster(clusterName) {
//   const managedCluster = await this.kubeConnector.get(
//     `/apis/cluster.open-cluster-management.io/v1/managedclusters/${clusterName}`,
//   ).catch((err) => {
//     logger.error(err);
//     throw err;
//   });
//   let successImportStatus = false;
//   const managedClusterCondition = _.get(managedCluster, 'status.conditions', {});
//   if (!_.isEmpty(managedClusterCondition)) {
//     // check cluster import condition
//     const managedClusterAvailable = _.find(managedClusterCondition, (condition) => condition.type === 'ManagedClusterConditionAvailable');
//     if (managedClusterAvailable && _.has(managedClusterAvailable, 'status')) {
//       successImportStatus = _.get(managedClusterAvailable, 'status') === 'True' ? true : successImportStatus;
//     }
//   }
//   return successImportStatus;
// }

// async getArgoServerNs() {
//   const gitopsclusters = await this.kubeConnector.getResources((ns) => `/apis/apps.open-cluster-management.io/v1beta1/namespaces/${ns}/gitopsclusters`).catch((err) => {
//     logger.error(err);
//     throw err;
//   });
//   const argoNamespace = _.map(gitopsclusters, 'spec.argoServer.argoNamespace');
//   const argosNS = Object.assign(...argoNamespace.map((k) => ({ name: k })));
//   return { argoServerNS: [argosNS] };
// }

// async getSecrets(labelObject) {
//   const { label, value } = labelObject;
//   const secrets = await this.kubeConnector.get(`/api/v1/secrets/?labelSelector=${encodeURIComponent(label)}`).catch((err) => {
//     logger.error(err);
//     throw err;
//   });

//   const ansibleSecrets = _.filter(_.get(secrets, 'items', []), (secret) => _.get(secret, 'metadata.labels', {})[label] === value);
//   return ansibleSecrets.map((secret) => ({
//     ansibleSecretName: _.get(secret, 'metadata.name', 'unknown'),
//     ansibleSecretNamespace: _.get(secret, 'metadata.namespace', 'unknown'),
//   }));
// }

// async createAnsibleSecrets(application) {
//   // get all subscriptions using an ansible provider
//   const nsPath = 'metadata.namespace';
//   const namePath = 'metadata.name';
//   const subsUsingAnsible = _.filter(application, (resource) => _.get(resource, 'kind', '') === 'Subscription'
//         && _.get(resource, 'spec.hooksecretref.name'));
//   const ansibleSecretNames = _.uniqBy(_.map(subsUsingAnsible, 'spec.hooksecretref.name'));
//   const applicationResource = _.find(application, (res) => _.get(res, 'kind', '') === 'Application');
//   const namespace = _.get(applicationResource, nsPath, '');
//   const ansibleSelector = {
//     label: 'cluster.open-cluster-management.io/type',
//     value: 'ans',
//   };
//   if (!ansibleSecretNames || ansibleSecretNames.length === 0) {
//     // no secrets to create
//     return;
//   }
//   ansibleSecretNames.forEach(async (name) => {
//     // check if a secret with this name already exists in the app ns
//     try {
//       const secrets = await this.kubeConnector.get(`/api/v1/secrets/?labelSelector=${encodeURIComponent(ansibleSelector.label)}`).catch((err) => {
//         logger.error(err);
//         throw err;
//       });
//       const secretInAppNS = _.find(_.get(secrets, 'items', []), (obj) => _.get(obj, namePath, '') === name && _.get(obj, nsPath, '') === namespace);
//       if (!secretInAppNS || secretInAppNS.length === 0) {
//         const ansibleSecrets = _.filter(_.get(secrets, 'items', []), (secret) => _.get(secret, namePath, '') === name && _.get(secret, 'metadata.labels', {})[ansibleSelector.label] === ansibleSelector.value);
//         if (ansibleSecrets.length > 0) {
//           // now create the secret crd in the app ns
//           try {
//             const apiVersion = _.get(ansibleSecrets[0], 'apiVersion', 'v1');
//             const kind = 'Secret';
//             const resource = {
//               apiVersion,
//               kind,
//               metadata: {
//                 name,
//                 namespace,
//                 labels: {
//                   'cluster.open-cluster-management.io/copiedFromNamespace': _.get(ansibleSecrets[0], 'metadata.namespace', ''),
//                   'cluster.open-cluster-management.io/copiedFromSecretName': _.get(ansibleSecrets[0], 'metadata.name', ''),
//                 },
//               },
//               data: _.pick(_.get(ansibleSecrets[0], 'data', {}), ['host', 'token']),
//             };
//             const requestPath = await this.getResourceEndPoint(resource);
//             await this.kubeConnector.post(requestPath, resource);
//           } catch (err) {
//             logger.error(err);
//           }
//         }
//       }
//     } catch (err) {
//       logger.error(err);
//     }
//   });
// }

// async getLocalArgoRoute(args) {
//   const routes = await this.kubeConnector.getResources((ns) => `/apis/${args.apiVersion}/namespaces/${ns}/routes`, { namespaces: [args.namespace], kind: args.kind }).catch((err) => {
//     logger.error(err);
//     throw err;
//   });

//   if (routes && routes.length) {
//     // route exists
//     const routeObjs = routes
//       .filter((route) => _.get(route, 'metadata.labels["app.kubernetes.io/part-of"]', '') === 'argocd'
//         && !_.get(route, 'metadata.name', '').toLowerCase().includes('grafana')
//         && !_.get(route, 'metadata.name', '').toLowerCase().includes('prometheus'));
//     if (routeObjs.length > 0) {
//       // if still more than 1, choose one with “server” in the name if possible
//       const serverRoute = routeObjs.find((route) => _.get(route, 'metadata.name', '').toLowerCase().includes('server'));
//       if (serverRoute) {
//         return serverRoute;
//       }
//       return routeObjs[0];
//     }
//     return undefined;
//   }
//   // route doesn't exist
//   return undefined;
// }

// // returns the url for the ARGO CD editor
// async getArgoAppRouteURL(variables) {
//   const args = {
//     ...variables,
//     kind: 'route',
//   };
//   let route;
//   if (variables.cluster === 'local-cluster') {
//     route = await this.getLocalArgoRoute(args);
//   } else {
//     route = await this.getResource(args);
//   }

//   if (!route) {
//     return '';
//   }
//   const hostName = _.get(route, 'spec.host', 'unknown');
//   const transport = _.get(route, 'spec.tls') ? 'https' : 'http';
//   return `${transport}://${hostName}/applications`;
// }

// // returns the url for Route resource
// async getRouteResourceURL(variables) {
//   const args = {
//     ...variables,
//     kind: 'route',
//   };
//   const route = await this.getResource(args);
//   if (!route) {
//     return '';
//   }
//   const hostName = _.get(route, 'spec.host', 'unknown');
//   const transport = _.get(route, 'spec.tls') ? 'https' : 'http';
//   return `${transport}://${hostName}`;
// }
