# NeoBank backend — simulated demo API. No real money movement.
#
# Multi-stage build: compile TypeScript in a full node image, then run the
# compiled JS in a slim runtime image.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ARG PORT=4000
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["node", "dist/index.js"]
