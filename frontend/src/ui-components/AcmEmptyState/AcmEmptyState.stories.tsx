/* Copyright Contributors to the Open Cluster Management project */

import { Button } from '@patternfly/react-core'

import { AcmEmptyState } from './AcmEmptyState'

export default {
  title: 'EmptyState',
  component: AcmEmptyState,
  argTypes: {
    title: {
      control: { type: 'text', default: 'No items found' },
    },
    message: {
      control: { type: 'text', default: 'You do not have any items.' },
    },
    showSearchIcon: {
      control: { type: 'boolean', default: false },
    },
    action: {
      table: {
        disable: true,
      },
    },
  },
}

export const EmptyState = (args: any) => (
  <AcmEmptyState
    title={args.title}
    message={args.message}
    action={args.showAction && <Button variant="primary">Create Item</Button>}
    showSearchIcon={args.showSearchIcon}
  />
)

EmptyState.args = {
  title: 'No items found',
  message: 'You do not have any items.',
  showSearchIcon: false,
  showAction: true,
  image: undefined,
}
