import { useMemo } from 'react'
import { useHistory } from 'react-router'
import { onCancel, onSubmit } from '../common/utils'
import { ApplicationWizard } from './ApplicationWizard'

export function ApplicationExample() {
    const history = useHistory()
    const namespaces = useMemo(() => ['default', 'namespace-1', 'namespace-2'], [])
    const servers = useMemo(() => ['default', 'server-1', 'server-2'], [])
    const ansibleCredentials = useMemo(() => ['credential1', 'credential2'], [])
    const placements = useMemo(() => ['placement-1', 'placement-2'], [])
    const channels = useMemo(
        () => [
            { metadata: { name: 'helm-channel-1', namespace: 'helm-channel-1' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'helm-channel-2', namespace: 'helm-channel-2' }, spec: { pathname: 'https://test.com', type: 'HelmRepo' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
            { metadata: { name: 'git-channel-1', namespace: 'git-channel-1' }, spec: { pathname: 'https://test.com', type: 'Git' } },
        ],
        []
    )
    const timeZones = useMemo(() => ['EST'], [])
    return (
        <ApplicationWizard
            addClusterSets="https://github.com/patternfly-labs/react-form-wizard"
            ansibleCredentials={ansibleCredentials}
            argoServers={servers}
            namespaces={namespaces}
            onSubmit={onSubmit}
            onCancel={() => onCancel(history)}
            placements={placements}
            channels={channels}
            timeZones={timeZones}
        />
    )
}
