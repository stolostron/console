/* Copyright Contributors to the Open Cluster Management project */

import { Popover } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import { DOC_LINKS, ViewDocumentationLink } from '../../../../../lib/doc-util'
import { AcmButton } from '../../../../../ui-components'

export function GlobalClusterSetPopover() {
  return (
    <Popover bodyContent={<ViewDocumentationLink doclink={DOC_LINKS.GLOBAL_CLUSTER_SET} />}>
      <AcmButton variant="link" style={{ padding: 0, paddingLeft: '6px' }}>
        <OutlinedQuestionCircleIcon />
      </AcmButton>
    </Popover>
  )
}
