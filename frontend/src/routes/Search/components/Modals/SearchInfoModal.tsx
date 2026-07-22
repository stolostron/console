/* Copyright Contributors to the Open Cluster Management project */
import {
  Content,
  ContentVariants,
  Divider,
  Flex,
  FlexItem,
  Label,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { useTranslation } from '../../../../lib/acm-i18next'

export const SearchInfoModal = (props: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()
  return (
    <Modal variant={ModalVariant.medium} isOpen={props.isOpen} onClose={props.onClose}>
      <ModalHeader title={t('Search guide')} />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Content component={ContentVariants.p}>
              {t('Use keywords or property filters to search for resources.')}
            </Content>
          </StackItem>
          <Divider />
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Content component={ContentVariants.p}>
                  {t('To search for a keyword, type the word in the search box.')}
                </Content>
              </StackItem>
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} columnGap={{ default: 'columnGapMd' }}>
                  <FlexItem>
                    <Label variant="outline" isCompact>
                      {t('Type')}
                    </Label>
                  </FlexItem>
                  <FlexItem>{t('OpenShift')}</FlexItem>
                </Flex>
              </StackItem>
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} columnGap={{ default: 'columnGapMd' }}>
                  <FlexItem>
                    <Label variant="outline" isCompact>
                      {t('Show')}
                    </Label>
                  </FlexItem>
                  <FlexItem>{t('A list of resources that contain the keyword "OpenShift" in any field.')}</FlexItem>
                </Flex>
              </StackItem>
            </Stack>
          </StackItem>
          <Divider />
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Content component={ContentVariants.p}>
                  {t(
                    'To search for resources with a given property value, type or select the property name from the autocomplete list. Then type or select the value for the selected property filter.'
                  )}
                </Content>
              </StackItem>
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} columnGap={{ default: 'columnGapMd' }}>
                  <FlexItem>
                    <Label variant="outline" isCompact>
                      {t('Type')}
                    </Label>
                  </FlexItem>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <FlexItem>status:failed,pending</FlexItem>
                </Flex>
              </StackItem>
              <StackItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} columnGap={{ default: 'columnGapMd' }}>
                  <FlexItem>
                    <Label variant="outline" isCompact>
                      {t('Show')}
                    </Label>
                  </FlexItem>
                  <FlexItem>{t('Resources with "failed" or "pending" status.')}</FlexItem>
                </Flex>
              </StackItem>
            </Stack>
          </StackItem>
          <Divider />
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Content component={ContentVariants.p}>{t('Additional information:')}</Content>
              </StackItem>
              <StackItem>
                <List>
                  <ListItem>
                    {t('You can include any combination of filters and keywords to make your search more specific.')}
                  </ListItem>
                  <ListItem>
                    {t(
                      'You can apply multiple values to the same property filter. First, type or select the filter name, then select the value. Both values combine into a single filter.'
                    )}
                  </ListItem>
                  <ListItem>
                    {t(
                      'You can include an operator (<=, >=, !=, !, =, <, >) before a value selection to enhance your search. The search: name:!resourceName, would return all resources not named resourceName.'
                    )}
                  </ListItem>
                </List>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </ModalBody>
    </Modal>
  )
}
