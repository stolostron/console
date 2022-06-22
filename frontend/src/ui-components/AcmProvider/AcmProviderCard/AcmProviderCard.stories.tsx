/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmOverviewProviders, AcmProviderCard } from './AcmProviderCard'
import { Provider } from '../'

export default {
    title: 'Provider',
    component: AcmProviderCard,
}

export const ProviderCard = () => {
    const [filter, setFilter] = useState<Provider | undefined>(undefined)
    const providers = Object.values(Provider).map((provider, i) => ({
        provider,
        clusterCount: i <= 1 ? i : Math.floor(Math.random() * 100 + 1),
        danger: i === 0,
        isSelected: provider === filter,
        onClick: (provider: Provider) => {
            if (provider === filter) {
                setFilter(undefined)
            } else {
                setFilter(provider)
            }
        },
    }))
    return <AcmOverviewProviders providers={providers} />
}
