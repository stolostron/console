/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import TimeWindow from '.'
import { waitForText } from '../../../../../../lib/test-util'
import userEvent from '@testing-library/user-event'

const i18n = (string) => {
    return string
}

describe('Time window control', () => {
    beforeEach(async () => {
        render(<TimeWindow control={{}} i18n={i18n} controlId="timewindow" handleChange={jest.fn} />)

        // wait for page to load
        await waitForText('Start time')
    })

    test('should display time window control', async () => {
        expect(screen.getByText('End time')).toBeTruthy()
        expect(screen.getByRole('radio', { name: /creation\.app\.settings\.timewindow\.activemode/i })).toBeTruthy()
        userEvent.click(screen.getByRole('radio', { name: /creation\.app\.settings\.timewindow\.activemode/i }))

        // test start time
        expect(screen.getAllByRole('textbox', { name: /time picker/i })[0]).toBeTruthy()
        userEvent.click(screen.getAllByRole('textbox', { name: /time picker/i })[0])
        expect(screen.getByText(/12:00 am/i)).toBeTruthy()
        userEvent.click(screen.getByText(/12:00 am/i))

        // test stop time
        expect(screen.getAllByRole('textbox', { name: /time picker/i })[1]).toBeTruthy()
        userEvent.click(screen.getAllByRole('textbox', { name: /time picker/i })[1])
        expect(screen.getByText(/12:00 am/i)).toBeTruthy()
        userEvent.click(screen.getByText(/12:00 am/i))
    })
})
