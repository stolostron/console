/* Copyright Contributors to the Open Cluster Management project */

import { ExpandableSection } from '@patternfly/react-core'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'
import { DOC_LINKS } from '../../../../../../lib/doc-util'
import { AcmButton } from '../../../../../../ui-components'
import { HypershiftDiagram } from './HypershiftDiagram'

type HypershiftDiagramExpandProps = {
  isDiagramExpanded: boolean
  onDiagramToggle: (arg0: boolean) => void
  setIsMouseOverControlPlaneLink: (arg0: boolean) => void
  t: TFunction
}

export const HypershiftDiagramExpand = (props: HypershiftDiagramExpandProps) => {
  const { isDiagramExpanded, onDiagramToggle, setIsMouseOverControlPlaneLink, t } = props

  return (
    <ExpandableSection
      style={{
        paddingTop: '24px',
      }}
      isExpanded={isDiagramExpanded}
      onToggle={(_event, isExpanded) => onDiagramToggle(isExpanded)}
      toggleContent={
        <>
          <span
            style={{
              color: 'var(--pf-t--global--text--color--regular)',
              display: 'block',
              textAlign: 'left',
            }}
          >
            {t('Compare control plane types')}
          </span>
          <AcmButton
            variant="link"
            icon={<ExternalLinkAltIcon style={{ fontSize: '14px' }} />}
            iconPosition="right"
            isInline
            onClick={() => window.open(DOC_LINKS.HYPERSHIFT_INTRO, '_blank')}
            onMouseEnter={() => setIsMouseOverControlPlaneLink(true)}
            onMouseLeave={() => setIsMouseOverControlPlaneLink(false)}
          >
            {t('Learn more about control plane types')}
          </AcmButton>
        </>
      }
    >
      <HypershiftDiagram />
    </ExpandableSection>
  )
}
