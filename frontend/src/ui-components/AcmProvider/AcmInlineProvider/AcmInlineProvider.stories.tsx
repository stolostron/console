/* Copyright Contributors to the Open Cluster Management project */


import { PageSection } from '@patternfly/react-core'
import { AcmInlineProvider } from './AcmInlineProvider'
import { Provider } from '../'
import { AcmDescriptionList } from '../../AcmDescriptionList/AcmDescriptionList'

export default {
    title: 'Provider',
    component: AcmInlineProvider,
}

export const InlineProvider = () => {
    const providers = Object.values(Provider).map((provider) => ({
        key: provider,
        value: <AcmInlineProvider provider={provider} />,
    }))
    const midpoint = Math.ceil(providers.length / 2)
    const leftItems = providers.slice(0, midpoint)
    const rightItems = providers.slice(midpoint)
    return (
        <PageSection>
            <AcmDescriptionList title="Providers" leftItems={leftItems} rightItems={rightItems} />
        </PageSection>
    )
}
