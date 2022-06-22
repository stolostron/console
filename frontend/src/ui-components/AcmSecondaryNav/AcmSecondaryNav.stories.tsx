/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'
import { useState } from 'react'
import { AcmPage, AcmPageCard, AcmPageHeader } from '../AcmPage/AcmPage'
import { AcmSecondaryNav, AcmSecondaryNavItem } from './AcmSecondaryNav'

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
                <AcmSecondaryNav>
                    <AcmSecondaryNavItem isActive={active === 'first'} onClick={() => setActive('first')}>
                        First Nav
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem isActive={active === 'second'} onClick={() => setActive('second')}>
                        Second Nav
                    </AcmSecondaryNavItem>
                    <AcmSecondaryNavItem isActive={active === 'third'} onClick={() => setActive('third')}>
                        Third Nav
                    </AcmSecondaryNavItem>
                </AcmSecondaryNav>
            </AcmPageCard>
        </AcmPage>
    )
}
