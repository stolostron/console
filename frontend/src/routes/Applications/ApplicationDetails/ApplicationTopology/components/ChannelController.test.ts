/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChannelController from './ChannelControl'
import {
  MockChannelControlData,
  MockTranslationFunction,
  MockSetDrawerContent,
} from '../model/types'

/**
 * Mock translation function that returns the input string as-is
 * Used to simulate internationalization in test environment
 */
const t: MockTranslationFunction = (string: string): string => {
  return string
}

/**
 * Mock channel control data with no available channels
 * Tests the component behavior when no subscription channels are available
 */
const channelControllerNoAllChannels: MockChannelControlData = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [],
}

/**
 * Mock channel control data with multiple channels including the "All" channel
 * Tests standard multi-channel subscription scenarios
 */
const channelController: MockChannelControlData = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///cassandra-cassandra-service///mysql-wordpress-pd-wordpress-mysql-deployment',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///mysql-wordpress-pd-wordpress-mysql-service///staging-elasticsearch-elasticsearch-serviceaccount',
  ],
}

/**
 * Mock channel control data with a specific active channel (not "All")
 * Tests behavior when a specific subscription channel is selected
 */
const channelController2: MockChannelControlData = {
  activeChannel:
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///elasticsearch-es-replicationcontroller///persistent-volume-provisioning-glusterfs-heketi-secret-secret',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///mysql-wordpress-pd-wordpress-mysql-service///staging-elasticsearch-elasticsearch-serviceaccount',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///elasticsearch-es-replicationcontroller///persistent-volume-provisioning-glusterfs-heketi-secret-secret',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///persistent-volume-provisioning-glusterfs-slow-storageclass///spark-spark-gluster-spark-main-controller-replicationcontroller',
  ],
}

/**
 * Mock channel control data for nginx blue/green deployment scenario
 * Tests channel switching between different nginx subscription channels
 */
const channelController3: MockChannelControlData = {
  activeChannel: 'nginx-blue/blue-nginx-subscription//demo/gitops',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'nginx-blue/blue-nginx-subscription//demo/gitops',
    'nginx-blue/ingress-nginx-subscription-blue//demo/gitops',
  ],
}

/**
 * Mock channel control data with undefined active channel
 * Tests component initialization and default channel selection behavior
 */
const channelController4: MockChannelControlData = {
  activeChannel: undefined as any, // Explicitly testing undefined case
  isChangingChannel: false,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'helloworld-demo-ns/helloworld-demo-subscription-1//rhacm-nginx-app-channel/nginx-app-channel',
    'helloworld-demo-ns/helloworld-demo-subscription-2//multilevel-channel/multilevel-channel',
  ],
}

/**
 * Test suite for ChannelController component with no available channels
 * Verifies that the component renders correctly when no subscription channels exist
 */
describe('ChannelController with noAllChannels', () => {
  let container: HTMLElement

  beforeEach(async () => {
    // Render the ChannelController component with empty channels array
    ;({ container } = render(<ChannelController channelControl={channelControllerNoAllChannels} t={t} />))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should render subscriptions text when no channels are available', () => {
    // Verify that the "Subscriptions" label is displayed
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

/**
 * Test suite for ChannelController component with standard channel configuration
 * Tests the default behavior with multiple channels including "All Subscriptions"
 */
describe('ChannelController components 1', () => {
  let container: HTMLElement

  beforeEach(async () => {
    // Render the ChannelController with standard multi-channel configuration
    ;({ container } = render(<ChannelController channelControl={channelController} t={t} />))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should display "all subscriptions" text when all channels are selected', () => {
    // Verify that "all subscriptions" text is shown when the "All" channel is active
    expect(screen.getByText(/all subscriptions/i)).toBeTruthy()
  })
})

/**
 * Test suite for ChannelController component with specific channel selected
 * Tests behavior when a non-"All" subscription channel is active
 */
describe('ChannelController components 2', () => {
  let container: HTMLElement

  beforeEach(async () => {
    // Render the ChannelController with a specific channel selected
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should render subscriptions text for specific channel selection', () => {
    // Verify that the "Subscriptions" label is displayed
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

/**
 * Test suite for ChannelController pagination functionality
 * Tests user interactions with pagination controls for multi-page subscriptions
 */
describe('ChannelController components 2.2 - Pagination Tests', () => {
  let container: HTMLElement

  beforeEach(async () => {
    // Render the ChannelController with pagination-enabled configuration
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should handle pagination control interactions', () => {
    // Test first page button interaction
    const firstPageButton = container.querySelector(`button[aria-label="Go to first page"]`)
    if (firstPageButton) {
      userEvent.click(firstPageButton)
      userEvent.type(firstPageButton, '{enter}')
    }

    // Test previous page button interaction
    const prevPageButton = container.querySelector(`button[aria-label="Go to previous page"]`)
    if (prevPageButton) {
      userEvent.click(prevPageButton)
      userEvent.type(prevPageButton, '{enter}')
    }

    // Test next page button interaction
    const nextPageButton = container.querySelector(`button[aria-label="Go to next page"]`)
    if (nextPageButton) {
      userEvent.click(nextPageButton)
      userEvent.type(nextPageButton, '{enter}')
    }

    // Test last page button interaction
    const lastPageButton = container.querySelector(`button[aria-label="Go to last page"]`)
    if (lastPageButton) {
      userEvent.click(lastPageButton)
      userEvent.type(lastPageButton, '{enter}')
    }

    // Test page input field interaction
    const pageInput = container.querySelector(`.pf-v5-c-form-control`)
    if (pageInput) {
      userEvent.click(pageInput)
      userEvent.type(pageInput, '{enter}')
    }
  })
})

/**
 * Test suite for ChannelController with nginx blue/green deployment scenario
 * Tests channel switching functionality between different subscription channels
 */
describe('ChannelController components 3 - Channel Switching', () => {
  let container: HTMLElement
  const mockSetDrawerContent: MockSetDrawerContent = jest.fn()

  beforeEach(async () => {
    // Render the ChannelController with drawer content setter for channel switching
    ;({ container } = render(
      <ChannelController channelControl={channelController3} t={t} setDrawerContent={mockSetDrawerContent} />
    ))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should handle channel switching between nginx subscriptions', () => {
    // Test clicking on blue-nginx-subscription channel
    const blueNginxElement = screen.getByText(/blue-nginx-subscription/i)
    userEvent.click(blueNginxElement)

    // Test clicking on ingress-nginx-subscription-blue channel
    const ingressNginxElement = screen.getByText(/ingress-nginx-subscription-blue/i)
    userEvent.click(ingressNginxElement)

    // Verify that the ingress-nginx-subscription-blue element is present
    expect(screen.getByText(/ingress-nginx-subscription-blue/i)).toBeTruthy()
  })
})

/**
 * Test suite for ChannelController with undefined active channel
 * Tests component behavior during initialization and default channel selection
 */
describe('ChannelController components 4 - Undefined Active Channel', () => {
  let container: HTMLElement
  const mockSetDrawerContent: MockSetDrawerContent = jest.fn()

  beforeEach(async () => {
    // Render the ChannelController with undefined active channel
    ;({ container } = render(
      <ChannelController channelControl={channelController4} t={t} setDrawerContent={mockSetDrawerContent} />
    ))

    // Wait for the channel combo button to be rendered
    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('should handle channel switching with helloworld demo subscriptions', () => {
    // Test clicking on helloworld-demo-subscription-1 channel
    const subscription1Element = screen.getByText(/helloworld-demo-subscription-1/i)
    userEvent.click(subscription1Element)

    // Test clicking on helloworld-demo-subscription-2 channel
    const subscription2Element = screen.getByText(/helloworld-demo-subscription-2/i)
    userEvent.click(subscription2Element)

    // Verify that the helloworld-demo-subscription-2 element is present
    expect(screen.getByText(/helloworld-demo-subscription-2/i)).toBeTruthy()
  })
})
