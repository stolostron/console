/* Copyright Contributors to the Open Cluster Management project */
import { Flex, FlexItem, Icon } from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, UnknownIcon, InProgressIcon } from '@patternfly/react-icons'
import { Table /* data-codemods */, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { CreateCredentialModal } from '../../../../../components/CreateCredentialModal'
import { useTranslation } from '../../../../../lib/acm-i18next'

import './ConditionsTable.css'

type ConditionsTableProps = {
  conditions?: {
    reason?: string
    status: string
    type: string
    message?: string
  }[]
  handleModalToggle: () => void
}

const ConditionsTable = ({ conditions, handleModalToggle }: ConditionsTableProps) => {
  const { t } = useTranslation()
  const okIcon = (
    <Icon status="success">
      <CheckCircleIcon />
    </Icon>
  )
  const arrayForSort = conditions && [...conditions]
  const priority = ['False', 'Unknown', 'True']

  const sortedConditions = arrayForSort?.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))

  const outliers = sortedConditions?.filter(
    (condition) => condition.status === 'False' && condition.reason === 'AsExpected'
  )

  outliers?.forEach((outlier) => {
    sortedConditions?.push(
      ...sortedConditions.splice(
        sortedConditions.findIndex((v) => v === outlier),
        1
      )
    )
  })

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th width={25}>{t('Condition')}</Th>
          <Th>{t('Message')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortedConditions?.map((c) => {
          let createCredentialModal = undefined
          let icon = <UnknownIcon />
          if (c.status === 'True') {
            if (c.type.endsWith('Progressing')) {
              icon = (
                <Icon size="sm">
                  <InProgressIcon />
                </Icon>
              )
            } else if (c.type === 'Degraded') {
              icon = (
                <Icon status="danger" size="sm">
                  <ExclamationCircleIcon />
                </Icon>
              )
            } else {
              icon = okIcon
            }
          } else if (c.status === 'False') {
            if (c.type.endsWith('Progressing') || c.type === 'Degraded') {
              icon = okIcon
            } else {
              icon = (
                <Icon status="danger" size="sm">
                  <ExclamationCircleIcon />
                </Icon>
              )
              if (c.type === 'ValidOIDCConfiguration') {
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
    </Table>
  )
}

export default ConditionsTable
