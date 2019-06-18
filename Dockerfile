FROM arm32v7/node:8.6.0

RUN curl https://apt.matrix.one/doc/apt-key.gpg | sudo apt-key add -
RUN echo "deb https://apt.matrix.one/raspbian $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/matrixlabs.list
RUN sudo apt-get update && sudo apt-get upgrade
RUN sudo apt-get install matrixio-creator-init libmatrixio-creator-hal libmatrixio-creator-hal-dev

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .
CMD [ "npm", "start" ]


