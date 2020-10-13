FROM --platform=${BUILDPLATFORM:-linux/amd64} registry.access.redhat.com/ubi8/nodejs-12 as builder
USER root

