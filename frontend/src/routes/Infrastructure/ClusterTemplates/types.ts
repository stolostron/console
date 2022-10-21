/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export enum ClusterTemplateVendor {
  CUSTOM = 'Custom',
  REDHAT = 'RedHat',
}

export type HelmChartRepository = K8sResourceCommon & {
  spec: {
    connectionConfig: {
      url: string;
      tlsClientConfig?: { name: string };
      ca?: { name: string };
    };
  };
};

export type ClusterTemplateProperty = {
  description: string;
  name: string;
  overwritable: boolean;
  type?: string;
  defaultValue?: string;
  secretRef?: {
    name: string;
    namespace: string;
  };
};

export type ApplicationSpec = {
  source: {
    repoURL: string;
    chart?: string;
    targetRevision?: string;
  };
};

export type ClusterTemplate = K8sResourceCommon & {
  spec: {
    cost: number;
    clusterDefinition: {
      applicationSpec: ApplicationSpec;
      propertyDetails?: ClusterTemplateProperty[];
    };
    clusterSetup?: {
      applicationSpec: ApplicationSpec;
      name: string;
      propertyDetails?: ClusterTemplateProperty[];
    }[];
  };
};

export enum ConditionType {
  InstallSucceeded = 'InstallSucceeded',
  SetupSucceeded = 'SetupSucceeded',
  Ready = 'Ready',
}

export enum ConditionStatus {
  True = 'True',
  False = 'False',
}

export enum ClusterTemplateInstanceStatusPhase {
  PendingPhase = 'PendingPhase',
  PendingMessage = 'PendingMessage',
  HelmChartInstallFailed = 'HelmChartInstallFailed',
  ClusterInstalling = 'ClusterInstalling',
  ClusterInstallFailed = 'ClusterInstallFailed',
  ClusterSetupCreating = 'ClusterSetupCreating',
  ClusterSetupCreateFailed = 'ClusterSetupCreateFailed',
  ClusterSetupRunning = 'ClusterSetupRunning',
  ClusterSetupFailed = 'ClusterSetupFailed',
  Ready = 'Ready',
  CredentialsFailed = 'CredentialsFailed',
  Failed = 'Failed',
}

export type ClusterTemplateInstancePropertyValue = {
  clusterSetup?: string;
  name: string;
  value: string;
};

export type ClusterTemplateInstance = K8sResourceCommon & {
  spec: {
    clusterTemplateRef: string;
    values?: ClusterTemplateInstancePropertyValue[];
  };
  status?: {
    phase?: ClusterTemplateInstanceStatusPhase;
    message?: string;
  };
};

export type HelmRepoIndexChartEntry = {
  annotations?: { [key in string]: string };
  name: string;
  created: string;
  apiVersion: string;
  appVersion: string;
  description?: string;
  digest: string;
  type: string;
  urls: string[];
  version: string;
};

export type HelmRepoIndex = {
  apiVersion: string;
  entries: {
    [key: string]: HelmRepoIndexChartEntry[];
  };
  generated: string;
};

export type ClusterTemplateQuota = K8sResourceCommon & {
  spec?: {
    budget?: number;
    allowedTemplates?: {
      name: string;
      count: number;
    }[];
  };
  status?: {
    budgetSpent: number;
    templateInstances: {
      name: string;
      count: number;
    }[];
  };
};

export type Secret = K8sResourceCommon & {
  data?: { [key: string]: string };
  stringData?: { [key: string]: string };
  type?: string;
};

export type ConfigMap = {
  data?: { [key: string]: string };
} & K8sResourceCommon;

export type TableColumn = {
  title: string;
  id: string;
};
export type RowProps<D> = {
  obj: D;
};

export type ClusterTemplateQuotaAccess = {
  users: string[];
  groups: string[];
};

export type ClusterRoleBinding = K8sResourceCommon & {
  subjects: {
    kind: 'User' | 'Group';
    apiGroup: 'rbac.authorization.k8s.io';
    name: string;
  }[];
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io';
    kind: 'ClusterRole';
    name: string;
  };
};
