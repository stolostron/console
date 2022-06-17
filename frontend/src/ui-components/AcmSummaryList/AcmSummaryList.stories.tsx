/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Button, ButtonVariant, OptionsMenu, OptionsMenuItem, OptionsMenuToggleWithText } from '@patternfly/react-core'
import { CaretDownIcon } from '@patternfly/react-icons'
import { AcmSummaryList } from './AcmSummaryList'

export default {
    title: 'SummaryList',
    component: AcmSummaryList,
}

export const SummaryList = () => {
    const list = [
        { isPrimary: true, description: 'Applications', count: 3, href: '/search?query=apps' },
        { description: 'Clusters', count: 2, href: '/search?query=clusters' },
        { description: 'Kubernetes type', count: 1 },
        { description: 'Region', count: 1 },
        { description: 'Nodes', count: 3, href: '/search?query=nodes' },
        { description: 'Pods', count: 3, href: '/search?query=pods' },
    ]
    return (
        <MemoryRouter>
            <AcmSummaryList
                title="Summary"
                list={list}
                actions={[<Menu key="menu" />]}
                rightAction={<Button variant={ButtonVariant.link}>Expand details</Button>}
            />
        </MemoryRouter>
    )
}

const Menu = () => {
    const [isOpen, setOpen] = useState<boolean>(false)
    const noop = () => null
    const menuItems = [
        <OptionsMenuItem id="aws" key="1" onSelect={noop}>
            Amazon
        </OptionsMenuItem>,
        <OptionsMenuItem id="gcp" key="2" onSelect={noop}>
            Google
        </OptionsMenuItem>,
    ]
    const toggle = (
        <OptionsMenuToggleWithText
            toggleText="All providers"
            toggleButtonContents={<CaretDownIcon />}
            onToggle={() => setOpen(!isOpen)}
        />
    )
    return <OptionsMenu id="fake" menuItems={menuItems} isOpen={isOpen} isPlain isText toggle={toggle} />
}

export const SummaryListSkeleton = () => {
    return (
        <MemoryRouter>
            <AcmSummaryList
                loading={true}
                title="Summary"
                list={[]}
                actions={[<Menu key="menu" />]}
                rightAction={<Button variant={ButtonVariant.link}>Expand details</Button>}
            />
        </MemoryRouter>
    )
}
