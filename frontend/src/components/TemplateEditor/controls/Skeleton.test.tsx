/* Copyright Contributors to the Open Cluster Management project */

import Skeleton from './Skeleton'
import { render } from '@testing-library/react'

describe('Skeleton', () => {
  it('renders placeholder for a control', () => {
    const control = { id: 'sk1', name: 'Loading field' }
    const { container } = render(<Skeleton controlId="sk1" control={control} />)
    expect(container.querySelector('.creation-view-controls-skeleton')).toBeInTheDocument()
  })
})
