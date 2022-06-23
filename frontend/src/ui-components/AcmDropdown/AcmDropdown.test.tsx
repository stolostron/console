/* Copyright Contributors to the Open Cluster Management project */

import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmDropdown, AcmDropdownItems } from './AcmDropdown'

type ComponentProps = {
    isDisabled?: boolean
    tooltip?: string
    isKebab?: boolean
    isPlain?: boolean
    isPrimary?: boolean
    onToggle?: () => void
}

describe('AcmDropdown', () => {
    const onSelect = jest.fn()
    const onHover = jest.fn()
    const Component = (props: ComponentProps) => {
        const dropdownItems: AcmDropdownItems[] = [
            { id: 'install-config', text: 'Install config' },
            { id: 'kubeconfig', text: 'Kubeconfig' },
            { id: 'forbidden', text: 'Other config', isAriaDisabled: true, tooltip: 'Forbidden' },
            { id: 'launch-out', text: 'Launch page', icon: <ExternalLinkAltIcon /> },
            { id: 'link item', text: 'Link item', href: 'www.google.com', component: 'a' },
            { id: 'new-feature', text: 'New feature', label: 'Technology Preview', labelColor: 'blue' },
        ]
        return (
            <AcmDropdown
                isDisabled={props.isDisabled}
                tooltip={props.tooltip}
                id="dropdown"
                onSelect={onSelect}
                onHover={onHover}
                text="Download configuration"
                dropdownItems={dropdownItems}
                isKebab={props.isKebab}
                isPlain={props.isPlain}
                isPrimary={props.isPrimary}
                onToggle={props.onToggle}
            />
        )
    }
    test('renders', async () => {
        const { getByTestId, container } = render(<Component />)
        expect(getByTestId('dropdown')).toBeInTheDocument()
        expect(await axe(container)).toHaveNoViolations()
        userEvent.click(getByTestId('dropdown'))
        await waitFor(() => expect(getByTestId('install-config')).toBeInTheDocument())
        expect(await axe(container)).toHaveNoViolations()
        // userEvent.hover(getByTestId('forbidden'))
        // await waitFor(() => expect(getByRole('tooltip')).toBeInTheDocument())
        userEvent.click(getByTestId('install-config'))
        expect(onSelect).toHaveBeenCalled()
        userEvent.hover(getByTestId('dropdown'))
        expect(onHover).toHaveBeenCalled()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    test('renders as a kebab dropdown', async () => {
        const { getByTestId, container } = render(<Component isKebab={true} onToggle={() => null} />)
        expect(getByTestId('dropdown')).toBeInTheDocument()
        expect(await axe(container)).toHaveNoViolations()
        userEvent.click(getByTestId('dropdown'))
        await waitFor(() => expect(getByTestId('install-config')).toBeInTheDocument())
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    test('renders as a kebab dropdown in disabled state', async () => {
        const { getByTestId, queryByTestId } = render(
            <Component isDisabled={true} tooltip="Tooltip text" isKebab={true} onToggle={() => null} />
        )
        expect(getByTestId('dropdown')).toBeInTheDocument()
        userEvent.click(getByTestId('dropdown'))
        expect(queryByTestId('install-config')).toBeNull()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    test('renders as enabled primary toggle', async () => {
        const { getByTestId, queryByTestId } = render(
            <Component isDisabled={false} tooltip="Tooltip text" isPrimary={true} />
        )
        expect(getByTestId('dropdown')).toBeInTheDocument()
        userEvent.click(getByTestId('dropdown'))
        expect(queryByTestId('install-config')).toBeInTheDocument()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })

    test('renders as disabled primary toggle', async () => {
        const { getByTestId, queryByTestId } = render(
            <Component isDisabled={false} tooltip="Tooltip text" isPrimary={true} onToggle={() => null} />
        )
        expect(getByTestId('dropdown')).toBeInTheDocument()
        userEvent.click(getByTestId('dropdown'))
        expect(queryByTestId('install-config')).toBeInTheDocument()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })

    test('renders as disabled primary toggle', async () => {
        const { getByTestId, queryByTestId } = render(
            <Component isDisabled={true} tooltip="Tooltip text" isPrimary={true} onToggle={() => null} />
        )
        expect(getByTestId('dropdown')).toBeInTheDocument()
        userEvent.click(getByTestId('dropdown'))
        expect(queryByTestId('install-config')).toBeNull()
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
})
