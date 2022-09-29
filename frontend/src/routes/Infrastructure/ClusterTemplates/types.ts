/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export type HelmChartRepository = K8sResourceCommon & {
  spec: {
    connectionConfig: {
      url: string;
      tlsConfig?: { name: string };
      ca?: { name: string };
    };
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
    clusterSetup: {
      pipeline: {
        name: string;
        namespace: string;
      };
    };
    properties?: {
      clusterSetup?: boolean;
      defaultValue?: unknown;
      description: string;
      name: string;
      overwritable: boolean;
      secretRef?: {
        name: string;
        namespace: string;
      };
      type: string;
    }[];
  };
};

export type ClusterTemplateInstance = K8sResourceCommon & {
  spec: {
    template: string;
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
  spec: {
    cost: number;
    allowedTemplates: {
      name: string;
      count: number;
    }[];
  };
};
