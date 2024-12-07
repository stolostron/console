/* Copyright Contributors to the Open Cluster Management project */

import { Icon, Page, PageSection } from '@patternfly/react-core'
import { Meta } from '@storybook/react'

import { AcmDescriptionList } from '../AcmDescriptionList/AcmDescriptionList'
import { AcmIcon, AcmIconVariant } from './AcmIcons'

const meta: Meta = {
  title: 'Icons',
  argTypes: {
    size: {
      control: { type: 'select', options: ['sm', 'md', 'lg', 'xl'], default: 'lg' },
    },
  },
}
export default meta

export const Icons = (args: { size: 'lg' | 'md' | 'xl' | 'sm' }) => {
  const icons = Object.values(AcmIconVariant)
    .sort()
    .map((icon) => {
      return {
        key: icon,
        value: (
          <div style={{ width: '24px', height: '24px' }}>
            <Icon size={args.size}>
              <AcmIcon key={icon} icon={icon} />
            </Icon>
          </div>
        ),
      }
    })
  const midpoint = Math.ceil(icons.length / 2)
  const leftItems = icons.slice(0, midpoint)
  const rightItems = icons.slice(midpoint)
  return (
    <Page>
      <PageSection>
        <AcmDescriptionList title="Icons" leftItems={leftItems} rightItems={rightItems} />
      </PageSection>
    </Page>
  )
}
