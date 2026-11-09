/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ClusterLocationLine } from './ClusterLocation'

describe('ClusterLocationLine', () => {
  it('renders region and zone joined by a separator', async () => {
    const { container } = render(<ClusterLocationLine labels={{ region: 'USW1', zone: 'USW1B' }} />)
    expect(screen.getByText('USW1 · USW1B')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders only the zone without a stray separator', () => {
    render(<ClusterLocationLine labels={{ zone: 'USW1B' }} />)
    expect(screen.getByText('USW1B')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('renders only the region without a stray separator', () => {
    render(<ClusterLocationLine labels={{ 'topology.kubernetes.io/region': 'us-east-1' }} />)
    expect(screen.getByText('us-east-1')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('renders the datacenter icon with an accessible label containing the value', async () => {
    const { container } = render(<ClusterLocationLine labels={{ datacenter: 'DC-East' }} />)
    expect(screen.getByLabelText('Datacenter: DC-East')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders region, zone and datacenter together', () => {
    render(<ClusterLocationLine labels={{ region: 'USW1', zone: 'USW1B', datacenter: 'DC-East' }} />)
    expect(screen.getByText('USW1 · USW1B')).toBeInTheDocument()
    expect(screen.getByLabelText('Datacenter: DC-East')).toBeInTheDocument()
  })

  it('renders nothing when there is no data', () => {
    const { container } = render(<ClusterLocationLine />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when labels are empty strings', () => {
    const { container } = render(<ClusterLocationLine labels={{ region: '', zone: '', datacenter: '' }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
