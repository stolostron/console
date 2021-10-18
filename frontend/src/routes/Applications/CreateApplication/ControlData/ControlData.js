/* Copyright Contributors to the Open Cluster Management project */
import React from 'react'
import Handlebars from 'handlebars'

import { ControlDataArgo } from './ControlDataArgo'
import { ControlDataSubscription } from './ControlDataSubscription'

export const ControlData = [
    {
        id: 'deliveryMechanismStep',
        type: 'step',
        title: 'applications.delivery.mechanism',
    },
    {
        id: 'deliveryMechanismTitle',
        type: 'title',
        info: 'applications.delivery.mechanism.info',
    },
    {
        id: 'mechanismType',
        type: 'cards',
        sort: false,
        pauseControlCreationHereUntilSelected: true,
        scrollViewAfterSelection: 300,
        available: [
            {
                id: 'subscription',
                title: 'application.create.subscription.subtitle',
                tooltip: 'application.create.subscription.tooltip',
                change: {
                    insertControlData: ControlDataSubscription,
                },
            },
            {
                id: 'argo',
                title: 'application.create.argo.subtitle',
                tooltip: 'application.create.argo.tooltip',
                change: {
                    insertControlData: ControlDataArgo,
                },
            },
        ],
    },
    {
        id: 'showSecrets',
        type: 'hidden',
        active: false,
    },
]
