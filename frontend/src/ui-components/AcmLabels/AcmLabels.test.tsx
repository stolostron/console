/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

import { AcmLabels } from './AcmLabels'
import { clickElement } from '~/lib/test-util'

describe('AcmLabels', () => {
  test('renders empty with undefined', () => {
    const { container } = render(<AcmLabels labels={undefined} />)
    expect(container).toMatchInlineSnapshot(`
<div>
  <div>
    -
  </div>
</div>
`)
  })
  test('renders with string array', () => {
    const { getByText } = render(<AcmLabels labels={['foo=bar', 'cluster=management', 'test=']} />)
    expect(getByText('foo=bar')).toBeInTheDocument()
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
    expect(getByText('test')).toBeInstanceOf(HTMLSpanElement)
  })
  test('renders with object', () => {
    const { getByText } = render(<AcmLabels labels={{ foo: 'bar', cluster: 'management', empty: '' }} />)
    expect(getByText('foo=bar')).toBeInTheDocument()
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
    expect(getByText('empty')).toBeInTheDocument()
  })
  test('returns null when no labels are provided', () => {
    const { container } = render(<AcmLabels labels={[]} />)
    expect(container.querySelector('.pf-v6-c-label')).toBeNull()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmLabels labels={['foo=bar', 'cluster=management']} />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders with collapsed labels', async () => {
    const { getByText } = render(
      <AcmLabels labels={{ foo: 'bar', cluster: 'management', empty: '' }} collapse={['cluster', 'empty']} />
    )
    expect(getByText('foo=bar')).toBeInTheDocument()
    await clickElement(getByText('2 more'))
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
    expect(getByText('empty')).toBeInTheDocument()
    await clickElement(getByText('Show less'))
    expect(getByText('2 more')).toBeInTheDocument()
  })
  test('renders with empty text', async () => {
    const { getByText } = render(
      <AcmLabels labels={{ cluster: 'management' }} collapse={['cluster']} allCollapsedText="EMPTY" />
    )
    expect(getByText('EMPTY')).toBeInTheDocument()
    await clickElement(getByText('EMPTY'))
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
  })
})
