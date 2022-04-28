// Copyright Contributors to the Open Cluster Management project

import { createEditLink } from './resource-helper'
import { render } from '@testing-library/react'

describe('createEditLink', () => {
    it('create an edit link', () => {
        const item = {
            name: 'app1',
            namespace: 'app1-ns',
            kind: 'application',
            apiVersion: 'v1',
            cluster: 'local-cluster',
        }

        const { getByText } = render(createEditLink(item))
        expect(getByText('app1')).toBeTruthy()
    })
})
