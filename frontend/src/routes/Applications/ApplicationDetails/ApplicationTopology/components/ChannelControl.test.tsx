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
import { t as t } from '~/lib/test-helpers'
import ChannelController from './ChannelControl'
import { MockChannelControlData, MockSetDrawerContent } from '../types'
import { clickElement, pressEnter } from '~/lib/test-util'

const channelControllerNoAllChannels: MockChannelControlData = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn(),
  allChannels: [],
}

const channelController: MockChannelControlData = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn(),
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///cassandra-cassandra-service///mysql-wordpress-pd-wordpress-mysql-deployment',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///mysql-wordpress-pd-wordpress-mysql-service///staging-elasticsearch-elasticsearch-serviceaccount',
  ],
}

const channelController2: MockChannelControlData = {
  activeChannel:
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///elasticsearch-es-replicationcontroller///persistent-volume-provisioning-glusterfs-heketi-secret-secret',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn(),
  allChannels: [
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///mysql-wordpress-pd-wordpress-mysql-service///staging-elasticsearch-elasticsearch-serviceaccount',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///elasticsearch-es-replicationcontroller///persistent-volume-provisioning-glusterfs-heketi-secret-secret',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///persistent-volume-provisioning-glusterfs-slow-storageclass///spark-spark-gluster-spark-main-controller-replicationcontroller',
  ],
}

const channelController3: MockChannelControlData = {
  activeChannel: 'nginx-blue/blue-nginx-subscription//demo/gitops',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn(),
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'nginx-blue/blue-nginx-subscription//demo/gitops',
    'nginx-blue/ingress-nginx-subscription-blue//demo/gitops',
  ],
}

const channelController4: MockChannelControlData = {
  activeChannel: '',
  isChangingChannel: false,
  changeTheChannel: jest.fn(),
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'helloworld-demo-ns/helloworld-demo-subscription-1//rhacm-nginx-app-channel/nginx-app-channel',
    'helloworld-demo-ns/helloworld-demo-subscription-2//multilevel-channel/multilevel-channel',
  ],
}

describe('ChannelController with noAllChannels', () => {
  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelControllerNoAllChannels} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('default', () => {
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

describe('ChannelController components 1', () => {
  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })
  it('default', () => {
    expect(screen.getByText(/all subscriptions/i)).toBeTruthy()
  })
})

describe('ChannelController components 2', () => {
  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 2', () => {
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

describe('ChannelController components 2. 2', () => {
  let container: HTMLElement
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 2 2', async () => {
    const firstPageButton = container.querySelector<HTMLElement>(`button[aria-label="Go to first page"]`)!
    await pressEnter(firstPageButton)

    const previousPageButton = container.querySelector<HTMLElement>(`button[aria-label="Go to previous page"]`)!
    await pressEnter(previousPageButton)

    const nextPageButton = container.querySelector<HTMLElement>(`button[aria-label="Go to next page"]`)!
    await pressEnter(nextPageButton)

    const lastPageButton = container.querySelector<HTMLElement>(`button[aria-label="Go to last page"]`)!
    await pressEnter(lastPageButton)

    const pageNumberInput = container.querySelector<HTMLElement>(`.pf-v6-c-form-control`)!
    await clickElement(pageNumberInput)
    await pressEnter(pageNumberInput)
  })
})

describe('ChannelController components 3', () => {
  let container: HTMLElement
  const setDrawerContent: MockSetDrawerContent = jest.fn()

  beforeEach(async () => {
    ;({ container } = render(
      <ChannelController channelControl={channelController3} t={t} setDrawerContent={setDrawerContent} />
    ))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 3', async () => {
    await clickElement(screen.getByText(/blue-nginx-subscription/i))
    await clickElement(screen.getByText(/ingress-nginx-subscription-blue/i))
    await waitFor(() =>
      expect(container.querySelector('#comboChannel')).toHaveTextContent('ingress-nginx-subscription-blue')
    )
  })
})

describe('ChannelController components 4', () => {
  let container: HTMLElement
  const setDrawerContent: MockSetDrawerContent = jest.fn()

  beforeEach(async () => {
    ;({ container } = render(
      <ChannelController channelControl={channelController4} t={t} setDrawerContent={setDrawerContent} />
    ))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 4', async () => {
    await clickElement(screen.getByText(/helloworld-demo-subscription-1/i))
    await clickElement(screen.getByText(/helloworld-demo-subscription-2/i))
    await waitFor(() =>
      expect(container.querySelector('#comboChannel')).toHaveTextContent('helloworld-demo-subscription-2')
    )
  })
})
