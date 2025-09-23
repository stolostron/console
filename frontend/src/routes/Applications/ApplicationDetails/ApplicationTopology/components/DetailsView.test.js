/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2020. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen } from '@testing-library/react'
import { waitForText } from '../../../../../lib/test-util'
import DetailsView from './DetailsView'

const t = (string) => {
  return string
}

class MockViewContainer {
  getBoundingClientRect() {
    return new Map()
  }
}

describe('DetailsView no components', () => {
  const returnEmptyArr = jest.fn()
  returnEmptyArr.mockReturnValue([
    {
      uid: 'deployment1',
      id: 'deployment1',
      type: 'deployment',
      name: 'name',
      namespace: 'ns',
      specs: {
        raw: {
          metadata: {
            namespace: 'ns',
          },
        },
      },
    },
  ])
  const viewContainer = jest.fn()
  viewContainer.mockReturnValue(new MockViewContainer())
  const nodeDetails = jest.fn()
  nodeDetails.mockReturnValue([])
  const mockData = {
    locale: 'en-US',
    handleClose: jest.fn(),
    staticResourceData: {
      typeToShapeMap: {},
      getNodeDetails: returnEmptyArr,
    },
    getLayoutNodes: returnEmptyArr,
    selectedNodeId: 'deployment1',
    getViewContainer: viewContainer,
    processActionLink: jest.fn(),
  }

  const laidoutNodes = [
    {
      id: 'deployment1',
      uid: 'deployment1',
      name: 'deployment1-app',
      cluster: null,
      clusterName: null,
      type: 'deployment',
      specs: {
        isDesign: true,
        activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
        channels: ['default/mortgage-app-subscription//default/mortgage-channel'],
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'application--mortgage-app',
        type: 'application',
        label: 'mortgage-app',
        compactLabel: 'mortgage-app',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: 'default',
        tooltips: [
          {
            name: 'Application',
            value: 'mortgage-app',
            href: "/multicloud/search?filters={'textsearch':'kind:application name:mortgage-app'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 76.5,
        y: 1.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
  ]

  beforeEach(async () => {
    render(
      <DetailsView
        onClose={mockData.handleClose}
        getLayoutNodes={mockData.getLayoutNodes}
        selectedNodeId={mockData.selectedNodeId}
        getViewContainer={mockData.getViewContainer}
        processActionLink={mockData.processActionLink}
        nodes={laidoutNodes}
        t={t}
        options={mockData.staticResourceData}
      />
    )

    await waitForText('Deployment')
  })

  it('renders as expected', () => {
    expect(screen.getByText('name')).toBeTruthy()
  })
})

const mockDetails = {
  details: [
    {
      type: 'label',
      labelValue: 'resource.type',
      value: 'deployment',
      indent: undefined,
    },
    { type: 'label', labelValue: 'resource.container.logs' },
    {
      type: 'link',
      value: {
        label: 'http://mortgage-app-mortgage',
        data: {
          name: 'mortgage-app-deploy-5578f5675b-krqs8',
          namespace: 'default',
          clusterName: 'localcluster',
          containerName: 'mortgage-app-mortgage',
          containers: [
            {
              name: 'mortgage-app-mortgage',
              image: 'fxiang/mortgage:0.4.0',
            },
          ],
        },
        indent: true,
      },
    },
    {
      type: 'link',
      value: {
        label: 'mortgage-app-mortgage',
        data: {
          name: 'mortgage-app-deploy-5578f5675b-krqs8',
          namespace: 'default',
          clusterName: 'localcluster',
          containerName: 'mortgage-app-mortgage',
          containers: [
            {
              name: 'mortgage-app-mortgage',
              image: 'fxiang/mortgage:0.4.0',
            },
          ],
        },
        indent: true,
      },
    },
    {
      type: 'label',
      label: 'resource.clustername',
      value: 'localcluster',
      indent: undefined,
      status: 'error',
    },
    {
      type: 'label',
      labelValue: 'resource.hostip',
      value: '10.16.44.146',
      indent: undefined,
    },
    {
      type: 'label',
      labelValue: 'resource.podip',
      value: '10.254.12.220',
      indent: undefined,
    },
    {
      type: 'label',
      labelValue: 'resource.created',
      value: '5 days ago',
      indent: undefined,
    },
    {
      type: 'label',
      labelValue: 'resource.status',
      value: 'Running',
      indent: undefined,
    },
    {
      type: 'label',
      labelValue: 'resource.restarts',
      value: 1,
      indent: undefined,
    },
    { type: 'spacer' },
  ],
}

const mockLaidoutNodes = {
  laidoutNodes: [
    {
      id: 'application--mortgage-app',
      uid: 'application--mortgage-app',
      name: 'mortgage-app',
      cluster: null,
      clusterName: null,
      type: 'application',
      specs: {
        isDesign: true,
        activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
        channels: ['default/mortgage-app-subscription//default/mortgage-channel'],
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'application--mortgage-app',
        type: 'application',
        label: 'mortgage-app',
        compactLabel: 'mortgage-app',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: 'default',
        tooltips: [
          {
            name: 'Application',
            value: 'mortgage-app',
            href: "/multicloud/search?filters={'textsearch':'kind:application name:mortgage-app'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 76.5,
        y: 1.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--subscription--default--mortgage-app-subscription',
      uid: 'member--subscription--default--mortgage-app-subscription',
      name: 'mortgage-app-subscription',
      cluster: null,
      clusterName: null,
      type: 'subscription',
      specs: {
        isDesign: true,
        hasRules: true,
        isPlaced: true,
        row: 20,
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--subscription--default--mortgage-app-subscription',
        type: 'subscription',
        label: 'mortgage-app-↵subscription',
        compactLabel: 'mortgage-app..↵subscription',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: 'default',
        tooltips: [
          {
            name: 'Subscription',
            value: 'mortgage-app-subscription',
            href: "/multicloud/search?filters={'textsearch':'kind:subscription name:mortgage-app-subscription'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 76.5,
        y: 121.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--rules--default--mortgage-app-placement--0',
      uid: 'member--rules--default--mortgage-app-placement--0',
      name: 'mortgage-app-placement',
      cluster: null,
      clusterName: null,
      type: 'placements',
      specs: {
        isDesign: true,
        row: 49,
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--rules--default--mortgage-app-placement--0',
        type: 'placements',
        label: 'mortgage-app-↵placement',
        compactLabel: 'mortgage-app-↵placement',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: '',
        tooltips: [
          {
            name: 'Placements',
            value: 'mortgage-app-placement',
            href: "/multicloud/search?filters={'textsearch':'kind:placementrule name:mortgage-app-placement'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 226.5,
        y: 121.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--clusters--localcluster',
      uid: 'member--clusters--localcluster',
      name: 'localcluster',
      cluster: null,
      clusterName: null,
      type: 'cluster',
      specs: {
        cluster: {
          status: 'ok',
          clusterip: 'localhost',
          consoleURL: 'https://localhost:443',
          capacity: {
            cpu: '28',
            memory: '104463Mi',
            nodes: '4',
            storage: '328Gi',
          },
          usage: {
            cpu: '14538m',
            memory: '31955Mi',
            pods: '263',
            storage: '228Gi',
          },
        },
        clusters: [
          {
            status: 'ok',
            clusterip: 'localhost',
            consoleURL: 'https://localhost:443',
            capacity: {
              cpu: '28',
              memory: '104463Mi',
              nodes: '4',
              storage: '328Gi',
            },
            usage: {
              cpu: '14538m',
              memory: '31955Mi',
              pods: '263',
              storage: '228Gi',
            },
          },
        ],
        clusterNames: ['localcluster'],
        clusterStatus: {
          isOffline: false,
          hasViolations: false,
          hasFailure: false,
          isRecent: false,
          isDisabled: false,
        },
        scale: 1,
      },
      namespace: '',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--clusters--localcluster',
        type: 'cluster',
        label: 'localcluster',
        compactLabel: 'localcluster',
        nodeIcons: {
          status: {
            icon: 'success',
            classType: 'success',
            width: 16,
            height: 16,
            dx: 16,
          },
        },
        nodeStatus: undefined,
        isDisabled: false,
        title: '',
        description: 'localhost',
        tooltips: [
          {
            name: 'Cluster',
            value: 'localcluster',
            href: "/multicloud/search?filters={'textsearch':'kind:cluster name:localcluster'}",
          },
        ],
        x: 76.5,
        y: 241.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--deployable--member--clusters--localcluster--default--mortgage-app-deployable',
      uid: 'member--deployable--member--clusters--localcluster--default--mortgage-app-deployable',
      name: 'mortgage-app-deployable',
      cluster: null,
      clusterName: null,
      type: 'deployable',
      specs: {
        isDesign: true,
        isDivider: true,
        row: 66,
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--deployable--member--clusters--localcluster--default--mortgage-app-deployable',
        type: 'deployable',
        label: 'mortgage-app-↵deployable',
        compactLabel: 'mortgage-app-↵deployable',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: undefined,
        tooltips: [
          {
            name: 'Deployable',
            value: 'mortgage-app-deployable',
            href: "/multicloud/search?filters={'textsearch':'kind:deployable name:mortgage-app-deployable'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 151.5,
        y: 361.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
      uid: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
      name: 'mortgage-app-deploy',
      cluster: null,
      clusterName: null,
      type: 'deployment',
      specs: {
        deployStatuses: [{ lastUpdateTime: '2020-02-23T20:22:11Z', phase: 'Subscribed' }],
        isDesign: false,
        row: 111,
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: '',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--deployment--mortgage-app-deploy',
        type: 'deployment',
        label: 'mortgage-app-↵deploy',
        compactLabel: 'mortgage-app-↵deploy',
        nodeIcons: {
          status: {
            icon: 'success',
            classType: 'success',
            width: 16,
            height: 16,
            dx: 16,
          },
        },
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: '',
        tooltips: [
          {
            name: 'Deployment',
            value: 'mortgage-app-deploy',
            href: "/multicloud/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}",
          },
        ],
        x: 151.5,
        y: 481.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--pod--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--mortgage-app-deploy',
      uid: 'member--pod--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--mortgage-app-deploy',
      name: 'mortgage-app-deploy',
      cluster: null,
      clusterName: null,
      type: 'deployment',
      specs: {
        row: 141,
        podModel: {
          'mortgage-app-deploy-5578f5675b-krqs8': {
            name: 'mortgage-app-deploy-5578f5675b-krqs8',
            namespace: 'default',
            status: 'Running',
            cluster: {
              metadata: {
                name: 'localcluster',
              },
            },
            containers: [{ name: 'mortgage-app-mortgage', image: 'fxiang/mortgage:0.4.0' }],
            labels: {
              app: 'mortgage-app-mortgage',
              'pod-template-hash': '5578f5675b',
            },
            hostIP: '10.16.44.146',
            podIP: '10.254.12.220',
            restarts: 1,
            startedAt: '2020-02-18T23:59:09Z',
          },
        },
        podStatus: {
          hasPending: false,
          hasFailure: false,
          hasRestarts: false,
          pulse: null,
        },
        raw: {
          metadata: {
            namespace: 'default',
          },
        },
      },
      namespace: '',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--pod--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--mortgage-app-deploy',
        type: 'pod',
        label: 'mortgage-app-↵deploy',
        compactLabel: 'mortgage-app-↵deploy',
        nodeIcons: {
          status: {
            icon: 'success',
            classType: 'success',
            width: 16,
            height: 16,
            dx: 16,
          },
        },
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: '',
        tooltips: [
          {
            name: 'Pod',
            value: 'mortgage-app-deploy',
            href: "/multicloud/search?filters={'textsearch':'kind:deployment name:mortgage-app-deploy'}&showrelated=pod",
          },
        ],
        x: 151.5,
        y: 601.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--deployable--member--clusters--localcluster--default--mortgage-app-svc',
      uid: 'member--deployable--member--clusters--localcluster--default--mortgage-app-svc',
      name: 'mortgage-app-svc',
      cluster: null,
      clusterName: null,
      type: 'deployable',
      specs: { isDesign: true, isDivider: true, row: 171 },
      namespace: 'default',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--deployable--member--clusters--localcluster--default--mortgage-app-svc',
        type: 'deployable',
        label: 'mortgage-app-↵svc',
        compactLabel: 'mortgage-app-↵svc',
        nodeIcons: {},
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: undefined,
        tooltips: [
          {
            name: 'Deployable',
            value: 'mortgage-app-svc',
            href: "/multicloud/search?filters={'textsearch':'kind:deployable name:mortgage-app-svc'}",
          },
          {
            name: 'Namespace',
            value: 'default',
            href: "/multicloud/search?filters={'textsearch':'kind:namespace name:default'}",
          },
        ],
        x: 1.5,
        y: 361.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
    {
      id: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-svc--service--mortgage-app-svc',
      uid: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-svc--service--mortgage-app-svc',
      name: 'mortgage-app-svc',
      cluster: null,
      clusterName: null,
      type: 'service',
      specs: { deployStatuses: Array(1), isDesign: false, row: 201 },
      namespace: '',
      topology: null,
      labels: null,
      __typename: 'Resource',
      layout: {
        uid: 'member--member--deployable--member--clusters--localcluster--default--mortgage-app-svc--service--mortgage-app-svc',
        type: 'service',
        label: 'mortgage-app-↵svc',
        compactLabel: 'mortgage-app-↵svc',
        nodeIcons: {
          status: {
            icon: 'failure',
            classType: 'failure',
            width: 16,
            height: 16,
            dx: 16,
          },
        },
        nodeStatus: '',
        isDisabled: false,
        title: '',
        description: '',
        tooltips: [
          {
            name: 'Service',
            value: 'mortgage-app-svc',
            href: "/multicloud/search?filters={'textsearch':'kind:service name:mortgage-app-svc'}",
          },
        ],
        x: 1.5,
        y: 481.5,
        section: { name: 'preset', hashCode: 872479835, x: 0, y: 0 },
      },
    },
  ],
}

const mockNodeDetails = jest.fn()
mockNodeDetails.mockReturnValue(mockDetails.details)
const mockLayoutNodes = jest.fn()
mockLayoutNodes.mockReturnValue(mockLaidoutNodes.laidoutNodes)
const mockData = {
  locale: 'en-US',
  handleClose: jest.fn(),
  staticResourceData: {
    diagramCloneTypes: ['internet', 'host'],
    shapeTypeOrder: [
      'internet',
      'host',
      'service',
      'deployment',
      'daemonset',
      'statefulset',
      'cronjob',
      'pod',
      'container',
    ],
    typeToShapeMap: {
      application: {
        shape: 'application',
        className: 'design',
        nodeRadius: 30,
      },
      deployable: { shape: 'deployable', className: 'design' },
      subscription: { shape: 'subscription', className: 'design' },
      rules: { shape: 'placements', className: 'design' },
      clusters: { shape: 'cluster', className: 'container' },
      helmrelease: { shape: 'chart', className: 'container' },
      package: { shape: 'chart', className: 'container' },
      internet: { shape: 'cloud', className: 'internet' },
      host: { shape: 'host', className: 'host' },
      policy: { shape: 'roundedSq', className: 'design', nodeRadius: 30 },
      placement: { shape: 'placement', className: 'design' },
      cluster: { shape: 'cluster', className: 'container' },
      service: { shape: 'service', className: 'service' },
      deployment: { shape: 'deployment', className: 'deployment' },
      daemonset: { shape: 'star4', className: 'daemonset' },
      statefulset: { shape: 'cylinder', className: 'statefulset' },
      pod: { shape: 'pod', className: 'pod' },
      container: { shape: 'irregularHexagon', className: 'container' },
      cronjob: { shape: 'clock', className: 'default' },
      spare1: { shape: 'star4', className: 'daemonset' },
      spare2: { shape: 'roundedSq', className: 'daemonset' },
      spare3: { shape: 'hexagon', className: 'daemonset' },
      spare4: { shape: 'irregularHexagon', className: 'daemonset' },
      spare5: { shape: 'roundedRect', className: 'daemonset' },
    },
    diagramOptions: {
      filtering: 'application',
      layout: 'application',
      showLineLabels: true,
      showGroupTitles: false,
      scrollOnScroll: true,
    },
    getNodeDetails: mockNodeDetails,
  },
  selectedNodeId:
    'member--pod--member--deployable--member--clusters--localcluster--default--mortgage-app-deployable--mortgage-app-deploy',
  processActionLink: jest.fn(),
}

const clusterSelectedNodeId = 'member--clusters--localcluster'

class MockViewContainer2 {
  getBoundingClientRect() {
    return { height: 667 }
  }
}

const viewContainer2 = jest.fn()
viewContainer2.mockReturnValue(new MockViewContainer2())

describe('DetailsView 1 pod details', () => {
  beforeEach(async () => {
    render(
      <DetailsView
        onClose={mockData.handleClose}
        getLayoutNodes={mockLayoutNodes}
        selectedNodeId={clusterSelectedNodeId}
        getViewContainer={viewContainer2}
        processActionLink={mockData.processActionLink}
        nodes={mockLaidoutNodes.laidoutNodes}
        t={t}
        options={mockData.staticResourceData}
      />
    )

    await waitForText('Cluster')
  })

  it('render as expected', () => {
    expect(screen.getByText('deployment')).toBeTruthy()
  })
})
