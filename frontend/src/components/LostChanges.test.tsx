/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { clickByRole, waitForNotText, waitForText } from '../lib/test-util'
import { LostChangesContext, LostChangesPrompt, LostChangesProvider } from './LostChanges'
import { Button } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { MemoryRouter, Route, useHistory } from 'react-router-dom'

const originalData = 'originalData'
const innerDiscard = jest.fn()

const InnerForm = () => {
  const [dirty, setDirty] = useState(false)
  const { cancelForm } = useContext(LostChangesContext)
  return (
    <>
      <LostChangesPrompt isNested dirty={dirty} />
      <Button onClick={() => setDirty(true)}>Inner Dirty</Button>
      <Button onClick={() => setDirty(false)}>Inner Clean</Button>
      <Button onClick={() => cancelForm(innerDiscard)}>Inner Discard</Button>
    </>
  )
}

const OuterForm = () => {
  const [data, setData] = useState(originalData)
  const history = useHistory()
  const { cancelForm, submitForm } = useContext(LostChangesContext)
  return (
    <>
      <LostChangesPrompt initialData={originalData} data={data} />
      <Button onClick={() => setData('changedData')}>Outer Dirty</Button>
      <Button onClick={() => setData(originalData)}>Outer Clean</Button>
      <Button
        onClick={() => {
          submitForm()
          history.push('/submitted')
        }}
      >
        Outer Submit
      </Button>
      <Button
        onClick={() => {
          cancelForm()
          history.push('/discarded')
        }}
      >
        Outer Discard
      </Button>
      <InnerForm />
    </>
  )
}

const TestLostChangesProvider = () => {
  return (
    <MemoryRouter initialEntries={['/form', '/discarded', '/submitted']}>
      <LostChangesProvider>
        <Route path={'/form'}>
          <OuterForm />
        </Route>
        <Route path={'/discarded'}>Form Discarded</Route>
        <Route path={'/submitted'}>Form Submitted</Route>
      </LostChangesProvider>
    </MemoryRouter>
  )
}

describe('LostChangesProvider', () => {
  it('does not block navigation for clean forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Inner Dirty' })
    await clickByRole('button', { name: 'Inner Clean' })
    await clickByRole('button', { name: 'Outer Discard' })
    await waitForText('Form Discarded')
  })
  it('blocks navigation for dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Outer Dirty' })
    await clickByRole('button', { name: 'Outer Discard' })
    await waitForText('Leave form?')
    await clickByRole('button', { name: 'Stay' })
    await waitForNotText('Leave form?')
  })
  it('blocks navigation for nested dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Inner Dirty' })
    await clickByRole('button', { name: 'Outer Discard' })
    await waitForText('Leave form?')
    await clickByRole('button', { name: 'Stay' })
    await waitForNotText('Leave form?')
  })
  it('blocks cancel for nested dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Inner Dirty' })
    await clickByRole('button', { name: 'Inner Discard' })
    await waitForText('Leave form?')
    await clickByRole('button', { name: 'Leave' })
    expect(innerDiscard).toHaveBeenCalledTimes(1)
  })
  it('blocks cancel for nested dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Inner Dirty' })
    await clickByRole('button', { name: 'Inner Discard' })
    await waitForText('Leave form?')
    await clickByRole('button', { name: 'Stay' })
    expect(innerDiscard).toHaveBeenCalledTimes(0)
  })
  it('does not block cancel for outer dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Outer Dirty' })
    await clickByRole('button', { name: 'Inner Discard' })
    expect(innerDiscard).toHaveBeenCalledTimes(1)
  })
  it('does not block submit for dirty forms', async () => {
    render(<TestLostChangesProvider />)
    await clickByRole('button', { name: 'Outer Dirty' })
    await clickByRole('button', { name: 'Inner Dirty' })
    await clickByRole('button', { name: 'Outer Submit' })
    await waitForText('Form Submitted')
  })
})
