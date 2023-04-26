/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@mui/styles'
import { ExpandableSection, ModalVariant, Button, ButtonVariant } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { ClusterCurator, ClusterCuratorAnsibleJob, Curation, CuratorAction, curatorActionHasJobs } from '../resources'
import { AcmModal } from '../ui-components'
import { useTranslation } from '../lib/acm-i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { NavigationPath } from '../NavigationPath'
import { useState } from 'react'

export interface ITemplateSummaryModalProps {
  curatorTemplate: ClusterCurator
  isOpen: boolean
  close: () => void
}

const useStyles = makeStyles({
  expandableSection: {
    paddingTop: '20px',
  },
  linkOut: { paddingBottom: '15px' },
  externalLinkIcon: { marginLeft: '4px', verticalAlign: 'middle' },
})

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
  const classes = useStyles()

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
          className={classes.expandableSection}
          toggleText={t('Upgrade')}
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
  const classes = useStyles()

  let preLabel, postLabel
  switch (curation) {
    case 'install':
      preLabel = t('template.preInstall.name')
      postLabel = t('template.postInstall.name')
      break
    case 'upgrade':
      preLabel = t('template.preUpgrade.name')
      postLabel = t('template.postUpgrade.name')
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
      <div className={classes.expandableSection}>
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
    <TableComposable aria-label={stage} variant={'compact'}>
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
    </TableComposable>
  ) : (
    <></>
  )
}

export function TemplateLinkOutControl(props: { control?: any }) {
  const { control } = props
  const classes = useStyles()
  const isActive = control?.step.controls?.find((cc: any) => cc.id === 'templateName')?.active
  const clusterCuratorTemplates = control?.step.controls?.find((cc: any) => cc.id === 'templateName').availableData
  const selectedTemplate = clusterCuratorTemplates.find((cc: any) => cc.metadata.name === isActive)

  return (
    <div className={classes.linkOut}>
      {' '}
      <TemplateLinkOut templateCurator={selectedTemplate} />{' '}
    </div>
  )
}

export function TemplateLinkOut(props: { templateCurator?: ClusterCurator }) {
  const { templateCurator } = props
  const { t } = useTranslation()
  const classes = useStyles()
  if (!templateCurator) {
    return <></>
  }
  return (
    <div>
      <Button isInline variant={ButtonVariant.link}>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`${NavigationPath.editAnsibleAutomation
            .replace(':namespace', templateCurator.metadata?.namespace as string)
            .replace(':name', templateCurator.metadata?.name as string)}`}
          style={{ fontSize: '14px' }}
        >
          {t('View {{templateName}}', { templateName: templateCurator.metadata.name })}
        </a>
        <ExternalLinkAltIcon
          style={{ marginLeft: '6px', verticalAlign: 'middle' }}
          className={classes.externalLinkIcon}
        />
      </Button>
    </div>
  )
}
