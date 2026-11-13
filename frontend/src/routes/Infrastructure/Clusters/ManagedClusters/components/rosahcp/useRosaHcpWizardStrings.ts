/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import type { RosaHcpWizardStringsInput } from '@redhat-cloud-services/nxtcm-rosa-hcp-wizard'
import { useTranslation } from '~/lib/acm-i18next'

/**
 * Copy for the ROSA HCP wizard steps this console shows.
 * Cluster-wide proxy, cluster updates, and catalog keys the wizard never reads are omitted.
 */
export const useRosaHcpWizardStrings = (): RosaHcpWizardStringsInput => {
  const [t] = useTranslation()
  return useMemo(
    () => ({
      wizard: {
        stepLabels: {
          basicSetup: t('Basic setup'),
          details: t('Details'),
          rolesAndPolicies: t('Roles and policies'),
          machinePools: t('Machine pool'),
          networking: t('Networking'),
          additionalSetup: t('Additional setup'),
          encryptionOptional: t('Encryption (optional)'),
          review: t('Review'),
        },
        fixValidationErrors: t('Please fix validation errors'),
        skipToReview: t('Skip to review'),
        back: t('Back'),
        next: t('Next'),
        createCluster: t('Create cluster'),
        cancel: t('Cancel'),
      },
      submitError: {
        title: t('Error creating cluster'),
        backToReviewStep: t('Back to the wizard'),
        exitWizard: t('Exit wizard'),
      },
      yamlEditor: {
        title: t('YAML Configuration'),
        parseErrorTitle: t('YAML Schema Validation Error'),
        discardChanges: t('Discard changes and go back to Review step'),
        discardConfirmTitle: t('Discard YAML changes?'),
        discardConfirmBody: t('Any changes you made to the YAML configuration will be lost.'),
        discardConfirmYes: t('Yes'),
        cancelCreation: t('Cancel cluster creation'),
        schemaTitle: t('ROSAControlPlane schema'),
        schemaToggleAriaLabel: t('Toggle schema panel'),
        schemaShowTooltip: t('Show schema'),
        schemaHideTooltip: t('Hide sidebar'),
        schemaSearchPlaceholder: t('Search schema fields...'),
      },
      associateAwsDrawer: {
        panelTitle: t('How to associate a new AWS account'),
        introSts: t(
          'ROSA cluster deployments use the AWS Security Token Service for added security. Run the following required steps from a CLI authenticated with both AWS and ROSA.'
        ),
        cliVersion: t('You must use ROSA CLI version 1.2.31 or above.'),
        stepLoginTitle: t('Step 1: Log in to ROSA'),
        step1Title: t('Step 2: OCM role'),
        step2Title: t('Step 3: User role'),
        step3Title: t('Step 4: Account roles'),
        closingPrompt: t("After you've completed all the steps, close this guide and choose your account."),
        closeButton: t('Close'),
        createOCMRoleAriaLabel: t('Copyable ROSA create ocm-role'),
        createOCMRoleAdminAriaLabel: t('Copyable ROSA create ocm-role --admin'),
        linkOCMRoleAriaLabel: t('Copyable rosa link ocm-role <arn> command'),
      },
      ocmRole: {
        checkLinkedTitle: t('First, check if a role exists and is linked with:'),
        existingLinkedInfo: t(
          "If there is an existing role and it's already linked to your Red Hat account, you can continue to step 3."
        ),
        unlinkedTitle: t("Next, is there an existing role that isn't linked?"),
        tabCreateNew: t('No, create new role'),
        tabLinkExisting: t('Yes, link existing role'),
        basicOcmRoleLabel: t('Basic OCM role'),
        orDivider: t('OR'),
        adminOcmRoleLabel: t('Admin OCM role'),
        helpDecideTitle: t('Help me decide'),
        helpBasicBody: t(
          'The basic role enables OpenShift Cluster Manager to detect the AWS IAM roles and policies required by ROSA.'
        ),
        helpAdminBody: t(
          'The admin role also enables the detection of the roles and policies. In addition, the admin role enables automatic deployment of the cluster-specific Operator roles and OpenID Connect (OIDC) provider by using OpenShift Cluster Manager.'
        ),
        linkExistingLead: t(' If a role exists but is not linked, link it with:'),
        orgAdminInfo: t(
          'You must have organization administrator privileges in your Red Hat account to run this command. After you link the OCM role with your Red Hat organization, it is visible for all users in the organization.'
        ),
      },
      userRole: {
        checkLinkedTitle: t('First, check if a role exists and is linked with:'),
        existingLinkedInfo: t(
          "If there is an existing role and it's already linked to your Red Hat account, you can continue to step 4."
        ),
        unlinkedTitle: t("Next, is there an existing role that isn't linked?"),
        whyLinkTitle: t('Why do I need to link my account?'),
        whyLinkBodyPrefix: t('The link creates a trust policy between the role and the link cluster installer.'),
        reviewPermissionsLink: t('Review the AWS policy permissions for the basic and admin OCM roles.'),
        tabCreateNew: t('No, create new role'),
        tabLinkExisting: t('Yes, link existing role'),
        userRoleLabel: t('User role '),
        userRolePopover: t(
          'The user role is necessary to validate that your Red Hat user account has permissions to install a cluster in the AWS account.'
        ),
        copyAriaListUserRole: t('Copyable ROSA rosa list user-role command'),
        copyAriaLinkUserRole: t('Copyable ROSA link user-role --arn'),
      },
      accountRoles: {
        intro: t(
          "To create the necessary account-wide roles and policies quickly, use the default auto method that's provided by the ROSA CLI."
        ),
        copyAriaAccountRoles: t('Copyable ROSA rosa create account-roles --hosted-cp --mode auto command'),
        manualInstructionsLead: t(
          'If you would prefer to manually create the required roles and policies within your AWS account, then follow'
        ),
        manualInstructionsLink: t('these instructions'),
      },
      details: {
        sectionLabel: t('Cluster details'),
        clusterNameLabel: t('Cluster name'),
        clusterNamePlaceholder: t('Enter the cluster name'),
        clusterNameHelp: t(
          'This name appears in the OpenShift cluster list and forms part of the cluster console subdomain.'
        ),
        openShiftVersionLabel: t('OpenShift version'),
        openShiftVersionPlaceholder: t('Select an OpenShift version'),
        openShiftVersionOptionDisabledDescription: t(
          'Your current account roles do not support the version of OpenShift.'
        ),
        openShiftVersionGroups: {
          latestRelease: t('Latest release'),
          defaultRelease: t('Default release'),
          defaultRecommended: t('Default (Recommended)'),
          previousReleases: t('Previous releases'),
          releases: t('Releases'),
        },
        awsInfraLabel: t('Associated AWS infrastructure account'),
        awsInfraPlaceholder: t('Select an AWS infrastructure account'),
        awsInfraHelp: t(
          "Your cluster's cloud resources will be created in the associated AWS infrastructure account. To continue, you must associate at least 1 account."
        ),
        associateNewAccount: t('Associate a new AWS account'),
        billingLabel: t('Associated AWS billing account'),
        billingPlaceholder: t('Select an AWS billing account'),
        billingHelp: t(
          'The AWS account that receives billing for cluster usage and Red Hat subscription charges. This account is often the same as your associated AWS infrastructure account, but does not have to be.'
        ),
        connectBillingLink: t('Connect ROSA to a new AWS billing account'),
        regionLabel: t('Region'),
        regionPlaceholder: t('Select a region'),
        regionHelpLead: t('The AWS Region where your compute nodes and managed control plane will be located.'),
        regionLearnMoreLink: t('Learn more about AWS Regions.'),
      },
      rolesAndPolicies: {
        accountRolesSection: t('Account roles'),
        installerRoleLabel: t('Installer role'),
        installerPlaceholder: t('Select an installer role'),
        installerRoleOptionDisabledDescription: t('This account role does not support the selected OpenShift version.'),
        installerHelpLead: t('An AWS IAM role used by the ROSA installer'),
        installerLearnMoreLink: t('Learn more about roles.'),
        arnsToggle: t('Amazon Resource Names (ARNs)'),
        supportRoleLabel: t('Support role'),
        supportHelp: t(
          'An IAM role used by the Red Hat Site Reliability Engineering (SRE) support team. The role is used with the corresponding policy resource to provide the Red Hat SRE support team with the permissions required to support ROSA clusters.'
        ),
        workerRoleLabel: t('Worker role'),
        workerHelp: t(
          'An IAM role used by the ROSA compute instances. The role is used with the corresponding policy resource to provide the compute instances with the permissions required to manage their components.'
        ),
        operatorRolesSection: t('Operator roles'),
        oidcLabel: t('OIDC config ID'),
        oidcPlaceholder: t('Select an OIDC config ID'),
        oidcPopoverTitle: t('Create a new OIDC config id'),
        operatorPrefixToggle: t('Operator roles prefix'),
        operatorPrefixLabel: t('Operator roles prefix'),
        operatorPrefixHelpLead: t('You can specify a custom prefix for the Operator AWS IAM roles.'),
        operatorPrefixLearnMoreLink: t('Learn more and see examples.'),
        operatorPrefixHelper: t(
          '32 characters maximum. This is autogenerated by the cluster name, but you can change it.'
        ),
        operatorRolesCreateLabel: t('Create operator roles'),
        operatorRolesCreateInstructions: t(
          'Create operator AWS IAM roles by running the following commands in your CLI. You must complete this step before your cluster can be created.'
        ),
        operatorRolesCreateCommandAriaLabel: t('Copyable ROSA create operator-roles command'),
        rolesAlertTitle: t('Some roles are missing'),
        accountRolesHelp: t('Missing account roles'),
        userRolesHelp: t('Missing user role'),
      },
      oidcHint: {
        instructions: t(
          'Create a new OIDC config ID by running the following commands in your CLI. Then, refresh the OIDC config ID dropdown and select the new config ID.'
        ),
      },
      rosaLogin: {
        instructionsService: t(
          'Before you can create or link AWS IAM roles, log in to ROSA from your CLI. Run the following command to authenticate with your Red Hat account. Replace the `<CLIENT_ID>` and `<CLIENT_SECRET>` placeholders with your service account credentials.'
        ),
        copyAriaLabel: t('Copyable ROSA login command'),
      },
      networking: {
        sectionLabel: t('Networking'),
        privacyHelper: t('Install your cluster with all public or private API endpoints and application routes.'),
        clusterPrivacyLabel: t('Cluster privacy'),
        publicLabel: t('Public'),
        publicPopover: t('Access Kubernetes API endpoint and application routes from the internet.'),
        publicSubnetDisabledHelper: t(
          'Select a private subnet on the Machine pools step before choosing a public subnet. The selected private subnet will be used for the public API endpoint and application routes.'
        ),
        publicSubnetLabel: t('Public subnet name'),
        publicSubnetPlaceholder: t('Select public subnet name'),
        privateLabel: t('Private'),
        privatePopover: t(
          'Access Kubernetes API endpoint and application routes from direct private connections only.'
        ),
        advancedToggle: t('Advanced networking configuration (optional)'),
        cidrAlertTitle: t('CIDR ranges cannot be changed after you create your cluster'),
        cidrAlertBody: t(
          'Specify non-overlapping CIDR ranges for the machine, service, and pod fields. Enter the network address for each range—the first IP address in the subnet (for example, 10.0.0.0/16, not 10.0.0.1/16). Ensure these ranges do not overlap with each other or with networks already in use in your environment, including your VPC subnets.'
        ),
        cidrLearnMoreLink: t('Learn more about CIDR range definitions'),
        cidrFieldLearnMoreLink: t('Learn more'),
        useDefaultsLabel: t('Use default values'),
        useDefaultsHelp: t(
          'The values are safe defaults. However, you must ensure that the Machine CIDR matches the selected VPC subnets.'
        ),
        machineCidrLabel: t('Machine CIDR'),
        machineCidrHelpLead: t(
          'A block of IP addresses used by the OpenShift Container Platform installation program while installing the cluster. The address block must not overlap with any other network block.'
        ),
        machineCidrHelp: t('Subnet mask must be between /16 and /25'),
        serviceCidrLabel: t('Service CIDR'),
        serviceCidrHelpLead: t(
          'A block of IP addresses for services. OpenShift SDN allows only one serviceNetwork block. The address block must not overlap with any other network block.'
        ),
        serviceCidrHelp: t('Subnet mask must be at most /24'),
        podCidrLabel: t('Pod CIDR'),
        podCidrHelpLead: t(
          'A block of IP addresses from which Pod IP addresses are allocated. The OpenShift SDN network plug-in supports multiple cluster networks. The address blocks for multiple cluster networks must not overlap. Select address pools large enough to fit your anticipated workload.'
        ),
        podCidrHelp: t('Subnet mask must allow for at least 32 nodes'),
        hostPrefixLabel: t('Host prefix'),
        hostPrefixHelpLead: t(
          'The subnet prefix length to assign to each individual node. For example, if host prefix is set to /23, then each node is assigned a /23 subnet out of the given CIDR, allowing for 510 (2^(32 - 23) - 2) pod IP addresses.'
        ),
        hostPrefixHelp: t('Must be between /23 and /26'),
      },
      machinePools: {
        sectionLabel: t('Machine pool'),
        intro: t('Create a machine pool.  Additional machine pools can be created after cluster creation.'),
        vpcLabel: t('VPC'),
        vpcLabelPrefix: t('Select a VPC to install your machine pool into your selected region:'),
        vpcPlaceholder: t('Select a VPC to install your machine pool into'),
        vpcHelpLead: t(
          'To create a cluster hosted by Red Hat, you must have a Virtual Private Cloud (VPC) available to create clusters on.'
        ),
        vpcLearnMoreLink: t('Learn more about VPCs.'),
        subnetLabel: t('Private subnet name'),
        subnetPlaceholder: t('Select private subnet'),
        instanceTypeLabel: t('Compute node instance type'),
        instanceTypeHelpLead: t(
          'Instance types are made from varying combinations of CPU, memory, storage, and networking capacity. Instance type availability depends on regional availability and your AWS account configuration.'
        ),
        instanceTypeLearnMore: t('Learn more.'),
        advancedToggle: t('Advanced machine pool configuration (optional)'),
        imdsHelpTitle: t('Amazon EC2 Instance Metadata Service (IMDS)'),
        imdsHelpP1: t(
          'Instance metadata is data that is related to an Amazon Elastic Compute Cloud (Amazon EC2) instance that applications can use to configure or manage the running instance.'
        ),
        imdsLabel: t('Instance Metadata Service'),
        imdsBothLabel: t('Use both IMDSv1 and IMDSv2'),
        imdsBothDescription: t('Allows use of both IMDS versions for backward compatibility'),
        imdsV2Label: t('Use IMDSv2 only'),
        imdsV2Description: t('A session-oriented method with enhanced security'),
        rootDiskLabel: t('Root disk size'),
      },
      autoscaling: {
        helperLead: t(
          'Autoscaling automatically adds and removes nodes from the machine pool based on resource requirements.'
        ),
        learnMoreAutoscaling: t('Learn more about autoscaling with ROSA.'),
        enableLabel: t('Enable autoscaling'),
        minLabel: t('Min compute node count'),
        minHelp: t('The number of compute nodes to provision for your initial machine pool.'),
        learnMoreNodeCount: t('Learn more about compute node count'),
        maxLabel: t('Max compute node count'),
        maxHelp: t('The number of compute nodes to provision for your initial machine pool.'),
        computeCountLabel: t('Compute node count'),
        computeCountHelp: t('The number of compute nodes to provision for your initial machine pool.'),
      },
      securityGroups: {
        emptyTitle: t('There are no security groups for this Virtual Private Cloud'),
        emptyBodyPrefix: t('To add security groups, go to the'),
        emptyBodySuffix: t('of your AWS console.'),
        emptyConsoleLink: t('Security groups section'),
        noEditTitle: t(
          'You cannot add or edit security groups associated with machine pools that were created during cluster creation.'
        ),
        formLabel: t('Security groups'),
        selectToggle: t('Select security groups'),
        refreshTooltip: t('Refetch Security Groups list'),
        readOnlyEmpty: t('This machine pool does not have additional security groups.'),
        badgeSrText: t('some items'),
        optionsMenuAria: t('Options menu'),
        noEditViewMoreInfo: t('View more information'),
        noEditAwsConsoleLink: t('AWS security groups console'),
        incompatibleVersion: t('To use securityGroups, your cluster must be version 4.14.x or newer.'),
      },
      encryption: {
        sectionLabel: t('Advanced encryption'),
        keysGroupLabel: t('Encryption Keys'),
        keysHelperLead: t(
          'You can use your default or a custom AWS KMS key to encrypt the root disks for your OpenShift nodes.'
        ),
        keysLearnMore: t('Learn more'),
        defaultKms: t('Use default AWS KMS key'),
        customKms: t('Use custom AWS KMS key'),
        keyArnLabel: t('Key ARN'),
        keyArnHelp: t(
          'The key ARN is the Amazon Resource Name (ARN) of a CMK. It is a unique, fully qualified identifier for the CMK. A key ARN includes the AWS account, Region, and the key ID.'
        ),
        etcdLabel: t('Enable additional etcd encryption'),
        etcdHelperLead: t('Optionally, add a unique customer-managed AWS KMS key to encrypt etcd.'),
        etcdLearnMore: t('Learn more'),
        keysNoteAlert: t(
          'Take a note of the keys associated with your cluster. If you delete your keys, the cluster will not be available'
        ),
        reviewEtcdDisabledLabel: t('disabled'),
        reviewEtcdEnabledLabel: t('enabled'),
      },
      review: {
        sectionLabel: t('Review your ROSA cluster'),
        alertTitle: t('Double check your settings.'),
        lockedSettings: t('Locked settings cannot be changed later.'),
        editStep: t('Edit step'),
        editInYaml: t('Edit in YAML'),
        showMore: t('Show more'),
        showLess: t('Show less'),
      },
      common: {
        errorValidatingPrefix: t('Error validating'),
        errorLoadingPrefix: t('Error loading'),
        listSuffix: t('list'),
        errorDetails: t('Error details'),
        showErrorDetails: t('Show error details'),
        retry: t('Retry'),
      },
      validators: {
        commonRequired: t('This field is required'),
        clusterName: {
          maxLength: t('This value can contain at most 54 characters'),
          invalidChars: t("This value can only contain lowercase alphanumeric characters or '-' or '.'"),
          mustStartAlphanumeric: t('This value must start with an alphanumeric character'),
          mustNotStartNumber: t('This value must not start with a number'),
          mustEndAlphanumeric: t('This value must end with an alphanumeric character'),
        },
        operatorRolesPrefix: {
          fieldLabel: t('Custom operator roles prefix'),
          invalidFormat: (label: string, value: string) =>
            t(
              "{{label}} '{{value}}' isn't valid, must consist of lower-case alphanumeric characters or '-', start with an alphabetic character, and end with an alphanumeric character. For example, 'my-name', or 'abc-123'.",
              { label, value }
            ),
          tooLong: (label: string, max: number) => t('{{label}} may not exceed {{max}} characters.', { label, max }),
        },
        kmsKeyArn: {
          required: t('Field is required.'),
          noWhitespace: t('Value must not contain whitespaces.'),
          invalidArn: t(
            'Key provided is not a valid ARN. It should be in the format "arn:aws:kms:<region>:<accountid>:key/<keyid>".'
          ),
          wrongRegion: t('Your KMS key must contain your selected region.'),
        },
        securityGroups: {
          maxExceeded: (max: number) => t('A maximum of {{max}} security groups can be selected.', { max }),
        },
        rootDisk: {
          notInteger: t('Root disk size must be an integer.'),
          tooSmall: t('Root disk size must be at least 75 GiB.'),
          tooLargeOldOpenshift: t('Root disk size must not exceed 1024 GiB'),
          tooLargeNewOpenshift: t('Root disk size must not exceed 16384 GiB.'),
        },
        replicas: {
          notInteger: t('Input must be an integer.'),
          notPositive: t('Input must be a positive number.'),
          maxNodes: (max: number) => t('Input cannot be more than {{max}}.', { max }),
          minGreaterThanMax: t('Min nodes cannot be greater than max nodes.'),
          maxLessThanMin: t('Max nodes must be greater than or equal to min nodes.'),
          computeMinTwo: t('Input cannot be less than 2 nodes.'),
        },
        cidr: {
          invalidNotation: (value: string) =>
            t(
              "IP address range '{{value}}' isn't valid CIDR notation. It must follow the RFC-4632 format: '192.168.0.0/16'.",
              { value }
            ),
        },
        validateRange: {
          notSubnetAddress: t('This is not a subnet address. The subnet prefix is inconsistent with the subnet mask.'),
        },
        awsMachineCidr: {
          maskTooLarge: (minMask: number) => t("The subnet mask can't be larger than '/{{minMask}}'.", { minMask }),
          maskTooSmallMultiAz: (maxMask: number) =>
            t("The subnet mask can't be smaller than '/{{maxMask}}'.", { maxMask }),
          maskTooSmallSingleAz: (maxMask: number) =>
            t("The subnet mask can't be smaller than '/{{maxMask}}'.", { maxMask }),
        },
        serviceCidr: {
          maskTooSmall: (maxMask: number, maxServices: number) =>
            t("The subnet mask can't be smaller than '/{{maxMask}}', which provides up to {{maxServices}} services.", {
              maxMask,
              maxServices,
            }),
          subnetMaskBetweenOneAnd: (max: number) => t('Subnet mask must be between /1 and /{{max}}.', { max }),
        },
        podCidr: {
          maskTooSmall: (maxMask: number) => t("The subnet mask can't be smaller than /{{maxMask}}.", { maxMask }),
          notEnoughNodes: (prefixLength: number) =>
            t(
              'The subnet mask of /{{prefixLength}} does not allow for enough nodes. Try changing the host prefix or the pod subnet range.',
              { prefixLength }
            ),
        },
        subnetCidrs: {
          machineDoesNotIncludeStartIp: (startIp: string, subnetName: string) =>
            t('The Machine CIDR does not include the starting IP ({{startIp}}) of {{subnetName}}', {
              startIp,
              subnetName,
            }),
          serviceOverlaps: (subnetName: string, cidrBlock: string) =>
            t("The Service CIDR overlaps with {{subnetName}} CIDR '{{cidrBlock}}'", { subnetName, cidrBlock }),
          serviceIncludesStartIp: (startIp: string, subnetName: string) =>
            t('The Service CIDR includes the starting IP ({{startIp}}) of {{subnetName}}', { startIp, subnetName }),
          podOverlaps: (subnetName: string, cidrBlock: string) =>
            t("The Pod CIDR overlaps with {{subnetName}} CIDR '{{cidrBlock}}'", { subnetName, cidrBlock }),
          podIncludesStartIp: (startIp: string, subnetName: string) =>
            t('The Pod CIDR includes the starting IP ({{startIp}}) of {{subnetName}}', { startIp, subnetName }),
        },
        disjointSubnets: {
          fieldLabelMachine: t('Machine CIDR'),
          fieldLabelService: t('Service CIDR'),
          fieldLabelPod: t('Pod CIDR'),
          overlap: (otherFieldLabelsCsv: string, plural: boolean) =>
            plural
              ? t('This subnet overlaps with the subnets in the {{otherFieldLabelsCsv}} fields._other', {
                  otherFieldLabelsCsv,
                })
              : t('This subnet overlaps with the subnet in the {{otherFieldLabelsCsv}} field._one', {
                  otherFieldLabelsCsv,
                }),
        },
        hostPrefix: {
          invalidMaskFormat: (value: string) =>
            t("The value '{{value}}' isn't a valid subnet mask. It must follow the RFC-4632 format: '/16'.", { value }),
          maskTooLarge: (maxPrefix: number, maxPodIPs: number) =>
            t(
              "The subnet mask can't be larger than '/{{maxPrefix}}', which provides up to {{maxPodIPs}} Pod IP addresses.",
              { maxPrefix, maxPodIPs }
            ),
          maskTooSmall: (minPrefix: number, maxPodIPs: number) =>
            t(
              "The subnet mask can't be smaller than '/{{minPrefix}}', which provides up to {{maxPodIPs}} Pod IP addresses.",
              { minPrefix, maxPodIPs }
            ),
        },
      },
    }),
    [t]
  )
}
