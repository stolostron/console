/* Copyright Contributors to the Open Cluster Management project */

import { AcmLoadingPage } from './AcmLoadingPage'

export default {
    title: 'LoadingPage',
    component: AcmLoadingPage,
    argTypes: {
        title: { type: 'string' },
        message: { type: 'string' },
    },
}

export const LoadingPage = (args) => <AcmLoadingPage {...args} />

LoadingPage.args = {}
