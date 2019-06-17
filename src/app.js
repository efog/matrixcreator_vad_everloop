const VAD = require("node-vad");
const debug = require("debug")("app:app.js");
const matrixIO = require("matrix-protos").matrix_io;
const matrixIP = "127.0.0.1";
const matrixEverloopBasePort = 20021;
let matrixDeviceLeds = 0;
const mic = require("mic");
const zmq = require("zeromq");

debug(`starting`);
debug(`setting up config socket`);
const configSocket = zmq.socket("push");
debug(`connecting config socket`);
configSocket.connect(`tcp://${matrixIP}:${matrixEverloopBasePort}`);
debug(`creating led image placeholder`);
const ledImage = matrixIO.malos.v1.io.EverloopImage.create();

/**
 * Display led color
 * @param {number} red intensity number
 * @param {number} green intensity number
 * @param {number} blue intensity number
 * @param {number} white intensity number
 * 
 * @returns {undefined}
 */
function show(red = 0, green = 0, blue = 0, white = 0) {
    for (let idx = 0; idx < matrixDeviceLeds; ++idx) {
        // Set individual LED value
        ledImage.led[idx] = {
            "red": red,
            "green": green,
            "blue": blue,
            "white": white
        };
    }
    const config = matrixIO.malos.v1.driver.DriverConfig.create({
        "image": ledImage
    });
    if (matrixDeviceLeds > 0) {
        configSocket.send(matrixIO.malos.v1.driver.DriverConfig.encode(config).finish()); 
    }
}

debug(`setting up update socket`);
const updateSocket = zmq.socket("sub");
// Connect Subscriber to Data Update port
debug(`connecting update socket`);
updateSocket.connect(`"tcp://${matrixIP}:${(matrixEverloopBasePort + 3)}`);
// Subscribe to messages
debug(`subscribing to update socket`);
updateSocket.subscribe("");
// On Message
updateSocket.on("message", function(buffer) {
    debug(`message received from update socket`);
    const data = matrixIO.malos.v1.io.EverloopImage.decode(buffer);
    debug(`data received from update socket: ${JSON.stringify(data)}`);
    matrixDeviceLeds = data.everloopLength;
});

debug(`creating microphone instance`);
const micInstance = mic({
    "rate": 16000,
    "channels": 1,
    "debug": true
});
debug(`getting auio stream`);
const micInputStream = micInstance.getAudioStream();
const vad = new VAD(VAD.Mode.NORMAL);
micInputStream.on("data", (chunk) => {
    debug(`received mic data`);
    vad.processAudio(chunk, 16000).then((res) => {
        // eslint-disable-next-line default-case
        switch (res) {
        case VAD.Event.ERROR:
            show(250, 0, 0, 0);
            console.log("ERROR");
            break;
        case VAD.Event.NOISE:
            show(0, 250, 250, 0);
            console.log("NOISE");
            break;
        case VAD.Event.SILENCE:
            show(0, 0, 0, 0);
            console.log("SILENCE");
            break;
        case VAD.Event.VOICE:
            show(0, 250, 0, 0);
            console.log("VOICE");
            break;
        }
    })
        .catch(console.error);
});