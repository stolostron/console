import { ActionGroup, Button } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { AcmForm } from '../../../components/AcmForm'
import { AcmLabelsInput } from '../../../components/AcmLabelsInput'
import { AcmPage, AcmPageCard, AcmPageHeader } from '../../../components/AcmPage'
import { AcmSelect } from '../../../components/AcmSelect'
import { AcmTextInput } from '../../../components/AcmTextInput'
import { NavigationPath } from '../ClusterManagement'

export function ImportClusterPage() {
    return (
        <AcmPage>
            <AcmPageHeader title="Import Cluster" />
            <ImportClusterPageContent />
        </AcmPage>
    )
}

export function ImportClusterPageContent() {
    const history = useHistory()
    const [clusterName, setClusterName] = useState<string | undefined>()
    const [cloudLabel, setCloudLabel] = useState<string | undefined>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<string[]>([])

    return (
        <AcmPageCard>
            <AcmForm>
                <AcmTextInput
                    id="clusterName"
                    label="Cluster Name"
                    value={clusterName}
                    onChange={setClusterName}
                    placeholder="Enter a name for the cluster"
                    required
                />
                <AcmSelect
                    id="cloudLabel"
                    label="Cloud Provider Label"
                    value={cloudLabel}
                    onChange={setCloudLabel}
                    options={['auto-detect', 'Amazon', 'Google', 'Microsoft']}
                    placeholder="Select a cloud provider label for the cluster"
                />
                <AcmSelect
                    id="environmentLabel"
                    label="Environment Label"
                    value={environmentLabel}
                    onChange={setEnvironmentLabel}
                    options={['dev', 'qa']}
                    placeholder="Select an environment label for the cluster"
                />
                <AcmLabelsInput
                    id="additionalLabels"
                    label="Additional Labels"
                    value={additionalLabels}
                    onChange={setAdditionaLabels}
                />
                <ActionGroup>
                    <Button variant="primary" isDisabled={!clusterName} onClick={() => {}}>
                        Generate command
                    </Button>
                    <Button
                        variant="link"
                        onClick={() => {
                            history.push(NavigationPath.clusters)
                        }}
                    >
                        Cancel
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmPageCard>
    )
}
