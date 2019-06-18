const VAD = require("node-vad");
const debug = require("debug")("app:app.js");
const matrix = require("@matrix-io/matrix-lite");
const matrixIO = require("matrix-protos").matrix_io;
const zmq = require("zeromq");

const matrixIP = "127.0.0.1";
const matrixEverloopBasePort = 20021;
const vad = new VAD(VAD.Mode.NORMAL);
let matrixDeviceLeds = 0;

debug(`starting`);
debug(`setting up config socket`);
const configSocket = zmq.socket("push");
configSocket.connect(`tcp://${matrixIP}:${matrixEverloopBasePort}`);
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
    debug(`requesting to show leds x ${matrixDeviceLeds} color: ${red} ${green} ${blue} ${white}`);
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

/**
 * Handle audio stream chunk
 *
 * @param {*} chunk audio stream chunk
 * @returns {undefined}
 */
function handle(chunk) {
    debug(`${JSON.stringify(chunk)}`);
    vad.processAudio(chunk.audioData, 16000).then((res) => {
        switch (res) {
        case VAD.Event.ERROR:
            show(100, 0, 0, 0); 
            break;
        case VAD.Event.NOISE:
            show(0, 100, 100, 0); 
            break;
        case VAD.Event.SILENCE:
            show(0, 0, 0, 0); 
            break;
        case VAD.Event.VOICE:
            show(0, 100, 0, 0); 
            break;
        default:
            console.log("WTF");

        }
    });
}

debug(`setting up update socket`);
const updateSocket = zmq.socket("sub");
const updatePort = matrixEverloopBasePort + 3;
updateSocket.connect(`tcp://${matrixIP}:${updatePort}`);
updateSocket.subscribe("");
updateSocket.on("message", function(buffer) {
    const data = matrixIO.malos.v1.io.EverloopImage.decode(buffer);
    debug(`data received from update socket: ${JSON.stringify(data)}`);
    matrixDeviceLeds = data.everloopLength;
});

debug(`setting up ping socket`);
const pingSocket = zmq.socket("push");
pingSocket.connect(`tcp://${matrixIP}:${(matrixEverloopBasePort + 1)}`);
pingSocket.send("");

debug(`setting up error socket`);
const errorSocket = zmq.socket("sub");
errorSocket.connect(`tcp://${matrixIP}:${(matrixEverloopBasePort + 2)}`);
errorSocket.subscribe("");
errorSocket.on("message", function(errorMessage) {
    debug(`Error received: ${errorMessage.toString("utf8")}`);
});

debug(`creating microphone instance`);
const micInstance = matrix.alsa.mic({
    "rate": '16000',
    "debug": true,
    "channels": '1'
});
debug(`got microphone instance ${JSON.stringify(micInstance)}`);
const outStream = VAD.createStream({
    "mode": VAD.Mode.NORMAL,
    "audioFrequency": 16000,
    "debounceTime": 1000
});
debug(`getting audio stream`);
const micInputStream = micInstance.getAudioStream();
micInputStream.pipe(outStream).on("data", handle);
micInstance.start();

setTimeout(() => { 
    show(100, 100, 100, 0); 
}, 500);
setTimeout(() => {
    show(0, 0, 0, 0);
}, 1000);