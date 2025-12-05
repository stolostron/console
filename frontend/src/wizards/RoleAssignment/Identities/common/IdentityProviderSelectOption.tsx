/* Copyright Contributors to the Open Cluster Management project */

import { Label, Flex, FlexItem, SelectOption } from '@patternfly/react-core'
import { getTypeColor } from './utils'
import { IdentityProvider } from '../../../../resources/oauth'

export interface IdentityProviderSelectOptionProps {
  identityProvider: IdentityProvider
}

export const IdentityProviderSelectOption = ({ identityProvider }: IdentityProviderSelectOptionProps) => (
  <SelectOption key={identityProvider.name} value={identityProvider.name}>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Label color={getTypeColor(identityProvider.type)}>{identityProvider.type}</Label>
      </FlexItem>
      <FlexItem>{identityProvider.name}</FlexItem>
    </Flex>
  </SelectOption>
)
