/* Copyright Contributors to the Open Cluster Management project */


import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmCodeSnippet } from './AcmCodeSnippet'

document.execCommand = jest.fn()

describe('AcmCodeSnippet', () => {
    const fakeCommand = 'My fake command'
    const CodeSnippet = (props: { fakeCommand?: string }) => {
        return (
            <AcmCodeSnippet
                id="snippet"
                fakeCommand={props.fakeCommand}
                command="real command"
                copyTooltipText="Copy to clipboard"
                copySuccessText="Copied!"
            />
        )
    }
    test('renders', async () => {
        const { getByTestId, queryByText } = render(<CodeSnippet />)
        expect(getByTestId('snippet')).toBeInTheDocument()
        expect(getByTestId('snippet')).toBeInstanceOf(HTMLDivElement)
        expect(queryByText('real command')).toBeVisible()
        expect(queryByText(fakeCommand)).toBeNull()
        await act(async () => {
            await userEvent.click(getByTestId('copy-button-snippet'))
            await new Promise((resolve) => setTimeout(resolve, 2100))
        })
        expect(document.execCommand).toHaveBeenCalled()
    })
    test('renders with fake command', () => {
        const { getByText } = render(<CodeSnippet fakeCommand={fakeCommand} />)
        expect(getByText(fakeCommand)).toBeVisible()
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<CodeSnippet />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
