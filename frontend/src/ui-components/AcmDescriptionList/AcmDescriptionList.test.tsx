/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmDescriptionList, ListItems } from './AcmDescriptionList'

describe('AcmDescriptionList', () => {
  const leftItems = [
    { key: 'Name', value: 'cluster' },
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    { key: 'Status', keyAction: <a id="link">Link</a>, value: 'Ready' },
  ]
  const rightItems = [
    { key: 'Namespace', value: 'cluster-namespace' },
    { key: 'Console URL', value: undefined },
  ]
  const allItems = [...leftItems, ...rightItems]
  const DescriptionList = (props: { leftItems: ListItems[]; rightItems?: ListItems[]; id?: string }) => (
    <AcmDescriptionList title="Details" leftItems={props.leftItems} rightItems={props.rightItems} id={props.id} />
  )
  test('renders', () => {
    const { queryByText, getByRole } = render(
      <DescriptionList leftItems={leftItems} rightItems={rightItems} id="test1" />
    )
    expect(queryByText('Details')).toBeInTheDocument()
    expect(queryByText('Name')).toBeInTheDocument()
    expect(queryByText('Namespace')).toBeInTheDocument()
    userEvent.click(getByRole('button'))
    expect(queryByText('Name')).toBeNull()
  })
  test('renders if only given left items', () => {
    const { queryByText, getByRole } = render(<DescriptionList leftItems={allItems} id="test2" />)
    expect(queryByText('Details')).toBeInTheDocument()
    expect(queryByText('Name')).toBeInTheDocument()
    expect(queryByText('Namespace')).toBeInTheDocument()
    userEvent.click(getByRole('button'))
    expect(queryByText('Name')).toBeNull()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<DescriptionList leftItems={leftItems} rightItems={rightItems} id="test3" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
