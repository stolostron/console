# Copyright Contributors to the Open Cluster Management project

FROM registry.ci.openshift.org/open-cluster-management/builder:nodejs14-linux as builder
USER root
RUN npm i -g npm@7
RUN mkdir -p /app
WORKDIR /app
COPY . ./
RUN npm ci --no-optional --legacy-peer-deps
RUN npm run build
RUN npm ci --only=production --no-optional --legacy-peer-deps

FROM registry.access.redhat.com/ubi8/ubi-minimal
COPY --from=builder /usr/bin/node /usr/bin/node
RUN mkdir -p /app
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/build ./
COPY --from=builder /app/frontend/build ./public
USER 1001
CMD ["node", "lib/main.js"]
