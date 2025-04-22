/* Copyright Contributors to the Open Cluster Management project */
import {
  ActionGroup,
  Button,
  FormGroup,
  Radio,
  SelectList,
  SelectOption
} from '@patternfly/react-core'
import { useState } from 'react'


import { SelectVariant } from '@patternfly/react-core/deprecated'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../NavigationPath'
import { AcmForm, AcmSelect, AcmSubmit } from '../../ui-components'
import { useAllClusters } from '../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'

type AccessControlManagementFormProps = {
}

const AccessControlManagementForm = ({ }: AccessControlManagementFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const managedClusters = useAllClusters(true)


  const [isUser, setIsUser] = useState(true)

  const [selectedClusterUid, setSelectedClusterUid] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<string>();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [selectedRole, setSelectedRole] = useState<string>();

  return <AcmForm>
    <AcmSelect
      maxHeight="18em"
      menuAppendTo="parent"
      label={t('Cluster')}
      id="cluster"
      value={selectedClusterUid}
      onChange={(uid) => setSelectedClusterUid(uid)}
      variant={SelectVariant.typeahead}
      isRequired
      placeholderText='Please select the user'
    >
      {managedClusters.map(item => <SelectOption key={item.uid} value={item.uid} description={item.name}>
        {item.name}
      </SelectOption>)
      }
    </AcmSelect>

    <FormGroup fieldId="user-group-type" isInline>
      <Radio
        name="user"
        id="user"
        label={t('User')} // TODO: to translate
        isChecked={isUser}
        onChange={() => setIsUser(true)}
      />
      <Radio
        name="group"
        id="group"
        label={t('Group')}
        isChecked={!isUser}
        onChange={() => setIsUser(false)}
      />
    </FormGroup>

    {(() => {
      switch (isUser) {
        case true:
          return <AcmSelect
            maxHeight="18em"
            menuAppendTo="parent"
            label={t('User')}
            id="user"
            value={selectedUser}
            onChange={(item) => setSelectedUser(item)}
            variant={SelectVariant.typeahead}
            isRequired
            placeholderText='Please select the user'
          >
            {['user-x', 'user-y', 'user-z'].map(item => <SelectOption key={item} value={item} description={item}>
              {item}
            </SelectOption>)}
          </AcmSelect>;
        default:
          return <AcmSelect
            maxHeight="18em"
            menuAppendTo="parent"
            label={t('Group')}
            id="group"
            value={selectedGroup}
            onChange={(item) => setSelectedGroup(item)}
            variant={SelectVariant.typeahead}
            isRequired
            placeholderText='Please select the user'
          >
            {['gorup-x', 'group-y', 'group-z'].map(item => <SelectOption key={item} value={item} description={item}>
              {item}
            </SelectOption>)

            }
          </AcmSelect>;
      }
    })()}

    <AcmSelect
      maxHeight="18em"
      menuAppendTo="parent"
      label={t('Role')}
      id="role"
      value={selectedRole}
      onChange={(item) => setSelectedRole(item)}
      variant={SelectVariant.typeahead}
      isRequired
      placeholderText='Please select the role'
    >
      {['role-x', 'role-y', 'role-z'].map(item => <SelectOption key={item} value={item} description={item}>
        {item}
      </SelectOption>)

      }
    </AcmSelect>

    <ActionGroup>
      <AcmSubmit
        variant="primary"
        onClick={() => { }}
      >
        {t('Apply to Hub')}
        {/* TODO: to transalte */}
      </AcmSubmit>

      <Button variant="link" onClick={() => navigate(NavigationPath.accessControlManagement)} key="cancel">
        {t('Cancel')}
      </Button>
    </ActionGroup>
  </AcmForm>
}

export { AccessControlManagementForm }
