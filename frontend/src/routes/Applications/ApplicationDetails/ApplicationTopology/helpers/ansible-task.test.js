// Copyright Contributors to the Open Cluster Management project

import {
    getInfoForAnsibleTask,
    getInfoForAnsibleJob,
    getPulseStatusForAnsibleNode,
    getStatusFromPulse,
    showAnsibleJobDetails,
} from './ansible-task'

const t = (string) => {
    return string
}

describe('getInfoForAnsibleTask', () => {
    const condition1 = [
        {
            ansibleResult: 'Foo',
            reason: 'Successful',
            message: 'Test 1',
        },
    ]

    const condition2 = [
        {
            ansibleResult: 'Bar',
            reason: 'Failed',
            message: 'Test 2',
        },
    ]

    const condition3 = [
        {
            ansibleResult: 'FooBar',
            reason: 'Pending',
            message: 'Test 3',
        },
    ]

    const result1 = {
        pulse: 'green',
        message: 'Successful: Test 1',
    }

    const result2 = {
        pulse: 'red',
        message: 'Failed: Test 2',
    }

    const result3 = {
        pulse: 'yellow',
        message: 'Pending: Test 3',
    }

    it('returns ansible task info', () => {
        expect(getInfoForAnsibleTask(condition1)).toEqual(result1)
        expect(getInfoForAnsibleTask(condition2)).toEqual(result2)
        expect(getInfoForAnsibleTask(condition3)).toEqual(result3)
    })
})

describe('getInfoForAnsibleJob', () => {
    const status1 = {
        status: 'error',
        url: 'https://test/',
    }

    const status2 = {
        status: 'successful',
        url: 'https://test/',
    }

    const status3 = {
        status: 'canceled',
        url: 'https://test/',
    }

    const status4 = {
        status: 'unknown',
        url: 'https://test/',
    }

    const result1 = {
        message: 'error',
        pulse: 'red',
        url: 'https://test/',
    }

    const result2 = {
        message: 'successful',
        pulse: 'green',
        url: 'https://test/',
    }

    const result3 = {
        message: 'canceled',
        pulse: 'yellow',
        url: 'https://test/',
    }

    const result4 = {
        message: 'unknown',
        pulse: 'orange',
        url: 'https://test/',
    }

    it('returns ansible job info', () => {
        expect(getInfoForAnsibleJob(status1)).toEqual(result1)
        expect(getInfoForAnsibleJob(status2)).toEqual(result2)
        expect(getInfoForAnsibleJob(status3)).toEqual(result3)
        expect(getInfoForAnsibleJob(status4)).toEqual(result4)
    })
})

describe('getPulseStatusForAnsibleNode', () => {
    const node1 = {
        specs: {
            raw: {
                status: {
                    conditions: [],
                },
            },
        },
    }

    const node2 = {
        specs: {
            raw: {
                status: {
                    conditions: [
                        {
                            ansibleResult: 'Foo',
                            reason: 'Successful',
                            message: 'Test 1',
                        },
                    ],
                    ansibleJobResult: {
                        status: 'successful',
                        url: 'https://test/',
                    },
                },
            },
        },
    }

    const node3 = {
        specs: {
            raw: {
                status: {
                    conditions: [
                        {
                            ansibleResult: 'Bar',
                            reason: 'Failed',
                            message: 'Test 2',
                        },
                    ],
                    ansibleJobResult: {
                        status: 'error',
                        url: 'https://test/',
                    },
                },
            },
        },
    }

    const node4 = {
        specs: {
            raw: {
                status: {
                    conditions: [
                        {
                            ansibleResult: 'FooBar',
                            reason: 'Pending',
                            message: 'Test 3',
                        },
                    ],
                    ansibleJobResult: {
                        status: 'canceled',
                        url: 'https://test/',
                    },
                },
            },
        },
    }

    const node5 = {
        specs: {
            raw: {
                status: {
                    conditions: [
                        {
                            reason: 'Pending',
                            message: 'Test 3',
                        },
                    ],
                    ansibleJobResult: {
                        status: 'unknown',
                        url: 'https://test/',
                    },
                },
            },
        },
    }
    it('returns ansible node pulse status info', () => {
        expect(getPulseStatusForAnsibleNode(node1)).toEqual('orange')
        expect(getPulseStatusForAnsibleNode(node2)).toEqual('green')
        expect(getPulseStatusForAnsibleNode(node3)).toEqual('red')
        expect(getPulseStatusForAnsibleNode(node4)).toEqual('yellow')
        expect(getPulseStatusForAnsibleNode(node5)).toEqual('orange')
    })
})

describe('getStatusFromPulse', () => {
    it('returns ansible status info from pulse', () => {
        expect(getStatusFromPulse(undefined)).toEqual('pending')
        expect(getStatusFromPulse('red')).toEqual('failure')
        expect(getStatusFromPulse('yellow')).toEqual('warning')
        expect(getStatusFromPulse('orange')).toEqual('pending')
        expect(getStatusFromPulse('green')).toEqual('checkmark')
    })
})

describe('showAnsibleJobDetails', () => {
    const node = {
        specs: {
            raw: {
                status: {
                    k8sJob: {
                        env: {
                            templateName: 'AnsibleJob1',
                            secretNamespaceName: 'aj-ns',
                        },
                    },
                    conditions: [
                        {
                            ansibleResult: 'Foo',
                            reason: 'Successful',
                            message: 'Test 1',
                        },
                    ],
                    ansibleJobResult: {
                        status: 'successful',
                        url: 'https://test/',
                    },
                },
            },
        },
    }

    const result = [
        {
            indent: undefined,
            labelKey: 'Ansible Tower Job template name',
            labelValue: undefined,
            status: undefined,
            type: 'label',
            value: 'AnsibleJob1',
        },
        {
            type: 'spacer',
        },
        {
            labelKey: 'Ansible Tower Job URL',
            type: 'label',
        },
        {
            indent: true,
            type: 'link',
            value: {
                data: {
                    action: 'open_link',
                    targetLink: 'https://test/',
                },
                id: 'https://test/-location',
                label: 'https://test/',
            },
        },
        {
            type: 'spacer',
        },
        {
            labelValue: 'description.ansible.task.status',
            status: 'checkmark',
            value: 'Successful: Test 1',
        },
        {
            type: 'spacer',
        },
        {
            labelValue: 'description.ansible.job.status',
            status: 'checkmark',
            value: 'successful',
        },
    ]

    it('shows the ansible node details', () => {
        expect(showAnsibleJobDetails(node, [], t)).toEqual(result)
    })
})
