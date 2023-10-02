/* Copyright Contributors to the Open Cluster Management project */

import { ExpandableSection } from "@patternfly/react-core"
import { AcmButton } from "../../../../../../ui-components"
import { TFunction } from "i18next"
import { ExternalLinkAltIcon } from "@patternfly/react-icons"
import { DOC_LINKS } from "../../../../../../lib/doc-util"
import { HypershiftDiagram } from "./HypershiftDiagram"

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
      style={{ paddingTop: '24px', backgroundColor: 'var(--pf-global--BackgroundColor--light-300)' }}
      isExpanded={isDiagramExpanded}
      onToggle={onDiagramToggle}
      toggleContent={
        <>
          <span style={{ color: 'var(--pf-global--Color--100)', display: 'block', textAlign: 'left' }}>
            {`${t('Compare control plane types')}`}
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
            {`${t('Learn more about control plane types')}`}
          </AcmButton>
        </>
      }
    >
      <HypershiftDiagram />
    </ExpandableSection>
  )
}
