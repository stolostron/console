/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'
import { Button, ButtonVariant, ExpandableSection } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { useState } from 'react'
import { generatePath } from 'react-router-dom-v5-compat'
import { useTranslation } from '../lib/acm-i18next'
import { NavigationPath } from '../NavigationPath'
import { ClusterCurator, ClusterCuratorAnsibleJob, Curation, CuratorAction, curatorActionHasJobs } from '../resources'
import { AcmModal } from '../ui-components'

export interface ITemplateSummaryModalProps {
  curatorTemplate: ClusterCurator
  isOpen: boolean
  close: () => void
}

const expandableSection = css({ paddingTop: '20px' })
const linkOut = css({ paddingBottom: '15px' })
const externalLinkIcon = css({ marginLeft: '4px', verticalAlign: 'middle' })

export function TemplateSummaryControl(props: { control?: any }) {
  const { control } = props

  const isActive = control?.step.controls?.find((cc: any) => cc.id === 'templateName')?.active
  const clusterCuratorTemplates = control?.step.controls?.find((cc: any) => cc.id === 'templateName').availableData
  const selectedTemplate = clusterCuratorTemplates.find((cc: any) => cc.metadata.name === isActive)

  return <TemplateSummaryExpandable clusterCurator={selectedTemplate} />
}

export function TemplateSummaryExpandable(props: { clusterCurator?: ClusterCurator }) {
  const { clusterCurator } = props
  const { t } = useTranslation()
  const [isInstallExpandableOpen, setInstallExpandable] = useState<boolean>(true)
  const [isUpgradeExpandableOpen, setUpgradeExpandable] = useState<boolean>(true)

  if (!clusterCurator) {
    return <></>
  }

  const installAction = clusterCurator.spec?.install
  const upgradeAction = clusterCurator.spec?.upgrade

  return (
    <div>
      {installAction && curatorActionHasJobs(installAction) && (
        <ExpandableSection
          onToggle={() => setInstallExpandable(!isInstallExpandableOpen)}
          isExpanded={isInstallExpandableOpen}
          toggleText={t('install')}
          isIndented
        >
          <PrePostTemplatesList curation="install" curatorAction={installAction} />
        </ExpandableSection>
      )}
      {upgradeAction && curatorActionHasJobs(upgradeAction) && (
        <ExpandableSection
          onToggle={() => setUpgradeExpandable(!isUpgradeExpandableOpen)}
          isExpanded={isUpgradeExpandableOpen}
          className={expandableSection}
          toggleText={t('Update')}
          isIndented
        >
          <PrePostTemplatesList curation="upgrade" curatorAction={upgradeAction} />
        </ExpandableSection>
      )}
      {/* {curator.spec?.scale && <ExpandableSection></ExpandableSection>}
            {curator.spec?.destroy && <ExpandableSection></ExpandableSection>} */}
    </div>
  )
}

export default function TemplateSummaryModal(props: ITemplateSummaryModalProps) {
  const { curatorTemplate, isOpen, close } = props
  const { t } = useTranslation()
  return (
    <AcmModal
      title={t('Automation template for {{curatorName}}', { curatorName: curatorTemplate.metadata.name })}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={close}
      position="top"
    >
      <TemplateSummaryExpandable clusterCurator={curatorTemplate}></TemplateSummaryExpandable>
    </AcmModal>
  )
}

export function PrePostTemplatesList(props: { curation: Curation; curatorAction: CuratorAction }) {
  const { curation, curatorAction } = props
  const { t } = useTranslation()

  let preLabel, postLabel
  switch (curation) {
    case 'install':
      preLabel = t('template.preInstall.name')
      postLabel = t('template.postInstall.name')
      break
    case 'upgrade':
      preLabel = t('template.preUpdate.name')
      postLabel = t('template.postUpdate.name')
      break
    /* istanbul ignore next */
    case 'scale': // scale not currently supported
      preLabel = t('template.preScale.name')
      postLabel = t('template.postScale.name')
      break
    /* istanbul ignore next */
    case 'destroy': // destroy not currently supported
      preLabel = t('template.preDestroy.name')
      postLabel = t('template.postDestroy.name')
      break
  }

  return (
    <>
      <ComposableTable
        stage={preLabel}
        curatorJobs={curatorAction.prehook?.map((job: ClusterCuratorAnsibleJob) => ({
          name: job.name,
          type: job.type,
        }))}
      ></ComposableTable>
      <div className={expandableSection}>
        <ComposableTable
          stage={postLabel}
          curatorJobs={curatorAction.posthook?.map((job: ClusterCuratorAnsibleJob) => ({
            name: job.name,
            type: job.type,
          }))}
        ></ComposableTable>
      </div>
    </>
  )
}

function ComposableTable(props: { stage: string; curatorJobs?: { name: string; type?: string }[] }) {
  const { curatorJobs, stage } = props
  const { t } = useTranslation()

  return curatorJobs && curatorJobs.length > 0 ? (
    <Table aria-label={stage} variant={'compact'}>
      <Thead>
        <Tr>
          <Th>{stage}</Th>
          <Th width={30}>{t('Template Type')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {curatorJobs.map((job, i) => (
          <Tr key={`${job.name}-${job.type}-${i}`}>
            <Td dataLabel={stage}>{job.name}</Td>
            <Td dataLabel={t('Template Type')}>{job.type}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  ) : (
    <></>
  )
}

export function TemplateLinkOutControl(props: { control?: any }) {
  const { control } = props
  const isActive = control?.step.controls?.find((cc: any) => cc.id === 'templateName')?.active
  const clusterCuratorTemplates = control?.step.controls?.find((cc: any) => cc.id === 'templateName').availableData
  const selectedTemplate = clusterCuratorTemplates.find((cc: any) => cc.metadata.name === isActive)

  return (
    <div className={linkOut}>
      {' '}
      <TemplateLinkOut templateCurator={selectedTemplate} />{' '}
    </div>
  )
}

export function TemplateLinkOut(props: { templateCurator?: ClusterCurator }) {
  const { templateCurator } = props
  const { t } = useTranslation()
  if (!templateCurator) {
    return <></>
  }
  return (
    <div>
      <Button
        icon={
          <ExternalLinkAltIcon style={{ marginLeft: '6px', verticalAlign: 'middle' }} className={externalLinkIcon} />
        }
        isInline
        variant={ButtonVariant.link}
      >
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={generatePath(NavigationPath.editAnsibleAutomation, {
            namespace: templateCurator.metadata?.namespace!,
            name: templateCurator.metadata?.name!,
          })}
          style={{ fontSize: '14px' }}
        >
          {t('View {{templateName}}', { templateName: templateCurator.metadata.name })}
        </a>
      </Button>
    </div>
  )
}
