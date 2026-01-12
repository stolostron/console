/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'
import { useState } from 'react'
import { AcmPage, AcmPageCard, AcmPageHeader } from '../AcmPage/AcmPage'
import { AcmSecondaryNav } from './AcmSecondaryNav'

const meta: Meta = {
  title: 'SecondaryNav',
  component: AcmSecondaryNav,
}
export default meta

export function SecondaryNav() {
  const [active, setActive] = useState('first')
  return (
    <AcmPage header={<AcmPageHeader title="SecondaryNav"></AcmPageHeader>}>
      <AcmPageCard>
        <AcmSecondaryNav
          navItems={[
            {
              key: 'nav-story-first-item',
              title: 'First Nav',
              isActive: active === 'first',
              onClick: () => setActive('first'),
            },
            {
              key: 'nav-story-second-item',
              title: 'Second Nav',
              isActive: active === 'second',
              onClick: () => setActive('second'),
            },
            {
              key: 'nav-story-third-item',
              title: 'Third Nav',
              isActive: active === 'third',
              onClick: () => setActive('third'),
            },
          ]}
        />
      </AcmPageCard>
    </AcmPage>
  )
}
