/* Copyright Contributors to the Open Cluster Management project */
import {
  Card,
  CardBody,
  CardTitle,
  FormGroup,
  Grid,
  GridItem,
  Modal,
  ModalVariant,
  PageSection,
  Select,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import { InfraEnvFormPage, getLabels, EnvironmentStepFormValues } from 'openshift-assisted-ui-lib/cim'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormikProps } from 'formik'

import { useTranslation } from '../../../lib/acm-i18next'
import MainIcon from '../../../logos/OnPremiseBannerIcon.svg'
import { useSharedAtoms, useRecoilState, useRecoilValue, useSharedSelectors } from '../../../shared-recoil'

import './InfraEnvForm.css'
import { CredentialsForm } from '../../Credentials/CredentialsForm'
import { Provider } from '../../../ui-components'
import { GetProjects } from '../../../components/GetProjects'
import { CreateCredentialModal } from '../../../components/CreateCredentialModal'

// where to put Create/Cancel buttons
export const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  createBtn: 'create-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
})

const portals = (
  <PageSection variant="light" isFilled className="infra-env-form__section">
    <Split hasGutter>
      <SplitItem>
        <div id={Portals.createBtn} />
      </SplitItem>
      <SplitItem>
        <div id={Portals.cancelBtn} />
      </SplitItem>
    </Split>
  </PageSection>
)

type InfraEnvFormProps = {
  control?: any
  handleChange?: any
}

const InfraEnvForm: React.FC<InfraEnvFormProps> = ({ control, handleChange }) => {
  const { t } = useTranslation()

  const [isCredentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [isCredentialsOpen, setCredentialsOpen] = useState(false)
  const [credentialsUID, setCredentialsUID] = useState<string>()
  const { providerConnectionsValue } = useSharedSelectors()
  const allProviderConnections = useRecoilValue(providerConnectionsValue)
  const { projects } = GetProjects()
  const { infraEnvironmentsState } = useSharedAtoms()
  const [infraEnvironments] = useRecoilState(infraEnvironmentsState)
  const formRef = useRef<FormikProps<any>>(null)

  const providerConnections = allProviderConnections.filter(
    (p) => p.metadata?.labels?.['cluster.open-cluster-management.io/type'] === Provider.hostinventory
  )

  const onValuesChanged = useCallback((values: EnvironmentStepFormValues) => {
    control.active = values
    if (values.labels) {
      control.active = {
        ...control.active,
        labels: getLabels(values),
      }
    }
    if (values.pullSecret) {
      control.active = {
        ...control.active,
        pullSecret: btoa(values.pullSecret),
      }
    }
    if (values.enableNtpSources) {
      control.active = {
        ...control.active,
        additionalNtpSources: values.additionalNtpSources
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    }
    handleChange(control)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    control.validate = () => {
      return formRef?.current?.submitForm().then(() => {
        return formRef?.current?.errors
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const infraEnvNames = useMemo(() => infraEnvironments.map((ie) => ie.metadata?.name!), [infraEnvironments])
  const currentConnection = providerConnections.find((p) => p.metadata.uid === credentialsUID)
  return (
    <>
      <PageSection variant="light" isFilled className="infra-env-form__section">
        <Grid hasGutter className="infra-env-form">
          <GridItem span={8}>
            <InfraEnvFormPage
              onValuesChanged={onValuesChanged}
              usedNames={infraEnvNames}
              formRef={formRef}
              pullSecret={currentConnection?.stringData?.['pullSecret']}
              sshPublicKey={currentConnection?.stringData?.['ssh-publickey']}
            >
              <FormGroup fieldId="credentials" label={t('Infrastructure provider credentials')}>
                <Select
                  variant={SelectVariant.typeahead}
                  placeholderText={t('creation.ocp.cloud.select.connection')}
                  aria-label="Select credentials"
                  onToggle={setCredentialsOpen}
                  onSelect={(_, v) => {
                    setCredentialsUID(v as string)
                    setCredentialsOpen(false)
                  }}
                  selections={credentialsUID}
                  isOpen={isCredentialsOpen}
                  footer={
                    <CreateCredentialModal handleModalToggle={() => setCredentialsModalOpen(!isCredentialsModalOpen)} />
                  }
                >
                  {providerConnections.map((p) => (
                    <SelectOption key={p.metadata.uid} value={p.metadata.uid}>
                      {p.metadata.name}
                    </SelectOption>
                  ))}
                </Select>
              </FormGroup>
            </InfraEnvFormPage>
          </GridItem>
          <GridItem span={8}>
            <Card>
              <Split hasGutter>
                <SplitItem>
                  <CardBody style={{ width: '200px' }}>
                    <MainIcon />
                  </CardBody>
                </SplitItem>
                <SplitItem isFilled>
                  <CardTitle>{t('Next steps: Adding hosts')}</CardTitle>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        {t(
                          'After your infrastructure environment is successfully created, open the details view and click the "Add hosts" button.'
                        )}
                      </StackItem>
                      <StackItem>
                        {t(
                          'Adding hosts allows cluster creators to pull any available hosts from the infrastructure environment.'
                        )}
                      </StackItem>
                    </Stack>
                  </CardBody>
                </SplitItem>
              </Split>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
      {isCredentialsModalOpen && (
        <Modal
          variant={ModalVariant.large}
          showClose={false}
          isOpen
          onClose={() => setCredentialsModalOpen(false)}
          hasNoBodyWrapper
        >
          <CredentialsForm
            namespaces={projects}
            isEditing={false}
            isViewing={false}
            credentialsType={Provider.hostinventory}
            handleModalToggle={() => setCredentialsModalOpen(!isCredentialsModalOpen)}
            hideYaml
            newCredentialCallback={(r) => setCredentialsUID(r.metadata?.uid)}
          />
        </Modal>
      )}
      {portals}
    </>
  )
}

export default InfraEnvForm
