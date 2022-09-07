/* Copyright Contributors to the Open Cluster Management project */
export type FormikValues = {
  name: string;
  helmRepo: string;
  helmChart: string;
  cost: number;
  quotaNamespace: string;
  quotaCount: number;
  quotaName: string;
  pipelines: string[];
};
