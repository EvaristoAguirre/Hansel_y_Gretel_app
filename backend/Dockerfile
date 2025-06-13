# Usa Node 20 como base
FROM node:20 as builder

# Instala dependencias necesarias para node-gyp
RUN apt-get update && apt-get install -y python3 make g++ && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Etapa final
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

RUN npm install --production

CMD ["node", "dist/main"]
