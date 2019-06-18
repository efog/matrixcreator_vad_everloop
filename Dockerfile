FROM arm32v7/node:8.6.0-stretch

RUN curl https://apt.matrix.one/doc/apt-key.gpg | apt-key add -
RUN echo "deb https://apt.matrix.one/raspbian $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/matrixlabs.list

RUN apt-get update && apt-get upgrade
RUN apt-get install cmake g++ git libfftw3-dev wiringpi libgflags-dev matrixio-creator-init

RUN git clone https://github.com/matrix-io/matrix-creator-hal.git
RUN cd matrix-creator-hal
RUN mkdir build
RUN cd build
RUN cmake ..
RUN make -j4 && sudo make install

WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm install
COPY ./src .
CMD [ "npm", "start" ]


