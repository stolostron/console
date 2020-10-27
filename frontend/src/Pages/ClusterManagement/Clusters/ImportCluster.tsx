import {
    AcmForm,
    AcmLabelsInput,
    AcmPage,
    AcmPageCard,
    AcmPageHeader,
    AcmSelect,
    AcmTextInput,
} from '@open-cluster-management/ui-components'
import { ActionGroup, Button } from '@patternfly/react-core'
import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../ClusterManagement'
import { ManagedCluster, managedClusters } from '../../../lib/ManagedCluster'
import { createProject } from '../../../lib/Project'

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
    const onSubmit = async () => {
        const response = await createProject(clusterName)
        return response
    }
    return (
        <AcmPageCard>
            <AcmForm>
                <AcmTextInput
                    id="clusterName"
                    label="Cluster name"
                    value={clusterName}
                    onChange={setClusterName}
                    placeholder="Enter a name for the cluster"
                    required
                />
                <AcmSelect
                    id="cloudLabel"
                    label="Cloud"
                    value={cloudLabel}
                    onChange={setCloudLabel}
                    options={['auto-detect', 'AWS', 'GCP', 'Azure', 'IBM', 'VMWare', 'Datacenter', 'Baremetal']}
                    placeholder="Select a cloud provider label for the cluster"
                />
                <AcmSelect
                    id="environmentLabel"
                    label="Environment"
                    value={environmentLabel}
                    onChange={setEnvironmentLabel}
                    options={['dev', 'prod', 'qa']}
                    placeholder="Select an environment label for the cluster"
                />
                <AcmLabelsInput
                    id="additionalLabels"
                    label="Additional labels"
                    value={additionalLabels}
                    onChange={setAdditionaLabels}
                />
                <ActionGroup>
                    <Button variant="primary" isDisabled={!clusterName} onClick={onSubmit}>
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
