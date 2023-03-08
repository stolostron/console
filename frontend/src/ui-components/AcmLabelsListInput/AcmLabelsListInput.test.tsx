/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmLabelsListInput } from './AcmLabelsListInput'

describe('AcmLabelsListInput', () => {
  const LabelsListInput = () => {
    const [value, setValue] = useState<string | undefined>()
    return (
      <AcmLabelsListInput
        label="Label list input"
        id="label-list-input"
        value={value}
        onChange={(input) => {
          setValue(input?.join(','))
        }}
        buttonLabel="Add label"
      />
    )
  }
  test('renders', async () => {
    const { getByText, getByTestId } = render(<LabelsListInput />)
    expect(getByTestId('label-input-button')).toBeVisible()

    userEvent.click(getByTestId('label-input-button'))
    expect(getByText('Label list input')).toBeInTheDocument()
    expect(getByTestId('label-list-input')).toBeInstanceOf(HTMLInputElement)
  })
  test('can add and remove labels', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsListInput />)
    const labels = ['tag_1', 'tag_2']

    userEvent.click(getByTestId('label-input-button'))

    // add labels
    labels.forEach((label) => {
      userEvent.type(getByTestId('label-list-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    })

    // delete labels
    labels.forEach((label) => {
      userEvent.click(getByTestId(`remove-${label.split('=')[0]}`))
      expect(queryByText(label)).toBeNull()
    })
  })
  test('can add labels with comma', async () => {
    const { queryByText, getByTestId } = render(<LabelsListInput />)
    userEvent.click(getByTestId('label-input-button'))
    userEvent.type(getByTestId('label-list-input'), 'tag_1,')
    expect(queryByText('tag_1')).toBeVisible()
    expect(queryByText('tag_1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('does not allow duplicate labels', async () => {
    const { queryByText, queryAllByText, getByTestId } = render(<LabelsListInput />)
    const labels = ['tag_1', 'tag_1']

    userEvent.click(getByTestId('label-input-button'))

    labels.forEach((label) => {
      userEvent.type(getByTestId('label-list-input'), `${label}{enter}`)
      expect(queryByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    })
    expect(queryAllByText('tag_1')).toHaveLength(1)
  })
  test('input can be exited by escape', async () => {
    const { queryByText, getByTestId } = render(<LabelsListInput />)
    const commands = ['{esc}']

    userEvent.click(getByTestId('label-input-button'))

    // verify escape and enter exit input behavior
    commands.forEach((cmd) => {
      userEvent.type(getByTestId('label-list-input'), cmd)
      expect(queryByText('tag_1')).toBeNull()
    })
  })
  test('can delete labels with keyboard controls', () => {
    const { queryByText, getByTestId } = render(<LabelsListInput />)

    userEvent.click(getByTestId('label-input-button'))
    userEvent.type(getByTestId('label-list-input'), 'tag_1{enter}')
    expect(queryByText('tag_1')).toBeVisible()
    userEvent.type(getByTestId('label-list-input'), '{backspace}{enter}')
    expect(queryByText('tag_1')).toBeNull()
  })

  test('has zero accessibility defects', async () => {
    const { getByTestId, container } = render(<LabelsListInput />)
    expect(await axe(container)).toHaveNoViolations()

    userEvent.click(getByTestId('label-input-button'))
    expect(await axe(container)).toHaveNoViolations()

    userEvent.type(getByTestId('label-list-input'), 'tag_1{enter}')
    expect(await axe(container)).toHaveNoViolations()
  })
})
