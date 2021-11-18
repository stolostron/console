/* Copyright Contributors to the Open Cluster Management project */

import { ClusterImageSet, ClusterPool, patchResource } from '../../../../../resources'
import { AcmSelect } from '@open-cluster-management/ui-components'
import { SelectOption } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecoilState } from 'recoil'
import { clusterImageSetsState } from '../../../../../atoms'
import { BulkActionModel } from '../../../../../components/BulkActionModel'

export type UpdateReleaseImageModalProps = {
    close?: () => void
    clusterPools?: ClusterPool[]
}

export function UpdateReleaseImageModal(props: UpdateReleaseImageModalProps) {
    const { t } = useTranslation()
    const [imageSets, setImageSets] = useState<Record<string, string>>({})
    const [clusterImageSets] = useRecoilState(clusterImageSetsState)

    const modalColumns = useMemo(
        () => [
            {
                header: t('Name'),
                cell: (clusterPool: ClusterPool) => (
                    <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>
                ),
                sort: 'metadata.name',
            },
            {
                header: t('Namespace'),
                sort: 'metadata.namespace',
                search: 'metadata.namespace',
                cell: (clusterPool: ClusterPool) => {
                    return clusterPool.metadata.namespace
                },
            },
            {
                header: t('Current release image'),
                cell: (clusterPool: ClusterPool) => {
                    const imageSet = clusterImageSets.find(
                        (cis) => cis.metadata.name === clusterPool.spec?.imageSetRef.name
                    )
                    return imageSet?.spec?.releaseImage
                },
            },
            {
                header: t('New release image'),
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
                            placeholder={t('Select release image')}
                            value={imageSets[clusterPool.metadata.uid!]}
                            onChange={(cis) => {
                                imageSets[clusterPool.metadata.uid!] = cis!
                                setImageSets({ ...imageSets })
                            }}
                        >
                            {clusterImageSets
                                ?.filter((cis) => cis.spec?.releaseImage !== currentImageSet?.spec!.releaseImage)
                                .filter((cis) => cis.metadata.labels?.visible === 'true')
                                .sort((a: ClusterImageSet, b: ClusterImageSet) => {
                                    return b.spec!.releaseImage.localeCompare(a.spec!.releaseImage)
                                })
                                .map((cis) => {
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
            title={t('Update release images')}
            action={t('Update')}
            processing={t('Updating')}
            resources={props.clusterPools ?? []}
            close={() => {
                props.close?.()
                setImageSets({})
            }}
            description={t(
                'Updating the release image for a cluster pool will change the default distribution version of clusters created from the cluster pool. Only newly created clusters from the cluster pool will be updated to the new version.'
            )}
            columns={modalColumns}
            keyFn={(clusterPool) => clusterPool.metadata.uid as string}
            actionFn={(clusterPool) => {
                return patchResource(clusterPool, [
                    { op: 'replace', path: '/spec/imageSetRef/name', value: imageSets[clusterPool.metadata.uid!] },
                ])
            }}
            showToolbar={false}
        />
    )
}
