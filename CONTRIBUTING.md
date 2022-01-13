[comment]: # ( Copyright Contributors to the Open Cluster Management project )

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Contributions](#contributions)
- [Certificate of Origin](#certificate-of-origin)
- [Contributing A Patch](#contributing-a-patch)
- [Issue and Pull Request Management](#issue-and-pull-request-management)
- [Pre-check before submitting a PR](#pre-check-before-submitting-a-pr)
  - [Testing your change](#testing-your-change)
    - [Start local version of console](#start-local-version-of-console)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Contributing guidelines

## Contributions

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Certificate of Origin

By contributing to this project you agree to the Developer Certificate of
Origin (DCO). This document was created by the Linux Kernel community and is a
simple statement that you, as a contributor, have the legal right to make the
contribution. See the [DCO](DCO) file for details.

## Contributing A Patch

1. Submit an issue describing your proposed change to the repo in question.
1. The [repo owners](OWNERS) will respond to your issue promptly.
1. Fork the desired repo, develop and test your code changes.
1. Submit a pull request.

## Issue and Pull Request Management

Anyone may comment on issues and submit reviews for pull requests. However, in
order to be assigned an issue or pull request, you must be a member of the
[stolostron](https://github.com/stolostron) GitHub organization.

Repo maintainers can assign you an issue or pull request by leaving a
`/assign <your Github ID>` comment on the issue or pull request.

## Pre-check before submitting a PR

After your PR is ready to commit, please run following commands to check your code.

```bash
npm test
```

### Testing your change

Make sure your `kubectl` context is set to your target cluster and have Red Hat Advanced Cluster Management installed on the target cluster.
This will run the code locally:

#### Start local version of console

*WARNING: Running this script will update some parts of the cluster specified in your `KUBECONFIG` context.*

```bash
npm run setup
npm start
```

A new console will launch and after approximately 30 seconds you will see the RHACM console.

Now, you can follow the [getting started guide](./README.md#getting-started) to work with the stolostron cluster-curator-controller repository.
