/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmCountCard } from './AcmCountCard'

describe('AcmCountCard', () => {
    const shareAction = jest.fn()
    const deleteAction = jest.fn()
    const editAction = jest.fn()
    const cardAction = jest.fn()

    // Skeleton Card Tests

    const SkeletonCard = () => {
        return <AcmCountCard id="ACM Skeleton Card" loading={true} />
    }

    test('validates Skeleton Card renders', () => {
        const { getByTestId } = render(<SkeletonCard />)
        expect(getByTestId('ACM Skeleton Card')).toBeInTheDocument()
    })

    test('Loading Card - has zero accessibility defects', async () => {
        const { container } = render(<SkeletonCard />)
        expect(await axe(container)).toHaveNoViolations()
    })

    // Suggested Search Card Tests

    const SuggestedSearchCardWithOutHeader = () => (
        <AcmCountCard
            id="ACM Suggested Search Card"
            onClick={cardAction()}
            count={0}
            countTitle="Results"
            isSelectable={true}
        />
    )

    const SuggestedSearchCardWithOutActions = () => (
        <AcmCountCard
            id="ACM Suggested Search Card"
            cardHeader={{
                title: 'Workloads',
                description: 'A pre-defined search to help you review your workloads',
            }}
            onClick={cardAction()}
            count={0}
            countTitle="Results"
            isSelectable={true}
        />
    )

    const SuggestedSearchCardWithActions = () => (
        <AcmCountCard
            id="ACM Suggested Search Card"
            cardHeader={{
                title: 'Workloads',
                description: 'A pre-defined search to help you review your workloads',
                actions: [{ text: 'Share', handleAction: shareAction }],
            }}
            onClick={cardAction()}
            count={0}
            countTitle="Results"
            isSelectable={true}
        />
    )

    const SuggestedSearchCardLargeCount = () => (
        <AcmCountCard
            id="ACM Suggested Search Card"
            cardHeader={{
                title: 'Workloads',
                description: 'A pre-defined search to help you review your workloads',
                actions: [{ text: 'Share', handleAction: shareAction }],
            }}
            onClick={cardAction()}
            count={9999}
            countTitle="Results"
            isSelectable={true}
        />
    )

    test('Suggested Card - has zero accessibility defects', async () => {
        const { container, getAllByLabelText } = render(<SuggestedSearchCardWithActions />)
        expect(await axe(container)).toHaveNoViolations()
        userEvent.click(getAllByLabelText('Actions')[0])
        expect(await axe(container)).toHaveNoViolations()
    })

    test('validates ACM Suggested Search Card renders and is clickable', () => {
        const { getByTestId } = render(<SuggestedSearchCardWithActions />)
        expect(getByTestId('ACM Suggested Search Card')).toBeInTheDocument()
        userEvent.click(getByTestId('ACM Suggested Search Card'))
        expect(cardAction).toHaveBeenCalled()
    })

    test('render card with no header', () => {
        const { queryByText } = render(<SuggestedSearchCardWithOutHeader />)
        expect(queryByText('Results')).toBeInTheDocument()
    })

    test('render card with zero actions', () => {
        const { queryByLabelText } = render(<SuggestedSearchCardWithOutActions />)
        expect(queryByLabelText('Actions')).not.toBeInTheDocument()
    })

    test('render card with large count', () => {
        const { getByText } = render(<SuggestedSearchCardLargeCount />)
        expect(getByText('9.9k')).toBeInTheDocument()
    })

    test('supports single menu action', () => {
        const { getAllByLabelText, getByText } = render(<SuggestedSearchCardWithActions />)
        expect(getAllByLabelText('Actions')).toHaveLength(1)
        userEvent.click(getAllByLabelText('Actions')[0])
        expect(getByText('Share')).toBeVisible()
        userEvent.click(getByText('Share'))
        expect(shareAction).toHaveBeenCalled()
    })

    // Saved Search Card Tests

    const SavedSearchCard = () => (
        <AcmCountCard
            id="ACM Saved Search Card"
            cardHeader={{
                title: 'Kind:pod',
                description: 'A pre-defined search to help you review your workloads',
                actions: [
                    { text: 'Edit', handleAction: editAction },
                    { text: 'Share', handleAction: shareAction },
                    { text: 'Delete', handleAction: deleteAction },
                ],
                hasIcon: true,
            }}
            onClick={cardAction()}
            count={0}
            countTitle="Results"
            isSelectable={true}
        />
    )
    test('Saved Search Card - has zero accessibility defects', async () => {
        const { container, getAllByLabelText } = render(<SavedSearchCard />)
        expect(await axe(container)).toHaveNoViolations()
        userEvent.click(getAllByLabelText('Actions')[0])
        expect(await axe(container)).toHaveNoViolations()
    })

    test('validates ACM Saved Search Card renders', () => {
        const { getByTestId, getAllByLabelText } = render(<SavedSearchCard />)
        expect(getByTestId('ACM Saved Search Card')).toBeInTheDocument()
        expect(getAllByLabelText('Actions')).toHaveLength(1)
    })

    // Clusters Overview Variant Test

    const ClustersOverviewVariantWithDescription = () => (
        <AcmCountCard
            id="ACM Clusters Overview Card Variant"
            cardFooter={{
                countDescription: '0 nodes inactive',
            }}
        />
    )

    const ClustersOverviewVariantWithOutDescription = () => (
        <AcmCountCard
            id="ACM Clusters Overview Card Variant"
            cardFooter={{
                countLink: 'https://www.redhat.com',
            }}
        />
    )

    test('ClustersOverview Card - has zero accessibility defects', async () => {
        const { container } = render(<ClustersOverviewVariantWithDescription />)
        expect(await axe(container)).toHaveNoViolations()
    })

    test('validates ACM Clusters Overview Card variant renders', () => {
        const { getByTestId } = render(<ClustersOverviewVariantWithDescription />)
        expect(getByTestId('ACM Clusters Overview Card Variant')).toBeInTheDocument()
    })

    test('ClustersOverview Card without desc - has zero accessibility defects', async () => {
        const { container } = render(<ClustersOverviewVariantWithOutDescription />)
        expect(await axe(container)).toHaveNoViolations()
    })

    test('validates ACM Clusters Overview Card variant renders', () => {
        const { getByTestId } = render(<ClustersOverviewVariantWithOutDescription />)
        expect(getByTestId('ACM Clusters Overview Card Variant')).toBeInTheDocument()
    })
})
