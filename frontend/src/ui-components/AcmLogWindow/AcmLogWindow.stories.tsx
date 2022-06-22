/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'

import { AcmLogWindow } from './AcmLogWindow'

const meta: Meta = {
    title: 'LogWindow',
    component: AcmLogWindow,
    argTypes: {
        cluster: { type: 'string' },
        namespace: { type: 'string' },
        initialContainer: { type: 'string' },
        container: {
            control: { type: 'select', options: ['container1', 'container2'] },
        },
        logs: { type: 'string' },
    },
}
export default meta

export const LogWindow = (args) => {
    return <AcmLogWindow {...args} />
}
LogWindow.args = {
    cluster: 'Cluster',
    namespace: 'namespace',
    initialContainer: 'container1',
    containers: ['container1', 'container2'],
    onSwitchContainer: (container) => alert(`switching to Container: ${container}`),
    logs: 'Testing log lines1\nTesting log lines2\nTesting log lines3\nTesting log lines4\nTesting log lines5\nTesting log lines6\nTesting log lines7\nTesting log lines8\nTesting log lines9\nTesting log lines10\nTesting log lines11\nTesting log lines12\nTesting log lines13\nTesting log lines14\nTesting log lines15\nTesting log lines16\nTesting log lines17\nTesting log lines18\nTesting log lines19\nTesting log lines20\nTesting log lines21\nTesting log lines22\nTesting log lines23\nTesting log lines24\nTesting log lines25\nTesting log lines26\nTesting log lines27\nTesting log lines28\nTesting log lines29\n',
}
