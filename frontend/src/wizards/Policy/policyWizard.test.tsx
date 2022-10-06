/* Copyright Contributors to the Open Cluster Management project */

import { isExistingTemplateName } from './PolicyWizard'
import { mockPolicy } from '../../routes/Governance/governance.sharedMocks'

describe('ExistingTemplateName', () => {
    test('should return false for non-existing name', () => {
        const result = isExistingTemplateName('test-template', mockPolicy)
        expect(result).toBe(false)
    })

    test('should return true for existing name', () => {
        const result = isExistingTemplateName('policy-set-with-1-placement-policy-1', mockPolicy)
        expect(result).toBe(true)
    })
})
