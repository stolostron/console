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
import { createManagedCluster } from '../../../lib/ManagedCluster'
import { createKlusterletAddonConfig } from '../../../lib/KlusterletAddonConfig'
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
    const [clusterName, setClusterName] = useState<string>('')
    const [cloudLabel, setCloudLabel] = useState<string>('auto-detect')
    const [environmentLabel, setEnvironmentLabel] = useState<string | undefined>()
    const [additionalLabels, setAdditionaLabels] = useState<string[] | undefined>([])
    const onSubmit = async () => {
        const clusterLabels = { cloud: cloudLabel ?? '', vendor: 'auto-detect', name: clusterName, environment: environmentLabel ?? '' }
        const projectResponse = await createProject(clusterName)
        const response = await Promise.all([
            createKlusterletAddonConfig({ clusterName, clusterLabels}),
            createManagedCluster({ clusterName, clusterLabels })
        ])
        // const kacResponse = await createKlusterletAddonConfig({
        //     clusterName,
        //     clusterLabels
        // })
        const mcResponse = await createManagedCluster({ clusterName, clusterLabels })
        console.log('RESPONSE', response)
        return projectResponse
    }
    return (
        <AcmPageCard>
            <AcmForm>
                <AcmTextInput
                    id="clusterName"
                    label="Cluster name"
                    value={clusterName}
                    onChange={(name) => setClusterName(name ?? '')}
                    placeholder="Enter a name for the cluster"
                    required
                />
                <AcmSelect
                    id="cloudLabel"
                    label="Cloud"
                    value={cloudLabel}
                    onChange={(label) => setCloudLabel(label ?? '')}
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
                    buttonLabel="Add label"
                    value={additionalLabels}
                    onChange={(label) => setAdditionaLabels(label)}
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
