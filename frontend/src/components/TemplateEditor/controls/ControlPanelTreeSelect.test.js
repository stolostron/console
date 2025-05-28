/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelTreeSelect from './ControlPanelTreeSelect'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'

const t = i18n.t.bind(i18n)

const props = {
  controlId: 'workerType',
  control: {
    name: 'Instance type',
    tooltip: 'The GCP machine type.',
    learnMore: 'https://cloud.google.com/compute/docs/machine-types',
    id: 'workerType',
    type: 'treeselect',
    available: [
      {
        label: 'Compute Optimized',
        children: [
          { value: 'c2-standard-4', description: '4 vCPU, 16 GiB RAM - Compute Optimized' },
          { value: 'c2-standard-8', description: '8 vCPU, 32 GiB RAM - Compute Optimized' },
          { value: 'c2-standard-16', description: '16 vCPU, 64 GiB RAM - Compute Optimized' },
          { value: 'c2-standard-30', description: '30 vCPU, 120 GiB RAM - Compute Optimized' },
          { value: 'c2-standard-60', description: '60 vCPU, 240 GiB RAM - Compute Optimized' },
        ],
      },
      {
        label: 'Memory Optimized',
        children: [
          { value: 'm2-ultramem-2084', description: '208 vCPU, 5888 GiB RAM - Memory Optimized' },
          { value: 'm2-ultramem-4164', description: '416 vCPU, 11,776 GiB RAM - Memory Optimized' },
          { value: 'm1-ultramem-40', description: '40 vCPU, 961 GiB RAM - Memory Optimized' },
          { value: 'm1-ultramem-80', description: '80 vCPU, 1922 GiB RAM - Memory Optimized' },
          { value: 'm1-ultramem-160', description: '160 vCPU, 3844 GiB RAM - Memory Optimized' },
          { value: 'm1-megamem-96', description: '96 vCPU, 1433.6 GiB RAM - Memory Optimized' },
        ],
      },
    ],
    active: 'c2-standard-4',
    validation: {
      constraint: '[A-Za-z0-9-]+',
      notification: 'creation.ocp.cluster.valid.alphanumeric.period',
      required: false,
      tester: /^[A-Za-z0-9-]+$/,
    },
    cacheUserValueKey: 'create.cluster.worker.type',
    isInitialized: true,
    sourcePathMap: {
      'install-config': 'unknown[0].$synced.compute.$v[0].$v.platform.$v.gcp.$v.type.$v',
      '<<main>>': 'MachinePool[0].$synced.spec.$v.platform.$v.gcp.$v.type.$v',
    },
    controlId: 'workerType',
    availableMap: {
      'c2-standard-4': '4 vCPU, 16 GiB RAM - Compute Optimized',
      'c2-standard-8': '8 vCPU, 32 GiB RAM - Compute Optimized',
      'c2-standard-16': '16 vCPU, 64 GiB RAM - Compute Optimized',
      'c2-standard-30': '30 vCPU, 120 GiB RAM - Compute Optimized',
      'c2-standard-60': '60 vCPU, 240 GiB RAM - Compute Optimized',
      'm2-ultramem-2084': '208 vCPU, 5888 GiB RAM - Memory Optimized',
      'm2-ultramem-4164': '416 vCPU, 11,776 GiB RAM - Memory Optimized',
      'm1-ultramem-40': '40 vCPU, 961 GiB RAM - Memory Optimized',
      'm1-ultramem-80': '80 vCPU, 1922 GiB RAM - Memory Optimized',
      'm1-ultramem-160': '160 vCPU, 3844 GiB RAM - Memory Optimized',
      'm1-megamem-96': '96 vCPU, 1433.6 GiB RAM - Memory Optimized',
    },
  },
  handleChange: jest.fn(),
  i18n: t,
}

describe('ControlPanelTreeSelect component', () => {
  it('basic tree select', async () => {
    const propz = { ...props }
    const { rerender } = render(<ControlPanelTreeSelect {...propz} />)

    const input = screen.getByRole('combobox', {
      name: /Instance type/i,
    })
    // // select item
    expect(input).toHaveValue('c2-standard-4 - 4 vCPU, 16 GiB RAM - Compute Optimized')
    userEvent.click(input)
    userEvent.click(
      screen.getByRole('button', {
        name: /memory optimized/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /m2-ultramem-4164 - 416 vcpu, 11,776 gib ram - memory optimized/i,
      })
    )
    expect(input).toHaveValue('m2-ultramem-4164  # 416 vCPU, 11,776 GiB RAM - Memory Optimized')

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
    expect(propz.handleChange).toHaveBeenCalledWith({ selectedItem: 'hello' })
    propz.control.active = 'hello'
    rerender(<ControlPanelTreeSelect {...propz} />)
    expect(input).toHaveValue('hello')

    // key events
    userEvent.click(input)
    userEvent.tab()
    userEvent.click(input)
    userEvent.type(input, '{esc}')
    expect(input).toHaveValue('')
  })

  it('searching', async () => {
    render(<ControlPanelTreeSelect {...props} />)

    const input = screen.getByRole('combobox', {
      name: /Instance type/i,
    })
    // search
    userEvent.type(input, 'm2-ultramem-4164')
    userEvent.click(
      screen.getByRole('button', {
        name: /m2-ultramem-4164 - 416 vcpu, 11,776 gib ram - memory optimized/i,
      })
    )
    expect(input).toHaveValue('m2-ultramem-4164  # 416 vCPU, 11,776 GiB RAM - Memory Optimized')
  })
})
