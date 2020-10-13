FROM --platform=${BUILDPLATFORM:-linux/amd64} registry.access.redhat.com/ubi8/nodejs-12 as builder
USER root
COPY package.json package-lock.json ./
RUN npm ci
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm run postinstall
COPY ./ ./
RUN npm run generate
