import { useCallback } from 'react'
import {
  Modal,
  ModalHeader,
  Title,
  Content,
  ContentVariants,
  ModalBody,
  Stack,
  StackItem,
  FormGroup,
  Popover,
  Button,
  Flex,
  FlexItem,
  SelectOption,
  EmptyState,
  EmptyStateBody,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ModalFooter,
} from '@patternfly/react-core'
import { HelpIcon, PlusCircleIcon } from '@patternfly/react-icons'
import { AcmSelectBase } from '~/components/AcmSelectBase'
import { useTranslation } from '~/lib/acm-i18next'
import { getTypedCreateCredentialsPath } from '~/routes/Credentials/CreateCredentialsCatalog'
import { Provider } from '~/ui-components'
import { useCredentialsSecrets } from '../hooks/useCredentialsSecrets'
import { Secret } from '~/resources'
import { useLocation, useNavigate } from 'react-router'
import { NavigationPath } from '~/NavigationPath'

type RosaHCPModalProps = {
  isModalOpen: boolean
  close: () => void
  selectedSecret: Secret[] | undefined
  setSelectedSecret: (secrets: Secret[] | undefined) => void
}

export const RosaHCPModal = (props: RosaHCPModalProps) => {
  const { isModalOpen, close, setSelectedSecret, selectedSecret } = props
  const [t] = useTranslation()
  const navigate = useNavigate()
  const { state } = useLocation()

  const credentialsSecrets = useCredentialsSecrets()

  const handleNext = useCallback(() => {
    if (!selectedSecret?.length) return

    navigate(NavigationPath.createROSAHCP, {
      state: {
        ...state,
        selectedSecretName: selectedSecret[0]?.metadata?.name,
        maxBackSteps: state?.maxBackSteps ? state.maxBackSteps + 1 : 1,
        cancelSteps: state?.cancelSteps ? state.cancelSteps + 1 : 0,
      },
    })
  }, [selectedSecret, navigate, state])

  return (
    <Modal isOpen={isModalOpen} onClose={close} variant="small">
      <ModalHeader>
        <Title headingLevel="h3">{t('Select service account')}</Title>
        <Content component={ContentVariants.p}>
          {t(
            'To create a ROSA cluster, select a service account credential. This establishes the connection between Advanced Cluster Manager (ACM) and OpenShift Cluster Manager (OCM).'
          )}
        </Content>
      </ModalHeader>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <FormGroup
              label={t('Service account')}
              isRequired
              fieldId="service-account-select"
              labelHelp={
                <Popover
                  bodyContent={t(
                    'The service account credential used to connect Advanced Cluster Manager (ACM) to OpenShift Cluster Manager (OCM).'
                  )}
                >
                  <Button
                    variant="plain"
                    aria-label={t('More info')}
                    icon={<HelpIcon />}
                    className="pf-v6-c-form__group-label-help"
                  />
                </Popover>
              }
            >
              <AcmSelectBase
                id="service-account-select"
                placeholder={t('Select service account')}
                selections={selectedSecret?.[0]?.metadata?.name}
                onSelect={(value: any) => {
                  const filtered = credentialsSecrets.filter((secret) => secret.metadata.name === value)
                  setSelectedSecret(filtered)
                }}
                onClear={() => setSelectedSecret([])}
                width="100%"
                menuAppendTo={() => document.body}
                footer={
                  credentialsSecrets.length === 0 ? (
                    <Flex justifyContent={{ default: 'justifyContentCenter' }}>
                      <FlexItem>
                        <Button
                          variant="plain"
                          isInline
                          onClick={() => navigate(getTypedCreateCredentialsPath(Provider.redhatcloud))}
                        >
                          {t('Add service account')}
                        </Button>
                      </FlexItem>
                    </Flex>
                  ) : (
                    <div style={{ boxShadow: '0 -4px 4px -2px rgba(0, 0, 0, 0.1)' }}>
                      <Button
                        variant="link"
                        isInline
                        icon={<PlusCircleIcon />}
                        style={{ textDecoration: 'none', marginTop: '3%' }}
                        onClick={() => navigate(getTypedCreateCredentialsPath(Provider.redhatcloud))}
                      >
                        {t('Add service account')}
                      </Button>
                    </div>
                  )
                }
              >
                {credentialsSecrets.length > 0 ? (
                  credentialsSecrets.map((secret) => (
                    <SelectOption key={secret.metadata.name} value={secret.metadata.name}>
                      {secret.metadata.name}
                    </SelectOption>
                  ))
                ) : (
                  <EmptyState titleText={t('No service accounts found')} variant="xs" icon={PlusCircleIcon}>
                    <EmptyStateBody>
                      {t('To continue, add a service account for OpenShift Cluster Manager.')}
                    </EmptyStateBody>
                  </EmptyState>
                )}
              </AcmSelectBase>
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    {t('Missing a service account?')}{' '}
                    <Button
                      variant="link"
                      isInline
                      onClick={() => navigate(getTypedCreateCredentialsPath(Provider.redhatcloud))}
                    >
                      {t('Add one')}
                    </Button>
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button onClick={handleNext} isDisabled={!selectedSecret}>
          {t('Continue to ROSA cluster creation')}
        </Button>
        <Button variant="secondary" onClick={close}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
