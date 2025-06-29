# ========== CLIENT BUILD STAGE ==========
FROM node:18-alpine AS client

WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build


# ========== SERVER BUILD STAGE ==========
FROM node:18-alpine AS server

WORKDIR /app

RUN apk add --no-cache bash git python3 make g++

COPY server/wait-for-it.sh /app/server/wait-for-it.sh
RUN chmod +x /app/server/wait-for-it.sh


COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install


COPY server/ ./server/
COPY server/.env ./

COPY --from=client /app/client/build ./client/build

EXPOSE 8080

WORKDIR /app/server

COPY server/wait-for-it.sh /app/server/wait-for-it.sh

RUN chmod +x /app/server/wait-for-it.sh

CMD ["bash", "./wait-for-it.sh", "mysql:3306", "--", "node", "index.js"]

