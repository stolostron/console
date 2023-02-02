/* Copyright Contributors to the Open Cluster Management project */
import { Flex, FlexItem } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, UnknownIcon, InProgressIcon } from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { global_palette_green_500 as okColor, global_danger_color_100 as dangerColor } from '@patternfly/react-tokens'
import { CreateCredentialModal } from '../../../../../components/CreateCredentialModal'
import { useTranslation } from '../../../../../lib/acm-i18next'

import './ConditionsTable.css'

type ConditionsTableProps = {
  conditions?: {
    status: string
    type: string
    message: string
  }[]
  handleModalToggle: () => void
}

const ConditionsTable = ({ conditions, handleModalToggle }: ConditionsTableProps) => {
  const { t } = useTranslation()
  const okIcon = <CheckCircleIcon color={okColor.value} />
  return (
    <TableComposable variant="compact">
      <Thead>
        <Tr>
          <Th width={25}>{t('Condition')}</Th>
          <Th>{t('Message')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {conditions?.map((c) => {
          let createCredentialModal = undefined
          let icon = <UnknownIcon />
          if (c.status === 'True') {
            if (c.type === 'Progressing') {
              icon = <InProgressIcon size="sm" />
            } else if (c.type === 'Degraded') {
              icon = <ExclamationCircleIcon color={dangerColor.value} size="sm" />
            } else {
              icon = okIcon
            }
          } else if (c.status === 'False') {
            if (c.type === 'Progressing' || c.type === 'Degraded') {
              icon = okIcon
            } else {
              icon = <ExclamationCircleIcon color={dangerColor.value} size="sm" />
              if (c.type === 'ValidOIDCConfiguration') {
                // TBD need to decide where to put it
                createCredentialModal = <CreateCredentialModal handleModalToggle={handleModalToggle} />
              }
            }
          }

          return (
            <Tr key={c.type} className="hypershift-conditions-table__no-border">
              <Td>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>{icon}</FlexItem>
                  <FlexItem>{c.type}</FlexItem>
                </Flex>
              </Td>
              <Td span={8}>
                {c.message} {createCredentialModal}
              </Td>
            </Tr>
          )
        })}
      </Tbody>
    </TableComposable>
  )
}

export default ConditionsTable
