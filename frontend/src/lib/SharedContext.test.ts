/* Copyright Contributors to the Open Cluster Management project */
import { PluginDataContext } from './PluginDataContext'
import { isSharedContext } from './SharedContext'

describe('isSharedContext', () => {
    it('matches valid extensions', () => {
        expect(
            isSharedContext({ type: 'acm.shared-context', properties: { id: 'test-id', context: PluginDataContext } })
        ).toBeTruthy()
    })
    it('does not match wrong types', () => {
        expect(
            isSharedContext({ type: 'mce.shared-context', properties: { id: 'test-id', context: PluginDataContext } })
        ).toBeFalsy()
    })
    it('does not match with missing id property', () => {
        expect(isSharedContext({ type: 'acm.shared-context', properties: { context: PluginDataContext } })).toBeFalsy()
    })
    it('does not match with missing context property', () => {
        expect(isSharedContext({ type: 'acm.shared-context', properties: { id: 'test-id' } })).toBeFalsy()
    })
})
