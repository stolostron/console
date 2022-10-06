/* Copyright Contributors to the Open Cluster Management project */
import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  ModalBoxFooter,
  ModalBoxBody,
  ButtonVariant,
  Form,
  TextInputTypes,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { useTranslation } from '../../../lib/acm-i18next';
import { ConfigMap, HelmChartRepository, Secret } from './types';
import {
  k8sCreate,
  k8sDelete,
  k8sGet,
  K8sGroupVersionKind,
  k8sPatch,
  K8sResourceCommon,
  useK8sModel,
  useK8sModels,
} from '@openshift-console/dynamic-plugin-sdk';
import { getReference } from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s-ref';
import { configMapGVK, helmRepoGVK, secretGVK } from './constants';
import TableLoader from './helpers/TableLoader';
import { InputField, CheckboxField, TextAreaField } from 'formik-pf';
import { getErrorMessage } from './utils';

type EditHelmRepoCredsValues = {
  url: string;
  useCredentials: boolean;
  caCertificate: string;
  tlsClientCert: string;
  tlsClientKey: string;
};

type EditHelmRepositoryDialogProps = {
  helmChartRepository: HelmChartRepository;
  closeDialog: () => void;
};

const getHelmRepoConnectionConfigPatch = ({
  url,
  useCredentials,
  secretName,
  configMapName,
}: {
  url: string;
  useCredentials: boolean;
  secretName: string;
  configMapName: string;
}): HelmChartRepository['spec']['connectionConfig'] => {
  if (useCredentials) {
    return { url, tlsClientConfig: { name: secretName }, ca: { name: configMapName } };
  }
  return { url };
};

function getInitialValues(
  helmChartRepository: HelmChartRepository,
  secret?: Secret,
  configMap?: ConfigMap,
): EditHelmRepoCredsValues {
  const { tlsClientConfig, ca, url } = helmChartRepository.spec.connectionConfig;
  const decodedSecretData = Object.entries(secret?.data || {}).reduce<{
    ['tls.crt']?: string;
    ['tls.key']?: string;
  }>(
    (res, [key, value]) => ({ ...res, [key]: Buffer.from(value, 'base64').toString('ascii') }),
    {},
  );
  const tlsClientCert = decodedSecretData['tls.crt'];
  const tlsClientKey = decodedSecretData['tls.key'];
  return {
    url,
    useCredentials: !!(tlsClientConfig || ca),
    caCertificate: configMap?.data?.['ca-bundle.crt'] || '',
    tlsClientCert: tlsClientCert || '',
    tlsClientKey: tlsClientKey || '',
  };
}

function useFetchHelmRepositoryCredential<Resource extends K8sResourceCommon>(
  credential: { name: string } | undefined,
  resourceGVK: K8sGroupVersionKind,
): [resource: Resource | undefined, loaded: boolean, loadError: unknown] {
  const [data, setData] = React.useState<Resource>();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<unknown>();
  const [model] = useK8sModel(resourceGVK);

  React.useEffect(() => {
    const fetch = async () => {
      try {
        setLoadError(undefined);
        setLoaded(false);
        setData(undefined);
        const resource = await k8sGet<Resource>({
          model,
          name: credential?.name,
          ns: 'openshift-config',
        });
        setData(resource);
      } catch (error) {
        setLoadError(undefined);
      } finally {
        setLoaded(true);
      }
    };

    if (!credential) {
      setLoadError(undefined);
      setLoaded(true);
      setData(undefined);
    } else {
      fetch();
    }
  }, [model, credential?.name]);

  return [data, loaded, loadError];
}

function useFetchHelmRepositoryCredentials(helmRepository: HelmChartRepository) {
  const { ca, tlsClientConfig } = helmRepository.spec.connectionConfig;

  const [configMap, configMapLoaded, configMapLoadError] =
    useFetchHelmRepositoryCredential<ConfigMap>(ca, configMapGVK);
  const [secret, secretLoaded, secretLoadError] = useFetchHelmRepositoryCredential<Secret>(
    tlsClientConfig,
    secretGVK,
  );

  return {
    configMap,
    secret,
    loaded: secretLoaded && configMapLoaded,
    loadError: secretLoadError || configMapLoadError,
  };
}

const EditHelmRepositoryDialog = ({
  helmChartRepository,
  closeDialog,
}: EditHelmRepositoryDialogProps) => {
  const { t } = useTranslation();
  const helmChartRepositoryReference = getReference(helmRepoGVK);
  const [
    {
      ConfigMap: configMapModel,
      Secret: secretModel,
      [helmChartRepositoryReference]: helmChartRepoModel,
    },
  ] = useK8sModels();
  const { configMap, secret, loaded, loadError } =
    useFetchHelmRepositoryCredentials(helmChartRepository);
  const [formError, setFormError] = React.useState<
    { title: string; message: string } | undefined
  >();

  const handleSubmit = async ({
    useCredentials,
    tlsClientCert,
    tlsClientKey,
    caCertificate,
    url,
  }: EditHelmRepoCredsValues) => {
    const secretName = `${helmChartRepository.metadata?.name || 'unknown'}-tls-configs`;
    const configMapName = `${helmChartRepository.metadata?.name || 'unknown'}-ca-certificate`;

    setFormError(undefined);

    const promises = [];
    promises.push(
      k8sPatch<HelmChartRepository>({
        model: helmChartRepoModel,
        resource: helmChartRepository,
        data: [
          {
            op: 'replace',
            path: '/spec/connectionConfig',
            value: getHelmRepoConnectionConfigPatch({
              url,
              useCredentials,
              secretName,
              configMapName,
            }),
          },
        ],
      }),
    );
    if (!secret && useCredentials) {
      promises.push(
        k8sCreate<Secret>({
          model: secretModel,
          data: {
            apiVersion: secretGVK.version,
            kind: secretGVK.kind,
            metadata: {
              name: secretName,
              namespace: 'openshift-config',
              // labels: { },
            },
            data: {
              ['tls.crt']: Buffer.from(tlsClientCert, 'ascii').toString('base64'),
              ['tls.key']: Buffer.from(tlsClientKey, 'ascii').toString('base64'),
            },
          },
        }),
      );
    }
    if (!configMap && useCredentials) {
      promises.push(
        k8sCreate<ConfigMap>({
          model: configMapModel,
          data: {
            apiVersion: configMapGVK.version,
            kind: configMapGVK.kind,
            metadata: {
              name: configMapName,
              namespace: 'openshift-config',
            },
            data: {
              ['ca-bundle.crt']: caCertificate,
            },
          },
        }),
      );
    }
    if (secret && useCredentials) {
      promises.push(
        k8sPatch<Secret>({
          model: secretModel,
          resource: secret,
          data: [
            {
              op: 'add',
              path: '/data/tls.crt',
              value: Buffer.from(tlsClientCert, 'ascii').toString('base64'),
            },
            {
              op: 'add',
              path: '/data/tls.key',
              value: Buffer.from(tlsClientKey, 'ascii').toString('base64'),
            },
          ],
        }),
      );
    }
    if (configMap && useCredentials) {
      promises.push(
        k8sPatch<ConfigMap>({
          model: configMapModel,
          resource: configMap,
          data: [
            {
              op: 'add',
              path: '/data/ca-bundle.crt',
              value: caCertificate,
            },
          ],
        }),
      );
    }
    if (secret && !useCredentials) {
      promises.push(k8sDelete<Secret>({ model: secretModel, resource: secret }));
    }
    if (configMap && !useCredentials) {
      promises.push(k8sDelete<ConfigMap>({ model: configMapModel, resource: configMap }));
    }
    try {
      await Promise.all(promises);
      closeDialog();
    } catch (e) {
      setFormError({ title: t('Something went wrong'), message: getErrorMessage(e) });
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      title={t('Edit repository')}
      onClose={closeDialog}
      showClose
      hasNoBodyWrapper
    >
      <TableLoader
        loaded={loaded}
        error={loadError}
        errorMessage={typeof loadError === 'string' ? loadError : undefined}
      >
        <Formik<EditHelmRepoCredsValues>
          initialValues={getInitialValues(helmChartRepository, secret, configMap)}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, values, isSubmitting }) => (
            <>
              <ModalBoxBody>
                <Form id="edit-helm-repo-credentials-form" onSubmit={handleSubmit}>
                  <InputField
                    fieldId="url"
                    name="url"
                    label={t('HELM chart repositoriy URL')}
                    type={TextInputTypes.text}
                    placeholder="Repository URL"
                    isRequired
                  />
                  <CheckboxField
                    fieldId="useCredentials"
                    name="useCredentials"
                    label={t('Requires authentication')}
                    helperText={t(
                      'Add credentials and custom certificate authority (CA) certificates to connect to private helm chart repository.',
                    )}
                  />
                  {values.useCredentials && (
                    <>
                      <TextAreaField
                        fieldId="caCertificate"
                        name="caCertificate"
                        label={t('CA certificate')}
                      />
                      <TextAreaField
                        fieldId="tlsClientCert"
                        name="tlsClientCert"
                        label={t('TLS client certificate')}
                      />
                      <TextAreaField
                        fieldId="tlsClientKey"
                        name="tlsClientKey"
                        label={t('TLS client key')}
                      />
                    </>
                  )}
                  {formError && (
                    <Alert variant={AlertVariant.danger} title={formError?.title} isInline>
                      {formError?.message}
                    </Alert>
                  )}
                </Form>
              </ModalBoxBody>
              <ModalBoxFooter>
                <Button
                  onClick={() => handleSubmit()}
                  variant={ButtonVariant.primary}
                  isDisabled={isSubmitting}
                >
                  {t('Submit')}
                </Button>
                <Button onClick={closeDialog} variant={ButtonVariant.link}>
                  {t('Cancel')}
                </Button>
              </ModalBoxFooter>
            </>
          )}
        </Formik>
      </TableLoader>
    </Modal>
  );
};

export default EditHelmRepositoryDialog;
