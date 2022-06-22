/* Copyright Contributors to the Open Cluster Management project */

import { AcmCountCardSection } from './AcmCountCardSection'

export default {
    title: 'Count Card',
    component: AcmCountCardSection,
}

const cards = [
    {
        id: 'nodes',
        count: 6,
        countClick: () => alert('node count clicked'),
        title: 'Nodes',
        description: '0 nodes inactive',
    },
    {
        id: 'applications',
        count: 0,
        countClick: () => alert('app count clicked'),
        title: 'Applications',
        linkText: 'Go to Applications',
        onLinkClick: () => alert('app link clicked'),
    },
    {
        id: 'violations',
        count: 5,
        countClick: () => alert('violation count clicked'),
        title: 'Policy violations',
        linkText: 'Go to Policies',
        onLinkClicked: () => alert('violation link clicked'),
        isDanger: true,
    },
]

export const CountCardSection = () => {
    return <AcmCountCardSection title="Status" cards={cards} />
}

export const CountCardSectionSkeleton = () => {
    return <AcmCountCardSection title="Status" cards={cards} loading={true} loadingAriaLabel="Loading results" />
}
