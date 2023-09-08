FROM node:18-alpine

RUN mkdir /data
RUN mkdir /opt/alpe
WORKDIR /opt/alpe

COPY src ./src
COPY package-lock.json package.json tsconfig.json ./

RUN npm install --omit=dev
RUN npm run build

ENV ALPE_CACHE_TIMEOUT_SEC=3300
ENV ALPE_DATA_DIR=/data
ENV ALPE_TOKENS_FILE=/opt/alpe/tokens.json
ENV ALPE_PORT=8080

ENTRYPOINT npm run start
