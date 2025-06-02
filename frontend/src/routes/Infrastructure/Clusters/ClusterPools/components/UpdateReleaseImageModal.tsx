/* Copyright Contributors to the Open Cluster Management project */

import { ClusterImageSet, ClusterPool } from '../../../../../resources'
import { patchResource } from '../../../../../resources/utils'
import { AcmSelect } from '../../../../../ui-components'
import { SelectOption } from '@patternfly/react-core'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { useRecoilValue, useSharedAtoms } from '../../../../../shared-recoil'
import { BulkActionModal } from '../../../../../components/BulkActionModal'

export type UpdateReleaseImageModalProps = {
  close?: () => void
  clusterPools?: ClusterPool[]
}

export function UpdateReleaseImageModal(props: UpdateReleaseImageModalProps) {
  const { t } = useTranslation()
  const [imageSets, setImageSets] = useState<Record<string, string>>({})
  const { clusterImageSetsState } = useSharedAtoms()
  const clusterImageSets = useRecoilValue(clusterImageSetsState)

  const modalColumns = useMemo(
    () => [
      {
        header: t('table.name'),
        cell: (clusterPool: ClusterPool) => <span style={{ whiteSpace: 'nowrap' }}>{clusterPool.metadata.name}</span>,
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
          const imageSet = clusterImageSets.find((cis) => cis.metadata.name === clusterPool.spec?.imageSetRef.name)
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
              placeholder={t('clusterPool.selectReleaseImage')}
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
                  const version = releaseImage?.slice(tagStartIndex + 1, releaseImage.indexOf('-', tagStartIndex))
                  return (
                    <SelectOption key={cis.metadata.name} value={cis.metadata.name} description={releaseImage}>
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
    <>
      {!!props.clusterPools?.length && (
        <BulkActionModal<ClusterPool>
          open
          title={t('bulk.title.updateReleaseImage')}
          action={t('update')}
          processing={t('updating')}
          items={props.clusterPools}
          emptyState={undefined} // at least 1 clusterPool is always supplied
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
          showToolbar={false}
        />
      )}
    </>
  )
}
