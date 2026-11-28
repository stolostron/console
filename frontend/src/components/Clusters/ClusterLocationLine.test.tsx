/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ClusterLocationLine } from './ClusterLocationLine'

describe('ClusterLocationLine', () => {
  it('renders region and zone joined by a separator', async () => {
    const { container } = render(<ClusterLocationLine location={{ region: 'USW1', zone: 'USW1B' }} />)
    expect(screen.getByText('USW1 · USW1B')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders only the zone without a stray separator', () => {
    render(<ClusterLocationLine location={{ zone: 'USW1B' }} />)
    expect(screen.getByText('USW1B')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('renders only the region without a stray separator', () => {
    render(<ClusterLocationLine location={{ region: 'us-east-1' }} />)
    expect(screen.getByText('us-east-1')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })

  it('renders the datacenter icon with an accessible label containing the value', async () => {
    const { container } = render(<ClusterLocationLine location={{ datacenter: 'DC-East' }} />)
    expect(screen.getByLabelText('Datacenter: DC-East')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders region, zone and datacenter together', () => {
    render(<ClusterLocationLine location={{ region: 'USW1', zone: 'USW1B', datacenter: 'DC-East' }} />)
    expect(screen.getByText('USW1 · USW1B')).toBeInTheDocument()
    expect(screen.getByLabelText('Datacenter: DC-East')).toBeInTheDocument()
  })

  it('renders nothing when there is no data', () => {
    const { container } = render(<ClusterLocationLine location={{}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when labels are empty strings', () => {
    const { container } = render(<ClusterLocationLine location={{ region: '', zone: '', datacenter: '' }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
