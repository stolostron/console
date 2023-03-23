/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmAnsibleTagsInput, AcmKubernetesLabelsInput } from './AcmLabelsInput'

describe('AcmLabelsInput', () => {
  const LabelsInputKeyPairs = () => {
    const [value, setValue] = useState<Record<string, string> | undefined>()
    return <AcmKubernetesLabelsInput label="Label input" id="label-input" value={value} onChange={setValue} />
  }
  const LabelsInputStrings = () => {
    const [value, setValue] = useState<string>()
    return <AcmAnsibleTagsInput label="Label input" id="label-input" value={value} onChange={setValue} />
  }
  test('renders', async () => {
    const { getByText, getByTestId } = render(<LabelsInputKeyPairs />)
    expect(getByTestId('label-input-button')).toBeVisible()

    userEvent.click(getByTestId('label-input-button'))
    expect(getByText('Label input')).toBeInTheDocument()
    expect(getByTestId('label-input')).toBeInstanceOf(HTMLInputElement)
  })
  test('can add and remove labels', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsInputKeyPairs />)
    const labels = ['foo=bar', 'coffee=bean']

    userEvent.click(getByTestId('label-input-button'))

    // add labels
    labels.forEach((label) => {
      userEvent.type(getByTestId('label-input'), `${label}{enter}`)
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
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    userEvent.click(getByTestId('label-input-button'))
    userEvent.type(getByTestId('label-input'), 'label1,')
    expect(queryByText('label1')).toBeVisible()
    expect(queryByText('label1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('can add labels with space', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    userEvent.click(getByTestId('label-input-button'))
    userEvent.type(getByTestId('label-input'), 'label1 ')
    expect(queryByText('label1')).toBeVisible()
    expect(queryByText('label1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('does not allow duplicate labels', async () => {
    const { queryByText, queryAllByText, getByTestId } = render(<LabelsInputKeyPairs />)
    const labels = ['foo=bar', 'foo=bar']

    userEvent.click(getByTestId('label-input-button'))

    labels.forEach((label) => {
      userEvent.type(getByTestId('label-input'), `${label}{enter}`)
      expect(queryByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    })
    expect(queryAllByText('foo=bar')).toHaveLength(1)
  })
  test('input can be exited by escape', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    const commands = ['{esc}']

    userEvent.click(getByTestId('label-input-button'))

    // verify escape and enter exit input behavior
    commands.forEach((cmd) => {
      userEvent.type(getByTestId('label-input'), cmd)
      expect(queryByText('label=null')).toBeNull()
    })
  })
  test('can delete labels with keyboard controls', () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)

    userEvent.click(getByTestId('label-input-button'))
    userEvent.type(getByTestId('label-input'), 'foo=bar{enter}')
    expect(queryByText('foo=bar')).toBeVisible()
    userEvent.type(getByTestId('label-input'), '{backspace}{enter}')
    expect(queryByText('foo=bar')).toBeNull()
  })

  test('has zero accessibility defects', async () => {
    const { getByTestId, container } = render(<LabelsInputKeyPairs />)
    expect(await axe(container)).toHaveNoViolations()

    userEvent.click(getByTestId('label-input-button'))
    expect(await axe(container)).toHaveNoViolations()

    userEvent.type(getByTestId('label-input'), 'foo=bar{enter}')
    expect(await axe(container)).toHaveNoViolations()
  })

  test('allows an undefined value to be set', async () => {
    const UndefinedLabelsInput = () => {
      const [value, setValue] = useState<Record<string, string> | undefined>(undefined)
      return <AcmKubernetesLabelsInput label="Label input" id="label-input" value={value} onChange={setValue} />
    }
    const { getByTestId } = render(<UndefinedLabelsInput />)
    expect(getByTestId('label-input-button')).toBeVisible()
  })

  test('allows for string values to be added and removed', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsInputStrings />)
    const labels = ['foobar', 'coffeebean']

    userEvent.click(getByTestId('label-input-button'))

    // add labels
    labels.forEach((label) => {
      userEvent.type(getByTestId('label-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    })

    // delete labels
    labels.forEach((label) => {
      userEvent.click(getByTestId(`remove-${label.split('=')[0]}`))
      expect(queryByText(label)).toBeNull()

      expect(getByTestId('label-input-button')).toBeVisible()
    })
  })
  test('allows for string tags with spaces to be added', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsInputStrings />)
    const labels = ['foo bar', 'coffee bean']

    userEvent.click(getByTestId('label-input-button'))

    // add labels
    labels.forEach((label) => {
      userEvent.type(getByTestId('label-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    })
  })
})
