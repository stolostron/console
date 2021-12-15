/* Copyright Contributors to the Open Cluster Management project */

import { get, endsWith, indexOf, trimEnd, chunk } from 'lodash'

export const ALL_SUBSCRIPTIONS = '__ALL__/SUBSCRIPTIONS__'
const EVERYTHING_CHANNEL = '__ALL__/__ALL__//__ALL__/__ALL__'
const NAMESPACE = 'metadata.namespace'

export const evaluateSingleAnd = (operand1, operand2) => operand1 && operand2

export const evaluateDoubleAnd = (operand1, operand2, operand3) => operand1 && operand2 && operand3

export const evaluateSingleOr = (operand1, operand2) => operand1 || operand2

export const evaluateTernaryExpression = (condition, returnVal1, returnVal2) => {
    if (condition) {
        return returnVal1
    }
    return returnVal2
}

export const getApplication = (location, recoilStates, selectedChannel, cluster, apiversion) => {
    //applications, applicationSets, argoApplications, subscriptions, channels, placementRules, managedClusters
    //const [,,,name, namespace] = location

    const name = 'demo-saude-digital'
    const namespace = 'demo-saude-digital'

    let app
    let model
    let placement = []

    // get application
    const { applications, applicationSets, argoApplications } = recoilStates
    app = applications.find((app) => {
        return app?.metadata?.name === name && app?.metadata?.namespace === namespace
    })
    if (!app) {
        app = applicationSets.find((app) => {
            return app?.metadata?.name === name && app?.metadata?.namespace === namespace
        })
    }
    if (!app) {
        app = argoApplications.find((app) => {
            const isChildOfAppset =
                app.metadata.ownerReferences && app.metadata.ownerReferences[0].kind === 'ApplicationSet'
            if (!app.metadata.ownerReferences || !isChildOfAppset) {
                return app?.metadata?.name === name && app?.metadata?.namespace === namespace
            }
        })
    }

    // collect app resources
    if (app) {
        model = {
            name,
            namespace,
            app,
            metadata: app.metadata,
            placement: placement[0],
        }

        if (get(app, 'apiVersion', '').indexOf('argoproj.io') > -1) {
            return model
        }

        // get subscriptions to channels (pipelines)
        let subscriptionNames = get(app, 'metadata.annotations["apps.open-cluster-management.io/subscriptions"]')
        let deployableNames = get(app, 'metadata.annotations["apps.open-cluster-management.io/deployables"]')
        if (subscriptionNames && subscriptionNames.length > 0) {
            subscriptionNames = subscriptionNames.split(',')
            // filter local hub subscription
            const filteredSubscriptions = []
            subscriptionNames.forEach((subscriptionName) => {
                if (
                    !evaluateSingleAnd(
                        endsWith(subscriptionName, '-local'),
                        indexOf(subscriptionNames, trimEnd(subscriptionName, '-local')) !== -1
                    )
                ) {
                    filteredSubscriptions.push(subscriptionName)
                }
            })
            const allSubscriptions = getResources(filteredSubscriptions, recoilStates.subscriptions)

            // get deployables from the subscription annotation
            const { subscriptions, allowAllChannel } = getSubscriptionsDeployables(allSubscriptions)
            // pick subscription based on channel requested by ui
            model.activeChannel = selectedChannel

            // what subscriptions does user want to see
            model.channels = []
            model.subscriptions = []
            model.allSubscriptions = allSubscriptions
            model.allChannels = []
            model.allClusters = []

            // get all the channels and find selected subscription from selected channel
            const subscr = getAllChannels(subscriptions, model.channels, selectedChannel, allowAllChannel)

            // get all requested subscriptions
            const selectedSubscription = evaluateTernaryExpression(
                selectedChannel === ALL_SUBSCRIPTIONS,
                allSubscriptions,
                subscr
            )
            const { deployableMap, channelsMap, rulesMap, preHooksMap, postHooksMap } = buildDeployablesMap(
                evaluateSingleOr(selectedSubscription, subscriptions),
                model.subscriptions
            )
            // now fetch them
            this.getAppDeployables(deployableMap, namespace, selectedSubscription, subscriptions)
            this.getAppHooks(preHooksMap, true)
            this.getAppHooks(postHooksMap, false)
            this.getAppRules(rulesMap, model.allClusters)
            // get all channels
            this.getAllAppChannels(model.allChannels, allSubscriptions)
            if (includeChannels) {
                this.getAppChannels(channelsMap)
            }
        } else if (deployableNames && deployableNames.length > 0) {
            deployableNames = deployableNames.split(',')
            model.deployables = getResources(deployableNames, 'deployables', 'Deployable')
            this.getPlacementRules(model.deployables)
        }
    }
    return model
}

const getResources = (names, resources) => {
    const namespaces = new Set(names.map((name) => name.split('/')[0]))
    return resources.filter((res) => {
        return namespaces.has(res?.metadata?.namespace)
    })
}

// get deployables from the subscription annotation
const getSubscriptionsDeployables = (allSubscriptions) => {
    // if a subscription has lots and lots of deployables, break into smaller subscriptions
    let allowAllChannel = true
    const subscriptions = []
    let allDeployablePaths = 0
    allSubscriptions.forEach((subscription) => {
        const deployablePaths = get(
            subscription,
            'metadata.annotations["apps.open-cluster-management.io/deployables"]',
            ''
        )
            .split(',')
            .sort()
        allDeployablePaths += deployablePaths.length

        if (deployablePaths.length > 20) {
            const chunks = chunk(deployablePaths, 16)
            // if last chunk is just one, append to 2nd to last chunk
            const len = chunks.length - 1
            if (chunks[len].length === 1) {
                chunks[len - 1].push(chunks[len][0])
                chunks.pop()
            }
            chunks.forEach((chuck) => {
                subscriptions.push({ ...subscription, deployablePaths: chuck, isChucked: true })
            })
        } else {
            subscriptions.push({ ...subscription, deployablePaths })
        }
    })
    // hide all subscription option
    if (allDeployablePaths > 100 || allSubscriptions.length <= 1) {
        allowAllChannel = false
    }

    return { subscriptions, allowAllChannel }
}

const getAllChannels = (subscriptions, channels, selectedChannel, allowAllChannel) => {
    let selectedSubscription = null
    subscriptions.forEach((subscription) => {
        if (get(subscription, 'spec.channel')) {
            const subscriptionChannel = getChannelName(subscription)
            channels.push(subscriptionChannel)
            if (selectedChannel === subscriptionChannel) {
                selectedSubscription = [subscription]
            }
        }
    })
    // add an ALL channel?
    if (allowAllChannel) {
        if (channels.length > 1) {
            channels.unshift(EVERYTHING_CHANNEL)
            // set default selectedSubscription when topology first render
            if (!selectedSubscription) {
                selectedSubscription = subscriptions.length > 0 ? [subscriptions[0]] : null
            }
        }
    } else if (!selectedSubscription) {
        selectedSubscription = subscriptions.length > 0 ? [subscriptions[0]] : null
    }
    // renders all subscriptions when selected all subscriptions
    if (allowAllChannel && selectedChannel === '__ALL__/__ALL__//__ALL__/__ALL__') {
        selectedSubscription = subscriptions
    }
    return selectedSubscription
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

// export const filterByName = (names, items) => items.filter((item) => names.find((name) => name === item.metadata.name));

// export const filterByNameNamespace = (names, items) => items.filter(({ metadata }) => names.find((name) => {
//   const path = name.split('/');
//   return metadata && path.length === 2 && path[1] === metadata.name && path[0] === metadata.namespace;
// }));

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

// // get deployables from the subscription annotation
// export const getSubscriptionsDeployables = (allSubscriptions) => {
//   // if a subscription has lots and lots of deployables, break into smaller subscriptions
//   let allowAllChannel = true;
//   const subscriptions = [];
//   let allDeployablePaths = 0;
//   allSubscriptions.forEach((subscription) => {
//     const deployablePaths = get(subscription, DEPLOYABLES, '').split(',').sort();
//     allDeployablePaths += deployablePaths.length;

//     if (deployablePaths.length > 20) {
//       const chunks = chunk(deployablePaths, 16);
//       // if last chunk is just one, append to 2nd to last chunk
//       const len = chunks.length - 1;
//       if (chunks[len].length === 1) {
//         chunks[len - 1].push(chunks[len][0]);
//         chunks.pop();
//       }
//       chunks.forEach((chuck) => {
//         subscriptions.push({ ...subscription, deployablePaths: chuck, isChucked: true });
//       });
//     } else {
//       subscriptions.push({ ...subscription, deployablePaths });
//     }
//   });
//   // hide all subscription option
//   if (allDeployablePaths > 100 || allSubscriptions.length <= 1) {
//     allowAllChannel = false;
//   }

//   return { subscriptions, allowAllChannel };
// };

export const buildDeployablesMap = (subscriptions, modelSubscriptions) => {
    const rulesMap = {}
    const deployableMap = {}
    const channelsMap = {}
    const postHooksMap = {}
    const preHooksMap = {}
    let arr = null

    subscriptions.forEach((subscription) => {
        modelSubscriptions.push(subscription)
        // build up map of what deployables to get for a bulk fetch
        if (subscription.deployablePaths) {
            subscription.deployablePaths.forEach((deployablePath) => {
                if (deployablePath && deployablePath.split('/').length > 0) {
                    const [deployableNamespace, deployableName] = deployablePath.split('/')
                    arr = deployableMap[deployableNamespace]
                    if (!arr) {
                        deployableMap[deployableNamespace] = []
                        arr = deployableMap[deployableNamespace]
                    }
                    arr.push({ deployableName, subscription })
                    subscription.deployables = []
                }
            })
            delete subscription.deployablePaths
        }

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
        deployableMap,
        channelsMap,
        rulesMap,
        preHooksMap,
        postHooksMap,
    }
}

// async getPlacement(resource, apiVersion, namespace) {
//   let placement = '';
//   const argoName = _.get(resource, 'metadata.ownerReferences[0].name', '');
//   if (argoName) {
//     const applicationset = await this.kubeConnector.getResources(
//       (ns) => `/apis/${apiVersion}/namespaces/${ns}/applicationsets/${argoName}`,
//       { namespaces: [namespace] },
//     );
//     const placementName = _.get(applicationset[0], 'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]', '');
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

// async getAppDeployables(deployableMap) {
//   const requests = Object.entries(deployableMap).map(async ([namespace, values]) => {
//     // get all deployables in this namespace
//     let response;
//     try {
//       response = await this.kubeConnector.getResources(
//         (ns) => `/apis/apps.open-cluster-management.io/v1/namespaces/${ns}/deployables`,
//         { kind: 'Deployable', namespaces: [namespace] },
//       ) || [];
//     } catch (err) {
//       logger.error(err);
//       throw err;
//     }

//     // stuff responses into subscriptions that requested them
//     response.forEach((deployable) => {
//       const name = _.get(deployable, 'metadata.name');
//       values.forEach(({ deployableName, subscription }) => {
//         if (name === deployableName) {
//           subscription.deployables.push(deployable);
//         }
//       });
//     });
//   });
//   return Promise.all(requests);
// }

// async getAppHooks(hooks, isPreHooks) {
//   const requests = Object.entries(hooks).map(async ([namespace, values]) => {
//     // get all ansible hooks in this namespace
//     let response;
//     try {
//       response = await this.kubeConnector.getResources(
//         (ns) => `/apis/tower.ansible.com/v1alpha1/namespaces/${ns}/ansiblejobs`,
//         { kind: 'AnsibleJob', namespaces: [namespace] },
//       ) || [];
//     } catch (err) {
//       logger.error(err);
//       throw err;
//     }
//     // stuff responses into subscriptions that requested them
//     response.forEach((deployable) => {
//       const name = _.get(deployable, 'metadata.name');
//       values.forEach(({ deployableName, subscription }) => {
//         if (name === deployableName) {
//           if (isPreHooks) {
//             if (!subscription.prehooks) {
//               subscription.prehooks = [];
//             }
//             subscription.prehooks.push(deployable);
//           } else {
//             if (!subscription.posthooks) {
//               subscription.posthooks = [];
//             }
//             subscription.posthooks.push(deployable);
//           }
//         }
//       });
//     });
//   });
//   return Promise.all(requests);
// }

// async getAppChannels(channelsMap) {
//   const requests = Object.entries(channelsMap).map(async ([namespace, values]) => {
//     // get all rules in this namespace
//     const response = await this.kubeConnector.getResources(
//       (ns) => `/apis/apps.open-cluster-management.io/v1/namespaces/${ns}/channels`,
//       { kind: 'Channel', namespaces: [namespace] },
//     ) || [];

//     // stuff responses into subscriptions that requested them
//     response.forEach((channel) => {
//       const name = _.get(channel, 'metadata.name');
//       values.forEach(({ chnName, subscription }) => {
//         if (name === chnName) {
//           subscription.channels.push(channel);
//         }
//       });
//     });
//   });
//   return Promise.all(requests);
// }

// // get all channels for all subscriptions
// // this is used to build the subscription cards information
// async getAllAppChannels(appAllChannels, allSubscriptions) {
//   let requests;
//   try {
//     // get all channels information
//     const channelsMap = {};
//     allSubscriptions.forEach((subscription) => {
//       const chnlData = _.get(subscription, 'spec.channel', '').split('/');
//       if (chnlData.length === 2) {
//         // eslint-disable-next-line prefer-destructuring
//         channelsMap[chnlData[0]] = chnlData[1];
//       }
//     });
//     requests = Object.entries(channelsMap).map(async ([channelNS, channelName]) => {
//       const response = await this.kubeConnector.getResources(
//         (ns) => `/apis/apps.open-cluster-management.io/v1/namespaces/${ns}/channels/${channelName}`,
//         { kind: 'Channel', namespaces: [channelNS] },
//       ) || [];
//       // stuff response into appAllChannels
//       response.forEach((channel) => {
//         appAllChannels.push(channel);
//       });
//     });
//   } catch (err) {
//     logger.error(err);
//     throw err;
//   }
//   return Promise.all(requests);
// }

// async getAppRules(rulesMap, allClusters) {
//   let requests;
//   try {
//     requests = Object.entries(rulesMap).map(async ([namespace, values]) => {
//       // get all rules in this namespace
//       const response = await this.kubeConnector.getResources(
//         (ns) => `/apis/apps.open-cluster-management.io/v1/namespaces/${ns}/placementrules`,
//         { kind: 'PlacementRule', namespaces: [namespace] },
//       ) || [];

//       // stuff responses into subscriptions that requested them
//       response.forEach((rule) => {
//         const name = _.get(rule, 'metadata.name');
//         values.forEach(({ ruleName, subscription }) => {
//           if (name === ruleName) {
//             subscription.rules.push(rule);
//             const clusters = _.get(rule, 'status.decisions', []);
//             clusters.forEach((cluster) => {
//               // get cluster name
//               const clusterName = _.get(cluster, 'clusterName');
//               if (clusterName && allClusters.indexOf(clusterName) === -1) {
//                 allClusters.push(clusterName);
//               }
//             });
//           }
//         });
//       });
//     });
//   } catch (err) {
//     logger.error(err);
//     throw err;
//   }
//   return Promise.all(requests);
// }

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
