/* Copyright Contributors to the Open Cluster Management project */
import { getDefault } from './utils'

describe('assisted-installer utils', () => {
    it('getDefault', () => {
        expect(getDefault([])).toBe('')
        expect(getDefault(['a', undefined, 'b'])).toBe('a')
        expect(getDefault([undefined, undefined, 'c'])).toBe('c')
        expect(getDefault([undefined, undefined, undefined])).toBe('')
    })
})
