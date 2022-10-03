/* Copyright Contributors to the Open Cluster Management project */
import { Button, Popover } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  RunningIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { TFunction } from 'i18next';
import React from 'react';
import { useTranslation } from '../../../../lib/acm-i18next';
import { ClusterTemplateInstance, ClusterTemplateInstanceStatusPhase } from '../types';

const getStatusIcon = (phase: ClusterTemplateInstanceStatusPhase): React.ReactNode => {
  switch (phase) {
    case ClusterTemplateInstanceStatusPhase.HelmChartInstallFailed:
    case ClusterTemplateInstanceStatusPhase.ClusterInstallFailed:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineCreateFailed:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineFailed:
    case ClusterTemplateInstanceStatusPhase.CredentialsFailed: {
      return <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" id="failed-icon" />;
    }
    case ClusterTemplateInstanceStatusPhase.Pending:
    case ClusterTemplateInstanceStatusPhase.ClusterInstalling:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineCreating:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineRunning: {
      return <RunningIcon color="var(--pf-global--success-color--100)" id="running-icon" />;
    }
    case ClusterTemplateInstanceStatusPhase.Ready: {
      return <CheckCircleIcon color="var(--pf-global--success-color--100)" id="success-icon" />;
    }
    default: {
      return <UnknownIcon color="var(--pf-global--disabled-color--100)" id="unknown-icon" />;
    }
  }
};

const getStatusLabel = (t: TFunction, phase: ClusterTemplateInstanceStatusPhase): string => {
  switch (phase) {
    case ClusterTemplateInstanceStatusPhase.HelmChartInstallFailed:
    case ClusterTemplateInstanceStatusPhase.ClusterInstallFailed:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineCreateFailed:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineFailed:
    case ClusterTemplateInstanceStatusPhase.CredentialsFailed: {
      return t('Failed');
    }
    case ClusterTemplateInstanceStatusPhase.Pending: {
      return t('Pending');
    }
    case ClusterTemplateInstanceStatusPhase.ClusterInstalling: {
      return t('Installing');
    }
    case ClusterTemplateInstanceStatusPhase.SetupPipelineCreating:
    case ClusterTemplateInstanceStatusPhase.SetupPipelineRunning: {
      return t('Post install configuration');
    }
    case ClusterTemplateInstanceStatusPhase.Ready: {
      return t('Ready');
    }
    default: {
      return phase;
    }
  }
};

const ClusterTemplateInstanceStatus: React.FC<{ instance: ClusterTemplateInstance }> = ({
  instance,
}) => {
  const { t } = useTranslation();
  const phase = instance.status?.phase;
  if (!phase) {
    return <>-</>;
  }
  return (
    <Popover bodyContent={instance.status?.message}>
      <Button icon={getStatusIcon(phase)} variant="link" style={{ paddingLeft: 'unset' }}>
        {getStatusLabel(t, phase)}
      </Button>
    </Popover>
  );
};

export default ClusterTemplateInstanceStatus;
