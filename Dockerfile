FROM resin/rpi-raspbian

RUN apt-get update
RUN apt-get install lsb-release
RUN apt-get install apt-transport-https --force-yes

RUN curl https://apt.matrix.one/doc/apt-key.gpg | apt-key add -
RUN echo "deb https://apt.matrix.one/raspbian $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/matrixlabs.list

RUN sudo apt-get update && sudo apt-get upgrade
RUN sudo apt-get install matrixio-creator-init libmatrixio-creator-hal libmatrixio-creator-hal-dev matrixio-kernel-modules matrixio-malos

RUN echo "deb http://download.opensuse.org/repositories/network:/messaging:/zeromq:/release-stable/Debian_9.0/ ./" | sudo tee /etc/apt/sources.list.d/zeromq.list
RUN wget https://download.opensuse.org/repositories/network:/messaging:/zeromq:/release-stable/Debian_9.0/Release.key -O- | sudo apt-key add

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
RUN nvm install 8.6

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .
CMD [ "npm", "start" ]


