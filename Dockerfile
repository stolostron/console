# Copyright Contributors to the Open Cluster Management project

FROM registry.ci.openshift.org/open-cluster-management/builder:nodejs14-linux as backend
USER root
RUN mkdir -p /app
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-optional
RUN npm run postinstall
COPY backend ./
RUN npm run build
RUN npm ci --only=production --no-optional

FROM registry.ci.openshift.org/open-cluster-management/builder:nodejs14-linux as frontend
USER root
RUN mkdir -p /app
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-optional
COPY frontend ./
RUN npm run build

FROM registry.access.redhat.com/ubi8/ubi-minimal
COPY --from=backend /usr/bin/node /usr/bin/node
RUN mkdir -p /app
WORKDIR /app
ENV NODE_ENV production
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/build ./
COPY --from=frontend /app/frontend/build ./public
USER 1001
CMD ["node", "lib/main.js"]
