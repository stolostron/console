/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useContext } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmPage, AcmPageHeader, AcmPageCard, AcmBreadcrumb, AcmPageContent } from './AcmPage'
import { AcmButton } from '../AcmButton/AcmButton'
import { AcmAlertContext } from '../AcmAlert/AcmAlert'

describe('AcmPage', () => {
  test('AcmPage renders', () => {
    const { getByText } = render(<AcmPage header={<div />}>ACM page</AcmPage>)
    expect(getByText('ACM page')).toBeInTheDocument()
    expect(getByText('ACM page')).toBeInstanceOf(HTMLElement)
  })
  test('AcmPage has zero accessibility defects', async () => {
    const { container } = render(<AcmPage header={<div />}>ACM page</AcmPage>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AcmPageHeader', () => {
  test('AcmPageHeader renders', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AcmPageHeader
          breadcrumb={[{ text: 'text', to: 'to' }]}
          title="title"
          titleTooltip="tooltip for title"
          description="description"
          navigation="navigation"
          controls="controls"
          switches="switches"
          actions="actions"
          label="label"
          labelColor="red"
        />
      </MemoryRouter>
    )
    expect(getByText('text')).toBeInTheDocument()
    expect(getByText('title')).toBeInTheDocument()
    expect(getByText('title')).toBeInstanceOf(HTMLHeadingElement)
    expect(getByText('description')).toBeInTheDocument()
    expect(getByText('navigation')).toBeInTheDocument()
    expect(getByText('controls')).toBeInTheDocument()
    expect(getByText('switches')).toBeInTheDocument()
    expect(getByText('actions')).toBeInTheDocument()
  })

  test('AcmPageHeader can render page switches and actions', () => {
    const { getByText } = render(
      <AcmPageHeader
        breadcrumb={[]}
        title="ACM header"
        switches={<AcmButton>Switch action</AcmButton>}
        actions={<AcmButton>Create resource</AcmButton>}
      />
    )
    expect(getByText('Switch action')).toBeInTheDocument()
    expect(getByText('Create resource')).toBeInTheDocument()
  })

  test('AcmPageHeader renders with search link', () => {
    const { getByText } = render(<AcmPageHeader breadcrumb={[]} title="ACM header" searchbar={<div>{'Search'}</div>} />)
    expect(getByText('Search')).toBeInTheDocument()
  })

  test('AcmPageHeader has zero accessibility defects', async () => {
    const { container } = render(<AcmPageHeader title="ACM header" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AcmPageCard', () => {
  test('AcmPageCard renders', () => {
    const { getByText } = render(<AcmPageCard>ACM card</AcmPageCard>)
    expect(getByText('ACM card')).toBeInTheDocument()
    expect(getByText('ACM card')).toBeInstanceOf(HTMLDivElement)
  })

  test('AcmPageCard has zero accessibility defects', async () => {
    const { container } = render(<AcmPageCard>ACM card</AcmPageCard>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AcmBreadcrumb', () => {
  test('AcmBreadcrumb renders', () => {
    const { getByText, container } = render(
      <MemoryRouter>
        <AcmBreadcrumb
          breadcrumb={[
            { text: 'First', to: '/first' },
            { text: 'Second', to: '/second' },
          ]}
        />
      </MemoryRouter>
    )
    expect(getByText('First')).toBeInTheDocument()
    expect(getByText('First')).toBeInstanceOf(HTMLAnchorElement)
    expect(container.querySelector('[aria-current="page"]')).toContainHTML('Second') // verify last crumb is disabled
  })

  test('AcmBreadcrumb renders null when no breadcrumbs are provided', () => {
    const { container } = render(
      <MemoryRouter>
        <AcmBreadcrumb breadcrumb={[]} />
      </MemoryRouter>
    )
    expect(container).toMatchInlineSnapshot('<div />')
  })

  test('AcmBreadcrumb renders null when no breadcrumbs', () => {
    const { container } = render(
      <MemoryRouter>
        <AcmBreadcrumb />
      </MemoryRouter>
    )
    expect(container).toMatchInlineSnapshot('<div />')
  })

  test('AcmBreadcrumb should not disable a single breadcrumb', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AcmBreadcrumb breadcrumb={[{ text: 'First', to: '/first' }]} />
      </MemoryRouter>
    )
    expect(getByText('First')).not.toHaveAttribute('aria-current')
  })

  test('AcmBreadcrumb has zero accessibility defects', async () => {
    const { container } = render(
      <MemoryRouter>
        <AcmBreadcrumb
          breadcrumb={[
            { text: 'First', to: '/first' },
            { text: 'Second', to: '/second' },
          ]}
        />
      </MemoryRouter>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('AcmPageContent', () => {
  test('AcmPageContent renders', () => {
    const { getByText } = render(
      <AcmPage header={<AcmPageHeader title="Title" />}>
        <AcmPageContent id="page">Content goes here</AcmPageContent>
      </AcmPage>
    )
    expect(getByText('Content goes here')).toBeInTheDocument()
  })

  test('AcmPageContent renders alerts', async () => {
    function Content() {
      const alertContext = useContext(AcmAlertContext)
      alertContext.addAlert({ title: 'Alert title' })
      return <Fragment />
    }

    const { getByText } = render(
      <AcmPage header={<AcmPageHeader title="Title" />}>
        <AcmPageContent id="page">
          <Content />
        </AcmPageContent>
      </AcmPage>
    )
    waitFor(() => expect(getByText('Alert title')).toBeInTheDocument())
  })
})
