/* Copyright Contributors to the Open Cluster Management project */

// NOTE: Reimplementation of non exposed console hook
// (https://github.com/openshift/console/blob/master/frontend/public/components/utils/k8s-get-hook.ts)

import React from 'react';
import { K8sModel, K8sResourceCommon, k8sGet } from '@openshift-console/dynamic-plugin-sdk';

export const useK8sGetResource = <R extends K8sResourceCommon = K8sResourceCommon>(
  model: K8sModel,
  name?: string,
  ns?: string,
  opts?: { [k: string]: string },
): [R | undefined, boolean, any] => {
  const [data, setData] = React.useState<R>();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<unknown>();
  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(undefined);
        setLoaded(false);
        setData(undefined);
        const resource = await k8sGet({ model, name, ns, ...opts });
        setData(resource as R);
      } catch (error) {
        setLoadError(error);
      } finally {
        setLoaded(true);
      }
    };
    fetch();
  }, [model, name, ns, opts]);

  return [data, loaded, loadError];
};
