
FROM node:15 AS builder
WORKDIR /app
COPY . /app
RUN yarn install
RUN yarn build-dev


FROM node:15 as serverpackage
RUN yarn global add http-server
RUN export PATH="$(yarn global bin):$PATH"

FROM serverpackage
COPY --from=builder /app/dist /app
COPY --from=builder /app/http-server.sh .
ENTRYPOINT [ "./http-server.sh", "./app", "-S", "true", "-C", "/var/serving-cert/tls.crt", "-K", "/var/serving-cert/tls.key"]
