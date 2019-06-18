FROM balenalib/raspberrypi3-debian-node:8.11-stretch as build
RUN apt-get update && apt-get install -y lsb-release && apt-get -y install apt-transport-https curl
RUN apt-get update -y && apt-get upgrade -y

RUN curl https://apt.matrix.one/doc/apt-key.gpg | apt-key add -
RUN echo "deb https://apt.matrix.one/raspbian $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/matrixlabs.list

RUN touch /boot/config.txt
RUN touch /boot/cmdline.txt
RUN apt-get update && apt-get upgrade
RUN apt-get install -y systemd
RUN apt-get install -y build-essential g++
RUN apt-get install -y libasound2 alsa-utils alsa-oss python libmatrixio-creator-hal libmatrixio-creator-hal-dev

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .

CMD [ "npm", "start" ]


