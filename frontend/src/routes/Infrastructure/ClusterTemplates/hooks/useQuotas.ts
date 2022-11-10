/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { clusterTemplateQuotaGVK, roleBindingGVK } from '../constants';
import { ClusterRoleBinding, ClusterTemplateQuota, ClusterTemplateQuotaAccess } from '../types';

const CLUSTER_TEMPLATES_ROLE = 'cluster-templates-user';

export const useAllQuotas = () => {
  return useK8sWatchResource<ClusterTemplateQuota[]>({
    groupVersionKind: clusterTemplateQuotaGVK,
    isList: true,
  });
};

const getQuotaTemplateNames = (quota: ClusterTemplateQuota) => {
  return quota.spec?.allowedTemplates?.map((templateData) => templateData.name) || [];
};

export const useQuotas = (templateName: string): [ClusterTemplateQuota[], boolean, unknown] => {
  const [quotas, loaded, error] = useAllQuotas();
  if (error || !loaded) {
    return [[], loaded, error];
  }
  const templateQuotas = quotas.filter((quota) =>
    getQuotaTemplateNames(quota).includes(templateName),
  );
  return [templateQuotas, true, null];
};

const getRoleBindingsAccess = (roleBindings: ClusterRoleBinding[]): ClusterTemplateQuotaAccess => {
  const access: ClusterTemplateQuotaAccess = {
    users: [],
    groups: [],
  };

  for (const rb of roleBindings) {
    for (const subject of rb.subjects) {
      if (subject.kind === 'User') {
        access.users.push(subject.name);
      } else {
        access.groups.push(subject.name);
      }
    }
  }
  return access;
};

export const useClusterTemplateQuotaAccess = (
  quota: ClusterTemplateQuota,
): [ClusterTemplateQuotaAccess | null, boolean, unknown] => {
  const [roleBindings, loaded, error] = useK8sWatchResource<ClusterRoleBinding[]>({
    groupVersionKind: roleBindingGVK,
    namespace: quota.metadata?.namespace,
    isList: true,
  });
  if (!loaded || error) {
    return [null, loaded, error];
  }
  const clusterTemplateRoleBindings = roleBindings.filter(
    (rb) => rb.roleRef.name === CLUSTER_TEMPLATES_ROLE,
  );
  return [getRoleBindingsAccess(clusterTemplateRoleBindings), loaded, error];
};
