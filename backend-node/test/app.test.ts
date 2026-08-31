/* Copyright Contributors to the Open Cluster Management project */

import { stopFileWatches } from '../src/lib/fileWatch'
import { stop } from '../src/app'

jest.mock('../src/lib/fileWatch', () => ({
  ...jest.requireActual<typeof import('../src/lib/fileWatch')>('../src/lib/fileWatch'),
  stopFileWatches: jest.fn(),
}))

const mockStopFileWatches = stopFileWatches as jest.MockedFunction<typeof stopFileWatches>

describe('app stop', () => {
  it('calls stopFileWatches on shutdown', async () => {
    await stop()
    expect(mockStopFileWatches).toHaveBeenCalled()
  })
})
