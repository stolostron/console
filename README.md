# Console

Red Hat - Advanced Cluster Management for Kubernetes - Cluster Lifecycle UI Console

[![Build Status](https://travis-ci.com/open-cluster-management/console.svg?token=APpLzibLo9i2xU1nq9kC&branch=master)](https://travis-ci.com/open-cluster-management/console)

## Running

### Prerequisites

- Node.js v12.x.x
- OpenShift 4.x.x cluster
- Advanced Cluster Management installed on your OCP cluster


### How to start

**Important:** Make sure your `oc` client is configured to your OCP cluster (`oc login`), the token must be valid to run this app locally.

1.  Clone this repository
2.  From the root directory, run `npm ci`
3.  From the root directory, run `npm start`
4.  In your browser, go to `http://localhost:3000/cluster-management`
