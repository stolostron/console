/* Copyright Contributors to the Open Cluster Management project */

import { /*IResource, patchResource*/ Cluster } from '../../../../../resources'
import { AcmForm, AcmModal, AcmSelect, AcmTable, IAcmTableColumn } from '../../../../../ui-components'
import { validClusterCuratorTemplatesValue } from '../../../../../selectors'
import { clusterCuratorsState } from '../../../../../atoms'
import {
    ActionGroup,
    Button,
    ModalVariant,
    SelectOption,
    Split,
    SplitItem,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilValue } from 'recoil'
import { Link } from 'react-router-dom'
import { useClusterDistributionColumn, useClusterProviderColumn } from '../ManagedClusters'

export function UpdateAutomationModal(props: { close: () => void; open: boolean; clusters: Cluster[] }): JSX.Element {
    const { t } = useTranslation()
    // const templatedCurators = useRecoilValue(clusterCuratorTemplatesValue)
    const validCuratorTemplates = useRecoilValue(validClusterCuratorTemplatesValue)
    const clusterCurators = useRecoilValue(clusterCuratorsState)

    const [selectedCuratorTemplateUid, setSelectedCuratorTemplateUid] = useState<string>()
    console.log('clusters', props.clusters)
    console.log('validCuratorTemplates', validCuratorTemplates)
    console.log('TemplatedCurators', clusterCurators)

    const clusterProviders = useClusterProviderColumn()
    const distributionVersion = useClusterDistributionColumn(clusterCurators)
    const addAutomationTemplateColumns = useMemo<IAcmTableColumn<Cluster>[]>(
        () => [
            {
                header: t('Name'),
                cell: (cluster: Cluster) => cluster.name,
                sort: 'cluster.name',
            },
            clusterProviders,
            distributionVersion,
        ],
        [t, clusterProviders]
    )

    return (
        <AcmModal
            title={t('Update automation template')}
            isOpen={props.open}
            variant={ModalVariant.small}
            onClose={props.close}
        >
            <Stack hasGutter>
                {/* <StackItem> */}
                {/* TODO - MANAGE ALERT */}
                {/* NO MANAGED SERVICE - IE ROKS - HAS TO BE OCP CLUSTER */}
                {/* {nonUpdateableClusters ? (
                        <AcmAlert
                            variant="warning"
                            title={t(`{0} cluster cannot be edited`), {nonUpdateableClusters.length}}
                            message={t('Automation for other Kubernetes services and non-OCP clusters are not supported')}
                        />
                    ) : (
                        // INSERT BELOW
                    )} */}
                {/* </StackItem> */}

                <StackItem>{t('Update the automation template for the selected clusters.')}</StackItem>
                <StackItem>
                    <Split>
                        <SplitItem isFilled>
                            <AcmSelect
                                id="curator-templates"
                                label={t('New template')}
                                maxHeight="12em"
                                menuAppendTo="parent"
                                onChange={(key) => setSelectedCuratorTemplateUid(key)}
                                value={selectedCuratorTemplateUid}
                                placeholder={t('Select a template')}
                            >
                                {validCuratorTemplates.map((templates) => (
                                    <SelectOption key={templates.metadata.uid} value={templates.metadata.uid}>
                                        {templates.metadata.name}
                                    </SelectOption>
                                ))}
                            </AcmSelect>
                        </SplitItem>
                        <SplitItem>
                            <Link to={'#'}>View selected template</Link>
                        </SplitItem>
                    </Split>
                </StackItem>
                <StackItem>
                    <AcmTable
                        columns={addAutomationTemplateColumns}
                        items={props.clusters}
                        plural={'Clusters'}
                        keyFn={(c: Cluster) => c.name as string}
                        autoHidePagination={true}
                    />
                </StackItem>
            </Stack>
            <AcmForm style={{ gap: 0 }}>
                <ActionGroup>
                    <Button variant="link" onClick={props.close}>
                        {t('cancel')}
                    </Button>
                </ActionGroup>
            </AcmForm>
        </AcmModal>
    )
}


// Patch clusterCurator
// Create resource if not existent