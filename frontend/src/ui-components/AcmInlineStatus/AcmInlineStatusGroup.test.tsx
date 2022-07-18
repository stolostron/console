/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

import { AcmInlineStatusGroup } from './AcmInlineStatusGroup'

describe('AcmInlineStatusGroup', () => {
    test('renders', async () => {
        const { getByText, getAllByRole, container } = render(
            <AcmInlineStatusGroup
                healthy={3}
                running={8}
                warning={2}
                danger={1}
                progress={4}
                sleep={6}
                pending={5}
                unknown={0}
                detached={7}
                showZeroes
            />
        )
        expect(getAllByRole('listitem').length).toEqual(9)
        expect(getByText(1)).toBeInTheDocument()
        expect(getByText(2)).toBeInTheDocument()
        expect(getByText(3)).toBeInTheDocument()
        expect(getByText(4)).toBeInTheDocument()
        expect(getByText(5)).toBeInTheDocument()
        expect(getByText(6)).toBeInTheDocument()
        expect(getByText(7)).toBeInTheDocument()
        expect(getByText(8)).toBeInTheDocument()
        expect(getByText(0)).toBeInTheDocument()
        expect(await axe(container)).toHaveNoViolations()
    })
    test('renders with undefined and zero values hidden', () => {
        const { getAllByRole } = render(<AcmInlineStatusGroup healthy={3} warning={2} danger={1} unknown={0} />)
        expect(getAllByRole('listitem').length).toEqual(3)
    })
})
