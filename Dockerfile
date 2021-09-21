FROM node:14-alpine as builder

WORKDIR /app
COPY package.json /app
RUN npm install --production --unsafe \
    && npm install --global pm2 swagger-cli

COPY . /app

RUN npm run generate-docs \
    && chown -R node:node /home/node

USER node
EXPOSE 3000

CMD ["pm2-docker", "--raw", "process.yml"]
