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

const t = (string) => {
  return string
}

const channelControllerNoAllChannels = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [],
}

const channelController = {
  activeChannel: '__ALL__/__ALL__//__ALL__/__ALL__',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///cassandra-cassandra-service///mysql-wordpress-pd-wordpress-mysql-deployment',
    'default/guestbook-app//gbapp-ch/guestbook-app-latest///mysql-wordpress-pd-wordpress-mysql-service///staging-elasticsearch-elasticsearch-serviceaccount',
  ],
}

const channelController2 = {
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

const channelController3 = {
  activeChannel: 'nginx-blue/blue-nginx-subscription//demo/gitops',
  isChangingChannel: undefined,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'nginx-blue/blue-nginx-subscription//demo/gitops',
    'nginx-blue/ingress-nginx-subscription-blue//demo/gitops',
  ],
}

const channelController4 = {
  activeChannel: undefined,
  isChangingChannel: false,
  changeTheChannel: jest.fn,
  allChannels: [
    '__ALL__/__ALL__//__ALL__/__ALL__',
    'helloworld-demo-ns/helloworld-demo-subscription-1//rhacm-nginx-app-channel/nginx-app-channel',
    'helloworld-demo-ns/helloworld-demo-subscription-2//multilevel-channel/multilevel-channel',
  ],
}

describe('ChannelController with noAllChannels', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelControllerNoAllChannels} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('default', () => {
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

describe('ChannelController components 1', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })
  it('default', () => {
    expect(screen.getByText(/all subscriptions/i)).toBeTruthy()
  })
})

describe('ChannelController components 2', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 2', () => {
    expect(screen.getByText(/Subscriptions/)).toBeTruthy()
  })
})

describe('ChannelController components 2. 2', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(<ChannelController channelControl={channelController2} t={t} />))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 2 2', () => {
    userEvent.click(container.querySelector(`button[aria-label="Go to first page"]`))
    userEvent.type(container.querySelector(`button[aria-label="Go to first page"]`), '{enter}')

    userEvent.click(container.querySelector(`button[aria-label="Go to previous page"]`))
    userEvent.type(container.querySelector(`button[aria-label="Go to previous page"]`), '{enter}')

    userEvent.click(container.querySelector(`button[aria-label="Go to next page"]`))
    userEvent.type(container.querySelector(`button[aria-label="Go to next page"]`), '{enter}')

    userEvent.click(container.querySelector(`button[aria-label="Go to last page"]`))
    userEvent.type(container.querySelector(`button[aria-label="Go to last page"]`), '{enter}')

    userEvent.click(container.querySelector(`.pf-v5-c-form-control`))
    userEvent.type(container.querySelector(`.pf-v5-c-form-control`), '{enter}')
  })
})

describe('ChannelController components 3', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(
      <ChannelController channelControl={channelController3} t={t} setDrawerContent={jest.fn} />
    ))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 3', () => {
    userEvent.click(screen.getByText(/blue-nginx-subscription/i))
    userEvent.click(screen.getByText(/ingress-nginx-subscription-blue/i))
    expect(screen.getByText(/ingress-nginx-subscription-blue/i)).toBeTruthy()
  })
})

describe('ChannelController components 4', () => {
  let container
  beforeEach(async () => {
    ;({ container } = render(
      <ChannelController channelControl={channelController4} t={t} setDrawerContent={jest.fn} />
    ))

    await waitFor(() => container.querySelector(`button[id="comboChannel"]`))
  })

  it('ChannelController components 4', () => {
    userEvent.click(screen.getByText(/helloworld-demo-subscription-1/i))
    userEvent.click(screen.getByText(/helloworld-demo-subscription-2/i))
    expect(screen.getByText(/helloworld-demo-subscription-2/i)).toBeTruthy()
  })
})
