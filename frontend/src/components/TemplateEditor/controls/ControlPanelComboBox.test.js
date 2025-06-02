/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelComboBox from './ControlPanelComboBox'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'

const t = i18n.t.bind(i18n)

const propsPlain = {
  controlId: 'masterType',
  control: {
    name: 'Instance type',
    tooltip: 'The EC2 instance type for your compute machines.',
    learnMore: 'https://aws.amazon.com/ec2/instance-types/',
    id: 'masterType',
    type: 'combobox',
    available: [
      'm5.10xlarge - 40 vCPU, 160 GiB RAM - General Purpose',
      'm5.16xlarge - 64 vCPU, 256 GiB RAM - General Purpose',
      'm5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose',
      'm5.4xlarge - 16 vCPU, 64 GiB RAM - General Purpose',
      'm5.large - 2 vCPU, 8 GiB RAM - General Purpose',
      'm5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose',
    ],
    active: 'm5.xlarge',
    validation: {
      constraint: '[A-Za-z0-9.]+',
      notification: 'creation.ocp.cluster.valid.alphanumeric.period',
      required: false,
      tester: /^[A-Za-z0-9.]+$/,
    },
    cacheUserValueKey: 'create.cluster.master.type',
    availableMap: {
      'm5.large - 2 vCPU, 8 GiB RAM - General Purpose': 'm5.large',
      'm5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose': 'm5.xlarge',
      'm5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose': 'm5.2xlarge',
      'm5.4xlarge - 16 vCPU, 64 GiB RAM - General Purpose': 'm5.4xlarge',
      'm5.10xlarge - 40 vCPU, 160 GiB RAM - General Purpose': 'm5.10xlarge',
      'm5.16xlarge - 64 vCPU, 256 GiB RAM - General Purpose': 'm5.16xlarge',
    },
    fetchAvailable: {
      setAvailableMap: jest.fn(),
    },
    hasValueDescription: true,
    isInitialized: true,
  },
  handleControlChange: jest.fn(),
  i18n: t,
}

const propsMulti = {
  controlId: 'placementrulecombo',
  control: {
    id: 'placementrulecombo',
    type: 'combobox',
    opaque: false,
    placeholder: 'Select an existing placement configuration',
    validation: {},
    isInitialized: true,
    forceUpdate: [Function],
    setActive: [Function],
    isLoading: false,
    available: ['test-placement-1'],
    fetchAvailable: jest.fn(),
    availableData: {
      'test-placement-1': {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'PlacementRule',
        metadata: [Object],
        spec: [Object],
        status: [Object],
      },
    },
    controlId: 'placementrulecombo',
    isLoaded: true,
    availableInfo: { 'test-placement-1': 'test-placement-1 deploys only to local cluster' },
    info: '',
  },
  handleControlChange: jest.fn(),
  i18n: t,
}

describe('ControlPanelComboBox component', () => {
  it('basic combo', async () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const input = screen.getByRole('combobox', {
      name: /Instance type/i,
    })
    // select item
    expect(input).toHaveValue('m5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose')
    userEvent.click(input)
    userEvent.click(screen.getByText(/m5\.2xlarge - 8 vcpu, 32 gib ram - general purpose/i))
    expect(input).toHaveValue('m5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose')

    // clear
    userEvent.click(
      screen.getByRole('button', {
        name: /clear selected item/i,
      })
    )
    expect(input).toHaveValue('')

    // enter new item
    userEvent.click(input)
    userEvent.type(input, 'hello{enter}')
    expect(input).toHaveValue('hello')

    // key events
    userEvent.click(input)
    userEvent.type(input, 'hello2')
    userEvent.tab()
    userEvent.click(input)
    userEvent.type(input, '{esc}')
    expect(input).toHaveValue('')
  })

  it('searching', async () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const input = screen.getByRole('combobox', {
      name: /Instance type/i,
    })
    // search
    userEvent.type(input, '256')
    userEvent.click(screen.getByText(/m5\.16xlarge - 64 vcpu, gib ram - general purpose/i))
    expect(input).toHaveValue('m5.16xlarge - 64 vCPU, 256 GiB RAM - General Purpose')
  })

  it('editing', async () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const input = screen.getByRole('combobox', {
      name: /Instance type/i,
    })

    // edit
    fireEvent(
      input,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        x: 100,
        y: 0,
      })
    )
    userEvent.type(input, 'x')
    await waitFor(() => expect(input).toHaveValue('m5.16xlarge'))
  })

  it('selection with description', async () => {
    render(<ControlPanelComboBox {...propsMulti} />)

    const input = screen.getByRole('combobox', {
      name: /Options menu/i,
    })

    userEvent.click(input)
    userEvent.click(screen.getByText(/test-placement-1 deploys only to local cluster/i))
    expect(input).toHaveValue('test-placement-1')
  })

  it('keyboard', async () => {
    render(<ControlPanelComboBox {...propsMulti} />)

    const input = screen.getByRole('combobox', {
      name: /Options menu/i,
    })
    userEvent.click(input)
    userEvent.type(screen.getByText(/test-placement-1 deploys only to local cluster/i), '{enter}')
    expect(input).toHaveValue('test-placement-1')
  })
})
