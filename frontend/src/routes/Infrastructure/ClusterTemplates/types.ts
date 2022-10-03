/* Copyright Contributors to the Open Cluster Management project */
import { K8sGroupVersionKind, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export enum ClusterTemplateVendor {
  CUSTOM = 'Custom',
  REDHAT = 'RedHat',
}

export type HelmChartRepository = K8sResourceCommon & {
  spec: {
    connectionConfig: {
      url: string;
      tlsConfig?: { name: string };
      ca?: { name: string };
    };
  };
};

export type ClusterTemplateProperty = {
  description: string;
  name: string;
  overwritable: boolean;
  type: string;
  defaultValue?: unknown;
  secretRef?: {
    name: string;
    namespace: string;
  };
};

export type ClusterTemplate = K8sResourceCommon & {
  spec: {
    cost: number;
    helmChartRef: {
      name: string;
      version: string;
      repository: string;
    };
    clusterSetup?: {
      pipeline?: {
        name: string;
        namespace: string;
      };
    };
    properties: ClusterTemplateProperty[];
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
  Pending = 'Pending',
  HelmChartInstallFailed = 'HelmChartInstallFailed',
  ClusterInstalling = 'ClusterInstalling',
  ClusterInstallFailed = 'ClusterInstallFailed',
  SetupPipelineCreating = 'SetupPipelineCreating',
  SetupPipelineCreateFailed = 'SetupPipelineCreateFailed',
  SetupPipelineRunning = 'SetupPipelineRunning',
  SetupPipelineFailed = 'SetupPipelineFailed',
  Ready = 'Ready',
  CredentialsFailed = 'CredentialsFailed',
  Failed = 'Failed',
}

export type ClusterTemplateInstance = K8sResourceCommon & {
  spec: {
    clusterTemplateRef: string;
    values: {
      [key: string]: any;
    };
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
