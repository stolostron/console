/* Copyright Contributors to the Open Cluster Management project */
import { Button, Form, FormGroup, TextInput, Title } from '@patternfly/react-core'
import { useState } from 'react'
import { useTranslation } from '../../../lib/acm-i18next'

interface CreatePreAuthorizedUserProps {
  onCancel: () => void
  onSubmit?: (username: string) => void
}

export function CreatePreAuthorizedUser({ onCancel, onSubmit }: CreatePreAuthorizedUserProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      onSubmit?.(username.trim())
    }
  }

  return (
    <div>
      <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
        {t('Add pre-authorized user')}
      </Title>

      <Form onSubmit={handleSubmit}>
        <FormGroup
          label={t('Username')}
          fieldId="username"
          isRequired
          helperText={t('Enter the username of the user to pre-authorize')}
        >
          <TextInput
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(_event, value) => setUsername(value)}
            placeholder={t('Enter username')}
            isRequired
          />
        </FormGroup>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="primary" type="submit" isDisabled={!username.trim()}>
            {t('Add user')}
          </Button>

          <Button variant="link" onClick={onCancel}>
            {t('Cancel and search users instead')}
          </Button>
        </div>
      </Form>
    </div>
  )
}
