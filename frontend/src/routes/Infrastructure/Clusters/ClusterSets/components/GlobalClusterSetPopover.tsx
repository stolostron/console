/* Copyright Contributors to the Open Cluster Management project */

import { Popover, TextContent } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { Trans, useTranslation } from '../../../../../lib/acm-i18next'
import { DOC_LINKS, viewDocumentation } from '../../../../../lib/doc-util'
import { AcmButton } from '../../../../../ui-components'

export function GlobalClusterSetPopover() {
  const { t } = useTranslation()
  return (
    <Popover
      bodyContent={
        <>
          <Trans i18nKey="learn.global.clusterSet" components={{ bold: <strong /> }} />
          <TextContent>{viewDocumentation(DOC_LINKS.GLOBAL_CLUSTER_SET, t)}</TextContent>
        </>
      }
    >
      <AcmButton variant="link" style={{ padding: 0, paddingLeft: '6px' }}>
        <OutlinedQuestionCircleIcon />
      </AcmButton>
    </Popover>
  )
}
