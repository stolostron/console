/* Copyright Contributors to the Open Cluster Management project */

import { List, ListComponent, ListItem, OrderType, Title } from '@patternfly/react-core'
import { Trans, useTranslation } from '../../../../../../../lib/acm-i18next'
import InstructionCommand from './InstructionCommand'
import { DOC_LINKS } from '../../../../../../../lib/doc-util'

export const StepCreateNetwork = () => {
  const [t] = useTranslation()

  return (
    <>
      <Title headingLevel="h3">
        {t('Create a Virtual Private Network (VPC) and necessary networking components.')}
      </Title>

      <List component={ListComponent.ol} type={OrderType.number}>
        <ListItem>
          {t('To create a Virtual Private Netwowrk (VPC) and all the necessary components, run this command:')}
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <InstructionCommand textAriaLabel="Copyable ROSA create account-roles command" className="pf-v6-u-mt-md">
            rosa create network
          </InstructionCommand>
        </ListItem>
      </List>
      <div className="pf-v6-u-mt-md">
        <Trans
          i18nKey="Learn more about the <createNetworkLink>create network command</createNetworkLink> and other ways to <createVPCLink>create a VPC</createVPCLink>"
          components={{
            createNetworkLink: (
              <a target="_blank" href={DOC_LINKS.ROSA_CREATE_NETWORK}>
                {}
              </a>
            ),
            createVPCLink: (
              <a target="_blank" href={DOC_LINKS.CREATE_VPC_WAYS}>
                {}
              </a>
            ),
          }}
        />
      </div>
    </>
  )
}
