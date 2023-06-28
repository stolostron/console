/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant } from '@patternfly/react-core'
import { ArgTypes, Meta } from '@storybook/react'

import { AcmButton } from './AcmButton'

const meta: Meta = {
  title: 'Button',
  component: AcmButton,
  argTypes: {
    isDisabled: { control: 'boolean' },
    text: { type: 'string' },
    tooltip: { type: 'string' },
    variant: {
      control: { type: 'select', options: Object.values(ButtonVariant) },
    },
  },
}
export default meta

export const Button = (args: ArgTypes) => (
  <div style={{ margin: '50px 0px 0px 50px' }}>
    <AcmButton {...args} onClick={() => alert('clicked')}>
      {args.text.toString()}
    </AcmButton>
  </div>
)
Button.args = { text: 'Button', tooltip: 'Tooltip message here' }
