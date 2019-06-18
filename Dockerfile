FROM arm32v7/node:8.6.0

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .
CMD [ "npm", "start" ]


