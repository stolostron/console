/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

import { AcmLabels } from './AcmLabels'

describe('AcmLabels', () => {
  test('renders empty with undefined', () => {
    const { container } = render(<AcmLabels labels={undefined} />)
    expect(container).toMatchInlineSnapshot('<div />')
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
    expect(container.querySelector('.pf-v5-c-label')).toBeNull()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmLabels labels={['foo=bar', 'cluster=management']} />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders with collapsed labels', () => {
    const { getByText } = render(
      <AcmLabels labels={{ foo: 'bar', cluster: 'management', empty: '' }} collapse={['cluster', 'empty']} />
    )
    expect(getByText('foo=bar')).toBeInTheDocument()
    getByText('2 more').click()
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
    expect(getByText('empty')).toBeInTheDocument()
    getByText('Show less').click()
    expect(getByText('2 more')).toBeInTheDocument()
  })
  test('renders with empty text', () => {
    const { getByText } = render(
      <AcmLabels labels={{ cluster: 'management' }} collapse={['cluster']} allCollapsedText="EMPTY" />
    )
    expect(getByText('EMPTY')).toBeInTheDocument()
    getByText('EMPTY').click()
    expect(getByText('cluster=management')).toBeInstanceOf(HTMLSpanElement)
  })
})
