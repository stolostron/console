/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmAnsibleTagsInput, AcmKubernetesLabelsInput } from './AcmLabelsInput'
import { clickElement, typeElement } from '~/lib/test-util'

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

    await clickElement(getByTestId('label-input-button'))
    expect(getByText('Label input')).toBeInTheDocument()
    expect(getByTestId('label-input')).toBeInstanceOf(HTMLInputElement)
  })
  test('can add and remove labels', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsInputKeyPairs />)
    const labels = ['foo=bar', 'coffee=bean']

    await clickElement(getByTestId('label-input-button'))

    // add labels
    for (const label of labels) {
      await typeElement(getByTestId('label-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    }

    // delete labels
    for (const label of labels) {
      await clickElement(getByTestId(`remove-${label.split('=')[0]}`))
      expect(queryByText(label)).toBeNull()
    }
  })
  test('can add labels with comma', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    await clickElement(getByTestId('label-input-button'))
    await typeElement(getByTestId('label-input'), 'label1,')
    expect(queryByText('label1')).toBeVisible()
    expect(queryByText('label1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('can add labels with space', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    await clickElement(getByTestId('label-input-button'))
    await typeElement(getByTestId('label-input'), 'label1 ')
    expect(queryByText('label1')).toBeVisible()
    expect(queryByText('label1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('does not allow duplicate labels', async () => {
    const { queryByText, queryAllByText, getByTestId } = render(<LabelsInputKeyPairs />)
    const labels = ['foo=bar', 'foo=bar']

    await clickElement(getByTestId('label-input-button'))

    for (const label of labels) {
      await typeElement(getByTestId('label-input'), `${label}{enter}`)
      expect(queryByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    }
    expect(queryAllByText('foo=bar')).toHaveLength(1)
  })
  test('input can be exited by escape', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)
    const commands = ['{esc}']

    await clickElement(getByTestId('label-input-button'))

    // verify escape and enter exit input behavior
    for (const cmd of commands) {
      await typeElement(getByTestId('label-input'), cmd)
      expect(queryByText('label=null')).toBeNull()
    }
  })
  test('can delete labels with keyboard controls', async () => {
    const { queryByText, getByTestId } = render(<LabelsInputKeyPairs />)

    await clickElement(getByTestId('label-input-button'))
    await typeElement(getByTestId('label-input'), 'foo=bar{enter}')
    expect(queryByText('foo=bar')).toBeVisible()
    await typeElement(getByTestId('label-input'), '{backspace}{enter}')
    expect(queryByText('foo=bar')).toBeNull()
  })

  test('has zero accessibility defects', async () => {
    const { getByTestId, container } = render(<LabelsInputKeyPairs />)
    expect(await axe(container)).toHaveNoViolations()

    await clickElement(getByTestId('label-input-button'))
    expect(await axe(container)).toHaveNoViolations()

    await typeElement(getByTestId('label-input'), 'foo=bar{enter}')
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

    await clickElement(getByTestId('label-input-button'))

    // add labels
    for (const label of labels) {
      await typeElement(getByTestId('label-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    }

    // delete labels
    for (const label of labels) {
      await clickElement(getByTestId(`remove-${label.split('=')[0]}`))
      expect(queryByText(label)).toBeNull()

      expect(getByTestId('label-input-button')).toBeVisible()
    }
  })
  test('allows for string tags with spaces to be added', async () => {
    const { queryByText, getByTestId, getByText } = render(<LabelsInputStrings />)
    const labels = ['foo bar', 'coffee bean']

    await clickElement(getByTestId('label-input-button'))

    // add labels
    for (const label of labels) {
      await typeElement(getByTestId('label-input'), `${label}{enter}`)
      expect(getByText(label)).toBeVisible()
      expect(queryByText(label)).toBeInstanceOf(HTMLSpanElement)
    }
  })

  test('hides component when hidden prop is true', () => {
    const HiddenLabelsInput = () => {
      const [value, setValue] = useState<Record<string, string> | undefined>()
      return <AcmKubernetesLabelsInput label="Label input" id="label-input" value={value} onChange={setValue} hidden />
    }
    const { queryByTestId, queryByText } = render(<HiddenLabelsInput />)
    expect(queryByTestId('label-input-button')).toBeNull()
    expect(queryByText('Label input')).toBeNull()
  })

  test('shows component when hidden prop is false', () => {
    const VisibleLabelsInput = () => {
      const [value, setValue] = useState<Record<string, string> | undefined>()
      return (
        <AcmKubernetesLabelsInput
          label="Label input"
          id="label-input"
          value={value}
          onChange={setValue}
          hidden={false}
        />
      )
    }
    const { getByTestId, getByText } = render(<VisibleLabelsInput />)
    expect(getByTestId('label-input-button')).toBeVisible()
    expect(getByText('Label input')).toBeInTheDocument()
  })
})
