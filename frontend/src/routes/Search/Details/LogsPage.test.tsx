/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useRef, useState } from 'react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClustersState } from '../../../atoms'
import { nockGetTextPlain, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForNocks } from '../../../lib/test-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources'
import { SearchDetailsContext } from './DetailsPage'
import LogsPage, { LogsFooterButton, LogsHeader, LogsToolbar } from './LogsPage'

// TODO why does the react-log-viewer not work with testing-library render...
jest.mock('@patternfly/react-log-viewer', () => ({
  __esModule: true,
  LogViewer: () => {
    return (
      <div>
        <div>
          <p>{'Cluster:'}</p>
          {'testCluster'}
        </div>
        <div>
          <p>{'Namespace:'}</p>
          {'testNamespace'}
        </div>
        <div>{'testLogs'}</div>
      </div>
    )
  },
  LogViewerSearch: () => {
    return <div>{'Search'}</div>
  },
}))

jest.mock('screenfull', () => ({
  isEnabled: true,
  on: () => {},
  off: () => {},
}))

URL.createObjectURL = jest.fn(() => '/test/url')

const mockPod = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'alertmanager-main-0',
    generateName: 'alertmanager-main-',
    namespace: 'openshift-monitoring',
    uid: '603b72a8-705e-4e6d-b08f-5590e095aecf',
    resourceVersion: '110751',
    creationTimestamp: '2022-11-07T11:32:59Z',
  },
  spec: {
    volumes: [
      { name: 'config-volume', secret: { secretName: 'alertmanager-main-generated', defaultMode: 420 } },
      {
        name: 'tls-assets',
        projected: { sources: [{ secret: { name: 'alertmanager-main-tls-assets-0' } }], defaultMode: 420 },
      },
      { name: 'config-out', emptyDir: {} },
      { name: 'secret-alertmanager-main-tls', secret: { secretName: 'alertmanager-main-tls', defaultMode: 420 } },
      {
        name: 'secret-alertmanager-main-proxy',
        secret: { secretName: 'alertmanager-main-proxy', defaultMode: 420 },
      },
      {
        name: 'secret-alertmanager-kube-rbac-proxy',
        secret: { secretName: 'alertmanager-kube-rbac-proxy', defaultMode: 420 },
      },
      {
        name: 'secret-alertmanager-kube-rbac-proxy-metric',
        secret: { secretName: 'alertmanager-kube-rbac-proxy-metric', defaultMode: 420 },
      },
      { name: 'web-config', secret: { secretName: 'alertmanager-main-web-config', defaultMode: 420 } },
      { name: 'alertmanager-main-db', emptyDir: {} },
      { name: 'metrics-client-ca', configMap: { name: 'metrics-client-ca', defaultMode: 420 } },
      {
        name: 'alertmanager-trusted-ca-bundle',
        configMap: {
          name: 'alertmanager-trusted-ca-bundle-c7nmestil7q08',
          items: [{ key: 'ca-bundle.crt', path: 'tls-ca-bundle.pem' }],
          defaultMode: 420,
          optional: true,
        },
      },
      {
        name: 'kube-api-access-cmzm6',
        projected: {
          sources: [
            { serviceAccountToken: { expirationSeconds: 3607, path: 'token' } },
            { configMap: { name: 'kube-root-ca.crt', items: [{ key: 'ca.crt', path: 'ca.crt' }] } },
            {
              downwardAPI: {
                items: [
                  {
                    path: 'namespace',
                    fieldRef: { apiVersion: 'v1', fieldPath: 'metadata.namespace' },
                  },
                ],
              },
            },
            {
              configMap: {
                name: 'openshift-service-ca.crt',
                items: [{ key: 'service-ca.crt', path: 'service-ca.crt' }],
              },
            },
          ],
          defaultMode: 420,
        },
      },
    ],
    containers: [
      {
        name: 'alertmanager',
        image:
          'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c5c839b44aad93758054ece373748e991a0e00bf7c486986a9f5bdba5c83bc29',
        args: [
          '--config.file=/etc/alertmanager/config_out/alertmanager.env.yaml',
          '--storage.path=/alertmanager',
          '--data.retention=120h',
          '--cluster.listen-address=[$(POD_IP)]:9094',
          '--web.listen-address=127.0.0.1:9093',
          '--web.external-url=https:/console-openshift-console.apps.cs-aws-412-xs6bh.dev02.red-chesterfield.com/monitoring',
          '--web.route-prefix=/',
          '--cluster.peer=alertmanager-main-0.alertmanager-operated:9094',
          '--cluster.peer=alertmanager-main-1.alertmanager-operated:9094',
          '--cluster.reconnect-timeout=5m',
          '--web.config.file=/etc/alertmanager/web_config/web-config.yaml',
        ],
        ports: [
          { name: 'mesh-tcp', containerPort: 9094, protocol: 'TCP' },
          { name: 'mesh-udp', containerPort: 9094, protocol: 'UDP' },
        ],
        env: [{ name: 'POD_IP', valueFrom: { fieldRef: { apiVersion: 'v1', fieldPath: 'status.podIP' } } }],
        resources: { requests: { cpu: '4m', memory: '40Mi' } },
        volumeMounts: [
          { name: 'config-volume', mountPath: '/etc/alertmanager/config' },
          { name: 'config-out', readOnly: true, mountPath: '/etc/alertmanager/config_out' },
          { name: 'tls-assets', readOnly: true, mountPath: '/etc/alertmanager/certs' },
          { name: 'alertmanager-main-db', mountPath: '/alertmanager' },
          {
            name: 'secret-alertmanager-main-tls',
            readOnly: true,
            mountPath: '/etc/alertmanager/secrets/alertmanager-main-tls',
          },
          {
            name: 'secret-alertmanager-main-proxy',
            readOnly: true,
            mountPath: '/etc/alertmanager/secrets/alertmanager-main-proxy',
          },
          {
            name: 'secret-alertmanager-kube-rbac-proxy',
            readOnly: true,
            mountPath: '/etc/alertmanager/secrets/alertmanager-kube-rbac-proxy',
          },
          {
            name: 'secret-alertmanager-kube-rbac-proxy-metric',
            readOnly: true,
            mountPath: '/etc/alertmanager/secrets/alertmanager-kube-rbac-proxy-metric',
          },
          {
            name: 'alertmanager-trusted-ca-bundle',
            readOnly: true,
            mountPath: '/etc/pki/ca-trust/extracted/pem/',
          },
          {
            name: 'web-config',
            readOnly: true,
            mountPath: '/etc/alertmanager/web_config/web-config.yaml',
            subPath: 'web-config.yaml',
          },
          {
            name: 'kube-api-access-cmzm6',
            readOnly: true,
            mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
          },
        ],
        startupProbe: {
          exec: { command: ['sh', '-c', 'exec curl --fail http://localhost:9093/-/ready'] },
          initialDelaySeconds: 20,
          timeoutSeconds: 3,
          periodSeconds: 10,
          successThreshold: 1,
          failureThreshold: 40,
        },
        terminationMessagePath: '/dev/termination-log',
        terminationMessagePolicy: 'FallbackToLogsOnError',
        imagePullPolicy: 'IfNotPresent',
        securityContext: {
          capabilities: { drop: ['ALL', 'KILL', 'MKNOD', 'SETGID', 'SETUID'] },
          readOnlyRootFilesystem: true,
          allowPrivilegeEscalation: false,
        },
      },
    ],
    restartPolicy: 'Always',
    terminationGracePeriodSeconds: 120,
    dnsPolicy: 'ClusterFirst',
    nodeSelector: { 'kubernetes.io/os': 'linux' },
    serviceAccountName: 'alertmanager-main',
    serviceAccount: 'alertmanager-main',
    nodeName: 'ip-10-0-146-85.ec2.internal',
    securityContext: {
      seLinuxOptions: { level: 's0:c21,c5' },
      runAsUser: 65534,
      runAsNonRoot: true,
      fsGroup: 65534,
    },
    imagePullSecrets: [{ name: 'alertmanager-main-dockercfg-2r4r6' }],
    hostname: 'alertmanager-main-0',
    subdomain: 'alertmanager-operated',
    affinity: {
      podAntiAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            labelSelector: {
              matchLabels: {
                'app.kubernetes.io/component': 'alert-router',
                'app.kubernetes.io/instance': 'main',
                'app.kubernetes.io/name': 'alertmanager',
                'app.kubernetes.io/part-of': 'openshift-monitoring',
              },
            },
            namespaces: ['openshift-monitoring'],
            topologyKey: 'kubernetes.io/hostname',
          },
        ],
      },
    },
    schedulerName: 'default-scheduler',
    tolerations: [
      { key: 'node.kubernetes.io/not-ready', operator: 'Exists', effect: 'NoExecute', tolerationSeconds: 300 },
      { key: 'node.kubernetes.io/unreachable', operator: 'Exists', effect: 'NoExecute', tolerationSeconds: 300 },
      { key: 'node.kubernetes.io/memory-pressure', operator: 'Exists', effect: 'NoSchedule' },
    ],
    priorityClassName: 'system-cluster-critical',
    priority: 2000000000,
    enableServiceLinks: true,
    preemptionPolicy: 'PreemptLowerPriority',
  },
  status: {
    phase: 'Running',
    conditions: [
      { type: 'Initialized', status: 'True', lastProbeTime: null, lastTransitionTime: '2022-11-07T11:32:59Z' },
      { type: 'Ready', status: 'True', lastProbeTime: null, lastTransitionTime: '2022-11-07T11:34:10Z' },
      {
        type: 'ContainersReady',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2022-11-07T11:34:10Z',
      },
      { type: 'PodScheduled', status: 'True', lastProbeTime: null, lastTransitionTime: '2022-11-07T11:32:59Z' },
    ],
    hostIP: '10.0.146.85',
    podIP: '10.130.0.70',
    podIPs: [{ ip: '10.130.0.70' }],
    startTime: '2022-11-07T11:32:59Z',
    containerStatuses: [
      {
        name: 'alertmanager',
        state: { running: { startedAt: '2022-11-07T11:33:48Z' } },
        lastState: {
          terminated: {
            exitCode: 1,
            reason: 'Error',
            message:
              'ts=2022-11-07T11:33:40.734Z caller=main.go:231 level=info msg="Starting Alertmanager" version="(version=0.24.0, branch=rhaos-4.12-rhel-8, revision=678e0abedacfaeb85d6ae9550ce5840add96de47)"\nts=2022-11-07T11:33:40.735Z caller=main.go:232 level=info build_context="(go=go1.19.1, user=root@d300d7450dc1, date=20221003-13:17:25)"\nts=2022-11-07T11:33:40.790Z caller=cluster.go:680 level=info component=cluster msg="Waiting for gossip to settle..." interval=2s\nts=2022-11-07T11:33:40.842Z caller=coordinator.go:113 level=info component=configuration msg="Loading configuration file" file=/etc/alertmanager/config_out/alertmanager.env.yaml\nts=2022-11-07T11:33:40.842Z caller=coordinator.go:118 level=error component=configuration msg="Loading configuration file failed" file=/etc/alertmanager/config_out/alertmanager.env.yaml err="open /etc/alertmanager/config_out/alertmanager.env.yaml: no such file or directory"\nts=2022-11-07T11:33:40.842Z caller=cluster.go:689 level=info component=cluster msg="gossip not settled but continuing anyway" polls=0 elapsed=51.818563ms\n',
            startedAt: '2022-11-07T11:33:40Z',
            finishedAt: '2022-11-07T11:33:41Z',
            containerID: 'cri-o://272e120ee46d07d3977d249d2ebc9a4a6dc505e04f22d3b0715067bfbdd546c6',
          },
        },
        ready: true,
        restartCount: 1,
        image:
          'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c5c839b44aad93758054ece373748e991a0e00bf7c486986a9f5bdba5c83bc29',
        imageID:
          'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:c5c839b44aad93758054ece373748e991a0e00bf7c486986a9f5bdba5c83bc29',
        containerID: 'cri-o://d80a7e808a5c1f825dc91c2d1d272f947f55df7b26a7f56485461f13d3124c31',
        started: true,
      },
    ],
  },
}

const managedClusters: ManagedCluster[] = [
  {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      labels: {
        cloud: 'Amazon',
        name: 'testCluster',
        vendor: 'OpenShift',
      },
      name: 'testCluster',
    },
    spec: {
      hubAcceptsClient: true,
    },
    status: {
      allocatable: {
        cpu: '42',
        memory: '179120384Ki',
      },
      capacity: {
        memory: '192932096Ki',
        cpu: '48',
      },
      clusterClaims: [
        {
          name: 'id.k8s.io',
          value: 'testCluster',
        },
      ],
      conditions: [
        {
          message: 'Accepted by hub cluster admin',
          reason: 'HubClusterAdminAccepted',
          status: 'True',
          type: 'HubAcceptedManagedCluster',
        },
        {
          message: 'Managed cluster is available',
          reason: 'ManagedClusterAvailable',
          status: 'True',
          type: 'ManagedClusterConditionAvailable',
        },
      ],
      version: {
        kubernetes: 'v1.20.0+bbbc079',
      },
    },
  },
]

beforeEach(() => {
  sessionStorage.clear()
})

const testClusterSearchDetailsContext: Partial<SearchDetailsContext> = {
  resource: mockPod,
  resourceError: '',
  kind: 'pod',
  containers: ['testContainer', 'testContainer1'],
  cluster: 'testCluster',
  namespace: 'testNamespace',
  name: 'testName',
}

const localClusterSearchDetailsContext: Partial<SearchDetailsContext> = {
  resource: mockPod,
  resourceError: '',
  kind: 'pod',
  containers: ['testContainer', 'testContainer1'],
  cluster: 'local-cluster',
  namespace: 'testNamespace',
  name: 'testName',
  isHubClusterResource: true,
}

describe('LogsPage', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
  })

  it('should correctly render resource error if pod is no longer found', async () => {
    const managedClusterLogs = nockGetTextPlain(
      'testLogs',
      200,
      true,
      '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
    )
    const context: Partial<SearchDetailsContext> = {
      ...testClusterSearchDetailsContext,
      resourceError: 'Invalid request',
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([managedClusterLogs])
    await waitFor(() => expect(screen.getByText('Invalid request')).toBeInTheDocument())
  })

  it('should correctly render log request error', async () => {
    const managedClusterLogs = nockGetTextPlain(
      'testLogs',
      500,
      true,
      '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
    )

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, managedClusters)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={testClusterSearchDetailsContext} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([managedClusterLogs])
    await waitFor(() => expect(screen.getByText('Internal Server Error')).toBeInTheDocument())
  })

  it('should correctly render log request error for Non-OCP clusters', async () => {
    const managedClusterLogs = nockGetTextPlain(
      'testLogs',
      400,
      true,
      '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
    )

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={testClusterSearchDetailsContext} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([managedClusterLogs])
    await waitFor(() => expect(screen.getByText('Danger alert:')).toBeInTheDocument())
  })

  it('should render logs page with local-cluster logs successfully', async () => {
    const localClusterLogs = nockGetTextPlain(
      'testLogs',
      200,
      true,
      '/api/v1/namespaces/testNamespace/pods/testName/log?container=testContainer&tailLines=1000'
    )

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={localClusterSearchDetailsContext} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([localClusterLogs])

    // Wait for request to finish and check logs are displayed correctly
    await waitFor(() => expect(localClusterLogs.isDone()).toBeTruthy())
    await waitFor(() => expect(screen.getByText('testNamespace')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('testLogs')).toBeInTheDocument())
  })

  it('should render logs page with local-cluster logs error', async () => {
    const localClusterLogs = nockGetTextPlain(
      'testLogs',
      500,
      true,
      '/api/v1/namespaces/testNamespace/pods/testName/log?container=testContainer&tailLines=1000'
    )

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={localClusterSearchDetailsContext} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([localClusterLogs])

    // Wait for request to finish and check logs are displayed correctly
    await waitFor(() => expect(localClusterLogs.isDone()).toBeTruthy())
    await waitFor(() => expect(screen.getByText('Internal Server Error')).toBeInTheDocument())
  })

  it('should render logs page with managed cluster logs successfully', async () => {
    const managedClusterLogs = nockGetTextPlain(
      'testLogs',
      200,
      true,
      '/apis/proxy.open-cluster-management.io/v1beta1/namespaces/testCluster/clusterstatuses/testCluster/log/testNamespace/testName/testContainer?tailLines=1000'
    )

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={testClusterSearchDetailsContext} />}>
              <Route path="*" element={<LogsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([managedClusterLogs])

    // Wait for request to finish and check logs are displayed correctly
    await waitFor(() => expect(managedClusterLogs.isDone()).toBeTruthy())
    await waitFor(() => expect(screen.getByText('testCluster')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('testNamespace')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('testLogs')).toBeInTheDocument())
  })

  it('should render logs toolbar & click wrap lines and raw buttons', async () => {
    jest.mock('react', () => ({
      useContext: jest.fn(),
    }))
    const useContextMock = jest.spyOn(React, 'useContext')
    useContextMock.mockReturnValue({
      searchedWordIndexes: [],
      rowInFocus: {
        rowIndex: 0,
        matchIndex: 0,
      },
      searchedInput: '',
      itemCount: 0,
      currentSearchedItemCount: 0,
      scrollToRow: () => {},
      setRowInFocus: () => {},
      setSearchedInput: () => {},
      setSearchedWordIndexes: () => {},
      setCurrentSearchedItemCount: () => {},
    })
    window.open = jest.fn()
    document.write = jest.fn()
    const Toolbar = () => {
      const [wrapLines, setWrapLines] = useState<boolean>(false)
      const [container, setContainer] = useState<string>('testContainer')
      const [previousLogs, setPreviousLogs] = useState<boolean>(false)
      return (
        <RecoilRoot>
          <LogsToolbar
            logs={'testLogs'}
            name={'testPod'}
            container={container}
            cluster={'local-cluster'}
            containers={['testContainer', 'testContainer1', 'testContainer2']}
            setContainer={setContainer}
            toggleWrapLines={setWrapLines}
            wrapLines={wrapLines}
            toggleFullscreen={() => {}}
            isFullscreen={false}
            containerHasPreviousLogs={false}
            previousLogs={previousLogs}
            setPreviousLogs={setPreviousLogs}
          />
        </RecoilRoot>
      )
    }
    render(<Toolbar />)

    await waitFor(() => expect(screen.getByText('testContainer')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Expand')).toBeInTheDocument())

    // Should toggle wrap lines
    const wrapLinesBtn = screen.getByText(/wrap lines/i)
    await waitFor(() => expect(wrapLinesBtn).toBeInTheDocument())
    userEvent.click(wrapLinesBtn)

    const rawBtn = screen.getByRole('button', {
      name: /raw/i,
    })
    await waitFor(() => expect(rawBtn).toBeInTheDocument())
    userEvent.click(rawBtn)
    expect(window.open).toHaveBeenCalledWith('about:blank')

    const containerBtn = screen.getByText(/testcontainer/i)
    await waitFor(() => expect(containerBtn).toBeInTheDocument())
    userEvent.click(containerBtn)
    await waitFor(() => expect(screen.getByText(/testcontainer1/i)).toBeInTheDocument())
    screen.getByText(/testcontainer1/i).click()
  })

  it('should render logs toolbar in fullescreen mode', async () => {
    jest.mock('react', () => ({
      useContext: jest.fn(),
    }))
    const useContextMock = jest.spyOn(React, 'useContext')
    useContextMock.mockReturnValue({
      searchedWordIndexes: [],
      rowInFocus: {
        rowIndex: 0,
        matchIndex: 0,
      },
      searchedInput: '',
      itemCount: 0,
      currentSearchedItemCount: 0,
      scrollToRow: () => {},
      setRowInFocus: () => {},
      setSearchedInput: () => {},
      setSearchedWordIndexes: () => {},
      setCurrentSearchedItemCount: () => {},
    })
    window.open = jest.fn()
    document.write = jest.fn()
    const Toolbar = () => {
      const [wrapLines, setWrapLines] = useState<boolean>(false)
      const [container, setContainer] = useState<string>('testContainer')
      const [previousLogs, setPreviousLogs] = useState<boolean>(false)
      return (
        <RecoilRoot>
          <LogsToolbar
            logs={'testLogs'}
            name={'testPod'}
            container={container}
            cluster={'local-cluster'}
            containers={['testContainer', 'testContainer1', 'testContainer2']}
            setContainer={setContainer}
            toggleWrapLines={setWrapLines}
            wrapLines={wrapLines}
            toggleFullscreen={() => {}}
            isFullscreen={true}
            containerHasPreviousLogs={false}
            previousLogs={previousLogs}
            setPreviousLogs={setPreviousLogs}
          />
        </RecoilRoot>
      )
    }
    render(<Toolbar />)

    await waitFor(() => expect(screen.getByText('testContainer')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Collapse')).toBeInTheDocument())
  })

  it('should render header bar correctly', async () => {
    render(<LogsHeader cluster={'local-cluster'} namespace={'testNamespace'} linesLength={10} />)

    await waitFor(() => expect(screen.getByText('local-cluster')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('testNamespace')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('10 lines')).toBeInTheDocument())
  })

  it('should render footer correctly', async () => {
    const Footer = () => {
      const logViewerRef = useRef<any>()
      const [showJumpToBottomBtn, setShowJumpToBottomBtn] = useState<boolean>(true)
      return (
        <RecoilRoot>
          <LogsFooterButton
            logViewerRef={logViewerRef}
            showJumpToBottomBtn={showJumpToBottomBtn}
            setShowJumpToBottomBtn={setShowJumpToBottomBtn}
          />
        </RecoilRoot>
      )
    }
    render(<Footer />)

    const footerBtn = screen.getByText('Jump to the bottom')
    await waitFor(() => expect(footerBtn).toHaveStyle('visibility: visible'))
    userEvent.click(footerBtn)
    await waitFor(() => expect(footerBtn).toHaveStyle('visibility: hidden'))
  })
})
