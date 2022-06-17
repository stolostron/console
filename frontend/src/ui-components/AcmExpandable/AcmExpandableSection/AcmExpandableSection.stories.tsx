/* Copyright Contributors to the Open Cluster Management project */


import { AcmExpandableSection } from './AcmExpandableSection'

export default {
    title: 'Expandable',
    component: AcmExpandableSection,
}

export const ExpandableSection = () => (
    <AcmExpandableSection label="Expandable Label">Expandable Content</AcmExpandableSection>
)
