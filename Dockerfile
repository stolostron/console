# Copyright Contributors to the Open Cluster Management project

# FROM registry.access.redhat.com/ubi8/nodejs-14 as builder
FROM node:14 as builder
USER root
RUN mkdir -p /app

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-optional
RUN npm run postinstall
COPY backend ./
# RUN npm run lint
# RUN npm run check
# RUN npm run test
RUN npm run build
RUN npm ci --only=production --no-optional

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-optional
COPY frontend ./
# RUN npm run lint
# RUN npm run check
# RUN npm run test
RUN npm run build

FROM registry.access.redhat.com/ubi8/ubi-minimal
COPY --from=builder /usr/bin/node /usr/bin/node
RUN mkdir -p /app
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/build ./
COPY --from=builder /app/frontend/build ./public
USER 1001
CMD ["node", "lib/main.js"]
