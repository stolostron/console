/* Copyright Contributors to the Open Cluster Management project */

import { AcmSelect } from '@open-cluster-management/ui-components'
import { SelectOption } from '@patternfly/react-core'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { BulkActionModel } from '../../../../components/BulkActionModel'
import { patchResource } from '../../../../lib/resource-request'
import { ClusterPool } from '../../../../resources/cluster-pool'
import { ClusterImageSet } from '../../../../resources/cluster-image-set'
import { clusterImageSetsState } from '../../../../atoms'

export type UpdateReleaseImageModalProps = {
    close?: () => void
    clusterPools?: ClusterPool[]
}

export function UpdateReleaseImageModal(props: UpdateReleaseImageModalProps) {
    const { t } = useTranslation(['cluster', 'common'])
    const [imageSets, setImageSets] = useState<Record<string, string>>({})
    const [clusterImageSets] = useRecoilState(clusterImageSetsState)

    const modalColumns = useMemo(
        () => [
            {
                header: t('table.name'),
                cell: (clusterPool: ClusterPool) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>
                ),
                sort: 'metadata.name',
            },
            {
                header: t('table.namespace'),
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
                cell: (clusterPool: ClusterPool) => {
                    return clusterPool.metadata.namespace
                },
            },
            {
                header: t('table.currentReleaseImage'),
                cell: (clusterPool: ClusterPool) => {
                    const imageSet = clusterImageSets.find(
                        (cis) => cis.metadata.name === clusterPool.spec?.imageSetRef.name
                    )
                    return imageSet?.spec?.releaseImage
                },
            },
            {
                header: t('table.newReleaseImage'),
                cell: (clusterPool: ClusterPool) => {
                    const currentImageSet = clusterImageSets.find(
                        (cis) => cis.metadata.name === clusterPool.spec?.imageSetRef.name
                    )
                    return (
                        <AcmSelect
                            id="releaseImage"
                            maxHeight={'6em'}
                            isRequired
                            label=""
                            placeholder={t('common:select')}
                            value={imageSets[clusterPool.metadata.uid!]}
                            onChange={(cis) => {
                                imageSets[clusterPool.metadata.uid!] = cis!
                                setImageSets({ ...imageSets })
                            }}
                        >
                            {clusterImageSets
                                ?.filter((cis) => cis.spec?.releaseImage !== currentImageSet?.spec!.releaseImage)
                                ?.sort((a: ClusterImageSet, b: ClusterImageSet) => {
                                    return b.spec!.releaseImage.localeCompare(a.spec!.releaseImage)
                                })
                                ?.map((cis) => {
                                    const releaseImage = cis?.spec?.releaseImage
                                    const tagStartIndex = releaseImage?.indexOf(':') ?? 0
                                    const version = releaseImage?.slice(
                                        tagStartIndex + 1,
                                        releaseImage.indexOf('-', tagStartIndex)
                                    )
                                    return (
                                        <SelectOption
                                            key={cis.metadata.name}
                                            value={cis.metadata.name}
                                            description={releaseImage}
                                        >
                                            {`OpenShift ${version}`}
                                        </SelectOption>
                                    )
                                })}
                        </AcmSelect>
                    )
                },
            },
        ],
        [t, clusterImageSets, imageSets]
    )

    return (
        <BulkActionModel<ClusterPool>
            open={props.clusterPools?.length !== undefined}
            title={t('bulk.title.updateReleaseImage')}
            action={t('common:update')}
            processing={t('common:updating')}
            resources={props.clusterPools ?? []}
            close={() => {
                props.close?.()
                setImageSets({})
            }}
            description={t('bulk.message.updateReleaseImage')}
            columns={modalColumns}
            keyFn={(clusterPool) => clusterPool.metadata.uid as string}
            actionFn={(clusterPool) => {
                return patchResource(clusterPool, [
                    { op: 'replace', path: '/spec/imageSetRef/name', value: imageSets[clusterPool.metadata.uid!] },
                ])
            }}
        />
    )
}
