/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelComboBox from './ControlPanelComboBox'
import { render, waitFor, screen } from '@testing-library/react'
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
    availableMap: {
      'm5.large - 2 vCPU, 8 GiB RAM - General Purpose': 'm5.large',
      'm5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose': 'm5.xlarge',
      'm5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose': 'm5.2xlarge',
      'm5.4xlarge - 16 vCPU, 64 GiB RAM - General Purpose': 'm5.4xlarge',
      'm5.10xlarge - 40 vCPU, 160 GiB RAM - General Purpose': 'm5.10xlarge',
      'm5.16xlarge - 64 vCPU, 256 GiB RAM - General Purpose': 'm5.16xlarge',
    },
    validation: {
      constraint: '[A-Za-z0-9.]+',
      notification: 'creation.ocp.cluster.valid.alphanumeric.period',
      required: false,
      tester: /^[A-Za-z0-9.]+$/,
    },
    cacheUserValueKey: 'create.cluster.master.type',
    hasValueDescription: true,
    isInitialized: true,
  },
  handleControlChange: jest.fn(),
  i18n: t,
}

const propsMulti = {
  controlId: 'placementcombo',
  control: {
    name: 'Placement',
    placeholder: 'Select an existing placement configuration',
    available: ['test-placement-1', 'prod-placement'],
    active: '',
    availableInfo: {
      'test-placement-1': 'test-placement-1 deploys only to local cluster',
      'prod-placement': 'prod-placement clusters matching env=production',
    },
  },
  handleControlChange: jest.fn(),
  i18n: t,
}

describe('ControlPanelComboBox component', () => {
  it('renders without errors', () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('opens dropdown and shows options', async () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      expect(screen.getByText(/m5\.large - 2 vCPU, 8 GiB RAM - General Purpose/i)).toBeInTheDocument()
      expect(screen.getByText(/m5\.16xlarge - 64 vCPU, 256 GiB RAM - General Purpose/i)).toBeInTheDocument()
    })
  })

  it('selects item from dropdown', async () => {
    const handleChange = jest.fn()
    render(<ControlPanelComboBox {...propsPlain} handleControlChange={handleChange} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const option = screen.getByText('m5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose')
      userEvent.click(option)
    })

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled()
    })
  })

  it('filters options when typing', async () => {
    render(<ControlPanelComboBox {...propsPlain} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(6)
    })

    const inputs = screen.getAllByRole('combobox')
    const input = inputs.find((el) => el.type === 'text') || inputs[0]
    userEvent.type(input, '256')

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options.length).toBeLessThan(6)
    })
  })

  it('clears selection', async () => {
    const handleChange = jest.fn()
    render(<ControlPanelComboBox {...propsPlain} handleControlChange={handleChange} />)

    const clearButton = screen.getByRole('button', { name: /clear/i })
    userEvent.click(clearButton)

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled()
    })
  })

  it('removes duplicates from available list', async () => {
    const propsWithDuplicates = {
      ...propsPlain,
      control: {
        ...propsPlain.control,
        available: [
          'm5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose',
          'm5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose',
          'm5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose',
        ],
        active: '',
      },
    }
    render(<ControlPanelComboBox {...propsWithDuplicates} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(2)
    })
  })

  it('shows loading state', () => {
    const propsLoading = {
      ...propsPlain,
      control: {
        ...propsPlain.control,
        isLoading: true,
      },
    }
    render(<ControlPanelComboBox {...propsLoading} />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('handles empty available list', () => {
    const propsEmpty = {
      ...propsPlain,
      control: {
        ...propsPlain.control,
        available: [],
        active: '',
      },
    }
    render(<ControlPanelComboBox {...propsEmpty} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    expect(toggle).toBeInTheDocument()
  })

  it('commits custom input on enter when there are no options', async () => {
    const handleChange = jest.fn()
    const control = {
      ...propsPlain.control,
      id: 'githubPath',
      active: '',
      available: [],
      placeholder: 'Enter path',
    }
    render(
      <ControlPanelComboBox
        {...propsPlain}
        controlId="githubPath"
        control={control}
        handleControlChange={handleChange}
      />
    )

    const input = screen.getByTestId('githubPath')
    userEvent.type(input, 'test-path{enter}')

    await waitFor(() => {
      expect(control.active).toBe('test-path')
      expect(handleChange).toHaveBeenCalled()
    })
  })

  it('converts full value to short value when selecting', async () => {
    const handleChange = jest.fn()
    const control = {
      ...propsPlain.control,
      active: 'm5.xlarge',
    }
    render(<ControlPanelComboBox {...propsPlain} control={control} handleControlChange={handleChange} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const option = screen.getByText('m5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose')
      userEvent.click(option)
    })

    await waitFor(() => {
      expect(control.active).toBe('m5.2xlarge')
      expect(control.active).not.toBe('m5.2xlarge - 8 vCPU, 32 GiB RAM - General Purpose') // not full ✓
    })
  })

  it('displays full value from short active value', async () => {
    const control = {
      ...propsPlain.control,
      active: 'm5.xlarge',
    }
    render(<ControlPanelComboBox {...propsPlain} control={control} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const option = screen.getByText('m5.xlarge - 4 vCPU, 16 GiB RAM - General Purpose')
      expect(option).toBeInTheDocument()
    })
  })

  it('displays availableInfo descriptions for options', async () => {
    render(<ControlPanelComboBox {...propsMulti} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      expect(screen.getByText('test-placement-1')).toBeInTheDocument()
      expect(screen.getByText('prod-placement')).toBeInTheDocument()
    })

    expect(screen.getByText((content) => content.includes('deploys only to local cluster'))).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('clusters matching env=production'))).toBeInTheDocument()
  })

  it('selects placement with availableInfo', async () => {
    const handleChange = jest.fn()
    render(<ControlPanelComboBox {...propsMulti} handleControlChange={handleChange} />)

    const toggle = screen.getByRole('button', { name: /menu toggle/i })
    userEvent.click(toggle)

    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(0)
    })

    const options = screen.getAllByRole('option')
    userEvent.click(options[0])

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled()
    })
  })
})
