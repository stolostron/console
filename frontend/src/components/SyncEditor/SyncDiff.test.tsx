/* Copyright Contributors to the Open Cluster Management project */
import { SyncDiff, SyncDiffType } from './SyncDiff'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const revealFn = jest.fn()
describe('SyncDiff tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('happy path', async () => {
        render(<SyncDiff {...props} />)

        expect(
            screen.getByRole('cell', {
                name: /10/i,
            })
        ).toBeInTheDocument()

        const cell = screen.getByRole('cell', {
            name: /data : 1234/i,
        })
        expect(cell).toBeInTheDocument()

        userEvent.click(cell)
        expect(revealFn).toHaveBeenCalledTimes(1)
    })
})

const props: { stateChanges: SyncDiffType; errorMessage: string } = {
    stateChanges: {
        warnings: [],
        errors: [],
        changes: [
            {
                type: 'N',
                line: 10,
                path: ['Secret', 0, 'metadata', 'labels', 'data'],
                length: 1,
                latest: ['data: 1234'],
                reveal: revealFn,
            },
            {
                type: 'E',
                line: 14,
                path: ['Secret', 0, 'metadata', 'labels', 'datax'],
                length: 1,
                latest: ['datax: 1234'],
            },
        ],
    },
    errorMessage: '',
}
