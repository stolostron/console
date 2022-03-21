/* Copyright Contributors to the Open Cluster Management project */

import { Matcher, render, screen, SelectorMatcherOptions, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { ResourceLabels } from './ResourceLabels'

const t = i18next.t.bind(i18next)

// Custom matcher function for text that are separated in multiple elements
function getByTextMultiElement(
    label: string,
    value: string,
    getByText: (id: Matcher, options?: SelectorMatcherOptions | undefined) => HTMLElement
) {
    return getByText((content, node) => {
        const foundLabel = content === label
        const foundNodeSiblingWithValue = node?.nextSibling ? node.nextSibling.textContent === value : false
        return foundLabel && foundNodeSiblingWithValue
    })
}

describe('ResourceLabels', () => {
    const appRepos: any[] = [
        {
            gitBranch: 'main',
            gitPath: 'sadaf',
            pathName: 'https://13.com',
            type: 'git',
        },
        {
            package: 'testchart',
            packageFilterVersion: '0.1.0',
            pathName: 'https://14.com',
            type: 'helmrepo',
        },
        {
            bucketPath: '/test',
            pathName: 'https://15.com',
            type: 'objectbucket',
        },
    ]

    const argoGitRepo: any[] = [
        {
            targetRevision: 'sd',
            gitPath: 'helloworld',
            pathName: 'https://test.com',
            type: 'git',
        },
    ]

    const argoHelmRepo: any[] = [
        {
            chart: 'sd',
            pathName: 'https://test.com',
            targetRevision: 'dsf',
            type: 'helmrepo',
        },
    ]

    const multiAppRepos: any[] = [
        {
            gitBranch: 'branch1',
            gitPath: 'foo',
            pathName: 'https://16.com',
            type: 'git',
        },
        {
            gitBranch: 'branch2',
            gitPath: 'bar',
            pathName: 'https://165.com',
            type: 'git',
        },
        {
            package: 'abcde',
            packageFilterVersion: '0.2.0',
            pathName: 'https://17.com',
            type: 'helmrepo',
        },
        {
            package: 'chrome',
            packageFilterVersion: '0.3.0',
            pathName: 'https://175.com',
            type: 'helmrepo',
        },
        {
            bucketPath: '/test',
            pathName: 'https://18.com',
            type: 'objectbucket',
        },
        {
            bucketPath: '/data',
            pathName: 'https://185.com',
            type: 'objectbucket',
        },
    ]

    it('should render ACM app', async () => {
        const { getByText } = render(
            <ResourceLabels appRepos={appRepos!} showSubscriptionAttributes={true} isArgoApp={false} translation={t} />
        )

        expect(getByText('Git')).toBeTruthy()
        expect(getByText('Helm')).toBeTruthy()
        expect(getByText('Object storage')).toBeTruthy()
        userEvent.click(screen.getByText('Git'))
        await waitFor(() => expect(screen.getByText('https://13.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Branch:', 'main', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Path:', 'sadaf', getByText)).toBeTruthy())
        userEvent.click(screen.getByText('Helm'))
        await waitFor(() => expect(screen.getByText('https://14.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Chart name:', 'testchart', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Package version:', '0.1.0', getByText)).toBeTruthy())
        userEvent.click(screen.getByText('Object storage'))
        await waitFor(() => expect(screen.getByText('https://15.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Subfolder:', '/test', getByText)).toBeTruthy())
    })

    it('should render Argo app Git', async () => {
        const { getByText } = render(
            <ResourceLabels
                appRepos={argoGitRepo!}
                showSubscriptionAttributes={true}
                isArgoApp={true}
                translation={t}
            />
        )
        expect(getByText('Git')).toBeTruthy()
        userEvent.click(screen.getByText('Git'))
        await waitFor(() => expect(screen.getByText('https://test.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Path:', 'helloworld', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Revision:', 'sd', getByText)).toBeTruthy())
    })

    it('should render Argo app Helm', async () => {
        const { getByText } = render(
            <ResourceLabels
                appRepos={argoHelmRepo!}
                showSubscriptionAttributes={true}
                isArgoApp={true}
                translation={t}
            />
        )
        expect(getByText('Helm')).toBeTruthy()
        userEvent.click(screen.getByText('Helm'))
        await waitFor(() => expect(screen.getByText('https://test.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Chart name:', 'sd', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Revision:', 'dsf', getByText)).toBeTruthy())
    })

    it('should render multi ACM app repos', async () => {
        const { getByText } = render(
            <ResourceLabels
                appRepos={multiAppRepos!}
                showSubscriptionAttributes={true}
                isArgoApp={false}
                translation={t}
            />
        )
        expect(getByText('Git (2)')).toBeTruthy()
        expect(getByText('Helm (2)')).toBeTruthy()
        expect(getByText('Object storage (2)')).toBeTruthy()
        userEvent.click(screen.getByText('Git (2)'))
        await waitFor(() => expect(screen.getByText('https://16.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Branch:', 'branch1', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Path:', 'foo', getByText)).toBeTruthy())
        await waitFor(() => expect(screen.getByText('https://165.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Branch:', 'branch2', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Path:', 'bar', getByText)).toBeTruthy())
        userEvent.click(screen.getByText('Helm (2)'))
        await waitFor(() => expect(screen.getByText('https://17.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Chart name:', 'abcde', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Package version:', '0.2.0', getByText)).toBeTruthy())
        await waitFor(() => expect(screen.getByText('https://175.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Chart name:', 'chrome', getByText)).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Package version:', '0.3.0', getByText)).toBeTruthy())
        userEvent.click(screen.getByText('Object storage (2)'))
        await waitFor(() => expect(screen.getByText('https://18.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Subfolder:', '/test', getByText)).toBeTruthy())
        await waitFor(() => expect(screen.getByText('https://185.com')).toBeTruthy())
        await waitFor(() => expect(getByTextMultiElement('Subfolder:', '/data', getByText)).toBeTruthy())
    })
})
