FROM node:alpine3.22 AS builder

WORKDIR /src

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx tsc

FROM node:alpine3.22 AS deploy

WORKDIR /app

COPY --from=builder /src/ /app

CMD [ "node", "build/src/server.js" ]