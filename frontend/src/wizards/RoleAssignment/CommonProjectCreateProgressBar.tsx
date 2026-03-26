/* Copyright Contributors to the Open Cluster Management project */
import { HelperText, HelperTextItem, Progress } from '@patternfly/react-core'
import { useTranslation } from '../../lib/acm-i18next'

interface CommonProjectCreateProgressBarProps {
  successCount?: number
  errorCount?: number
  totalCount: number
  hideTitle?: boolean
}

const HelperTextComponent = ({
  successCount = 0,
  errorCount = 0,
}: Pick<CommonProjectCreateProgressBarProps, 'errorCount' | 'successCount'>) => {
  const { t } = useTranslation()
  return errorCount > 0 ? (
    <HelperText id="common-project-create-progress-bar-helper-text">
      <HelperTextItem variant="error">
        {t('Failed to create common projects. Error: {{errorCount}}. Success: {{successCount}}.', {
          errorCount,
          successCount,
        })}
      </HelperTextItem>
    </HelperText>
  ) : null
}

export const CommonProjectCreateProgressBar = ({
  successCount = 0,
  errorCount = 0,
  totalCount,
  hideTitle = false,
}: CommonProjectCreateProgressBarProps) => {
  const { t } = useTranslation()
  const isErrorState = errorCount > 0
  const progressValue = ((successCount + errorCount) / totalCount) * 100
  return (
    <Progress
      aria-describedby="common-project-create-progress-bar"
      value={progressValue}
      title={hideTitle ? undefined : t('Creating common projects')}
      aria-label={t('Creating common projects')}
      helperText={<HelperTextComponent errorCount={errorCount} successCount={successCount} />}
      variant={isErrorState ? 'danger' : 'success'}
    />
  )
}
