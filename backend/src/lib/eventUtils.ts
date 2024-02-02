/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../resources/resource'

type CompliantType = 'Compliant' | 'NonCompliant' | 'Pending'

const POLL_INTERVAL = 10

export interface IPolicy extends IResource {
  metadata: {
    name: string
    namespace: string
    resourceVersion: string
    uid: string
    annotations?: Record<string, string>
  }
  spec: unknown
  status?: {
    compliant?: CompliantType
    status?: { clustername: string; clusternamespace: string; compliant?: CompliantType }[]
  }
}

export interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'ERROR'
  object: IResource
}

export interface SettingsEvent {
  type: 'SETTINGS'
  settings: Record<string, string>
}

export type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' }

export interface Compliance {
  type: 'COMPLIANT' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'ERROR'
}

interface IThrottleCache {
  [uid: string]: {
    time: number
    touched?: number
    history: number[]
    last?: string
    resource?: IResource
  }
}

const throttleCache: IThrottleCache = {}

// ///////////////////////////////////////////////////////////////////////////////////
//   _____ _               _   _   _        _____                 _
//  |_   _| |__  _ __ ___ | |_| |_| | ___  | ____|_   _____ _ __ | |_ ___
//    | | | '_ \| '__/ _ \| __| __| |/ _ \ |  _| \ \ / / _ \ '_ \| __/ __|
//    | | | | | | | | (_) | |_| |_| |  __/ | |___ \ V /  __/ | | | |_\__ \
//    |_| |_| |_|_|  \___/ \__|\__|_|\___| |_____| \_/ \___|_| |_|\__|___/
// ///////////////////////////////////////////////////////////////////////////////////
export function throttleEvents(resource: IResource, cacheResource: (arg: IResource) => void) {
  if (resource.kind === 'Policy') {
    const policy = resource as IPolicy
    const uid = policy?.metadata?.uid
    const throttle = throttleCache[uid]
    let compliance: CompliantType = policy?.status?.compliant
    const type = compliance === 'Compliant' ? 1 : 3

    // if we haven't seen this policy before, send it immediately to ui
    // but remember it in case it soon changes again
    if (!throttle) {
      throttleCache[uid] = {
        time: new Date().getTime(),
        history: [type],
        last: compliance,
      }
      cacheResource(resource)
    } else {
      // ok, this policy has changed again
      // in case it's thrashing, don't send out another event
      // for POLL_INTERVAL -- iow this is a reverse polling
      throttle.history.push(type)
      throttle.history = throttle.history.slice(-10)
      throttle.touched = new Date().getTime()
      if (Math.floor((throttle.touched - throttle.time) / 1000) < POLL_INTERVAL) {
        throttle.resource = resource
      } else {
        // use standard deviation to see if policy compliance is thrashing
        //  0 = same complicance over the last POLL_INTERVAL interval == no thrashing
        //  >0.9 = compliance is all over the place, this is thrashing
        const n = throttle.history.length
        const mean = throttle.history.reduce((a, b) => a + b) / n
        const sd = Math.sqrt(throttle.history.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)

        if (sd > 0.9) {
          // if thrashing, we assume noncompliance--there is no "thrash compliance" state
          compliance = 'NonCompliant'
        } else {
          // else set the compliance to the average of the last POLL_INTERVAL interval
          compliance = mean < 2 ? 'Compliant' : 'NonCompliant'
        }

        // start the poll again
        throttle.time = throttle.touched
        // send out a new event only if it's a new compliance state
        if (compliance !== throttle.last) {
          throttle.last = compliance
          policy.status.compliant = compliance
          cacheResource(resource)
        }
      }
    }
  }
}

// if a policy event toggle there for awhile, but stopped, this will kick it out
// iow event A happened twice within POLL_INTERVAL, the second event is held onto
// but if a new event doesn't happen again, we send that last event
export function purgeEvents(cacheResource: (arg: IResource) => void) {
  Object.keys(throttleCache).forEach(function (uid) {
    const throttle = throttleCache[uid]
    if (!throttle.touched) {
      delete throttleCache[uid]
    } else if (Math.floor((throttle.touched - throttle.time) / 1000) > POLL_INTERVAL) {
      cacheResource(throttle.resource)
      delete throttleCache[uid]
    }
  })
}

// ///////////////////////////////////////////////////////////////////////////////////
//  _____ _                   _       ____       _ _      _
//  |_   _| |__  _ __ __ _ ___| |__   |  _ \ ___ | (_) ___(_) ___  ___
//    | | | '_ \| '__/ _` / __| '_ \  | |_) / _ \| | |/ __| |/ _ \/ __|
//    | | | | | | | | (_| \__ \ | | | |  __/ (_) | | | (__| |  __/\__ \
//    |_| |_| |_|_|  \__,_|___/_| |_| |_|   \___/|_|_|\___|_|\___||___/
// ///////////////////////////////////////////////////////////////////////////////////

export function thrashEvents(cacheResource: (arg: IResource) => void) {
  let resourceVersion = 705556
  setTimeout(() => {
    setInterval(() => {
      const name = 'thrasher-policy'
      resourceVersion = resourceVersion + 1
      for (let i = 0; i < 50 * 70; i++) {
        const policy = structuredClone(mockedPolicy)
        policy.metadata.name = `${name}-${i + 1}`
        policy.metadata.resourceVersion = resourceVersion.toString()
        policy.metadata.uid = `018a0bd7-9130-4246-ba59-5b6c30a54${i.toString().padStart(3, '0')}`
        const compliant: CompliantType = Math.random() < 0.5 && i > 2000 ? 'NonCompliant' : 'Compliant'
        policy.status.compliant = compliant
        policy.status.status[0].compliant = compliant
        throttleEvents(policy, cacheResource)
        //cacheResource(policy)
      }
    }, 3000)
  }, 60000)
}

const mockedPolicy: IPolicy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    annotations: {
      'policy.open-cluster-management.io/categories': 'CM Configuration Management',
      'policy.open-cluster-management.io/controls': 'CM-6 Configuration Settings',
      'policy.open-cluster-management.io/description': 'this policy thrashed!',
      'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
    },
    name: 'trasher-policy',
    namespace: 'default',
    resourceVersion: '705556',
    uid: '018a0bd7-9130-4246-ba59-5b6c30a54e57',
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: {
            name: 'compliance-e8-scan',
          },
          spec: {
            'object-templates': [
              {
                complianceType: 'musthave',
                objectDefinition: {
                  apiVersion: 'compliance.openshift.io/v1alpha1',
                  kind: 'ScanSettingBinding',
                  metadata: {
                    name: 'e8',
                    namespace: 'openshift-compliance',
                  },
                  profiles: [
                    {
                      apiGroup: 'compliance.openshift.io/v1alpha1',
                      kind: 'Profile',
                      name: 'ocp4-e8',
                    },
                    {
                      apiGroup: 'compliance.openshift.io/v1alpha1',
                      kind: 'Profile',
                      name: 'rhcos4-e8',
                    },
                  ],
                  settingsRef: {
                    apiGroup: 'compliance.openshift.io/v1alpha1',
                    kind: 'ScanSetting',
                    name: 'default',
                  },
                },
              },
            ],
            remediationAction: 'inform',
            severity: 'high',
          },
        },
      },
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: {
            name: 'compliance-suite-e8',
          },
          spec: {
            'object-templates': [
              {
                complianceType: 'musthave',
                objectDefinition: {
                  apiVersion: 'compliance.openshift.io/v1alpha1',
                  kind: 'ComplianceSuite',
                  metadata: {
                    name: 'e8',
                    namespace: 'openshift-compliance',
                  },
                  status: {
                    phase: 'DONE',
                  },
                },
              },
            ],
            remediationAction: 'inform',
            severity: 'high',
          },
        },
      },
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: {
            name: 'compliance-suite-e8-results',
          },
          spec: {
            'object-templates': [
              {
                complianceType: 'mustnothave',
                objectDefinition: {
                  apiVersion: 'compliance.openshift.io/v1alpha1',
                  kind: 'ComplianceCheckResult',
                  metadata: {
                    labels: {
                      'compliance.openshift.io/check-status': 'FAIL',
                      'compliance.openshift.io/suite': 'e8',
                    },
                    namespace: 'openshift-compliance',
                  },
                },
              },
            ],
            remediationAction: 'inform',
            severity: 'high',
          },
        },
      },
    ],
  },
  status: {
    compliant: 'Compliant',
    status: [
      {
        clustername: 'local-cluster',
        clusternamespace: 'local-cluster',
        compliant: 'Compliant',
      },
    ],
  },
}
