/* Copyright Contributors to the Open Cluster Management project */

import { ButtonVariant } from '@patternfly/react-core'
import { ArgTypes, Meta } from '@storybook/react'

import { AcmChip, AcmChipGroup } from './AcmChipGroup'
import { AcmPageCard } from '../AcmPage'

const meta: Meta = {
  title: 'Chip Group',
  component: AcmChipGroup,
  excludeStories: ['ExampleChipGroup'],
  argTypes: {
    categoryName: { type: 'string' },
    isClosable: { type: 'boolean', defaultValue: false },
    numChips: { type: 'number', defaultValue: 3 },
    variant: {
      control: { type: 'select', options: Object.values(ButtonVariant) },
    },
  },
}
export default meta

export const ExampleChipGroup = (args: ArgTypes) => (
  <AcmChipGroup aria-label="Chip group example" {...args}>
    <AcmChip>Alfa</AcmChip>
    <AcmChip>Bravo</AcmChip>
    <AcmChip>Charlie</AcmChip>
    <AcmChip>Delta</AcmChip>
    <AcmChip>Echo</AcmChip>
    <AcmChip>Foxtrot</AcmChip>
    <AcmChip>Golf</AcmChip>
  </AcmChipGroup>
)

export const ChipGroup = (args: ArgTypes) => (
  <AcmPageCard>
    <ExampleChipGroup {...args} />
  </AcmPageCard>
)
