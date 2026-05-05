/* Copyright Contributors to the Open Cluster Management project */
import { injectSearchWsConnectionInitAuthorization } from '../../src/routes/search'

describe('injectSearchWsConnectionInitAuthorization', () => {
  it('adds Authorization to connection_init payload', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: { foo: 'bar' } })
    const out = injectSearchWsConnectionInitAuthorization(input, 'mytoken')
    const msg = JSON.parse(out) as { type: string; payload: { foo: string; Authorization: string } }
    expect(msg.type).toBe('connection_init')
    expect(msg.payload.foo).toBe('bar')
    expect(msg.payload.Authorization).toBe('Bearer mytoken')
  })

  it('accepts token that already includes Bearer prefix', () => {
    const input = JSON.stringify({ type: 'connection_init', payload: {} })
    const out = injectSearchWsConnectionInitAuthorization(input, 'Bearer x')
    const msg = JSON.parse(out) as { payload: { Authorization: string } }
    expect(msg.payload.Authorization).toBe('Bearer x')
  })

  it('leaves non-connection_init messages unchanged', () => {
    const input = JSON.stringify({ type: 'subscribe', id: '1', payload: {} })
    expect(injectSearchWsConnectionInitAuthorization(input, 't')).toBe(input)
  })
})
