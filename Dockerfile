FROM resin/rpi-raspbian

RUN apt-get update && apt-get install lsb-release && apt-get install apt-transport-https --force-yes
RUN apt-get update && apt-get upgrade

RUN curl https://apt.matrix.one/doc/apt-key.gpg | apt-key add -
RUN echo "deb https://apt.matrix.one/raspbian $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/matrixlabs.list

RUN touch /boot/config.txt
RUN touch /boot/cmdline.txt
RUN apt-get update && apt-get upgrade
RUN apt-get install -y cmake g++ git libfftw3-dev wiringpi libgflags-dev matrixio-creator-init libmatrixio-creator-hal libmatrixio-creator-hal-dev

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .
CMD [ "npm", "start" ]


