const VAD = require("node-vad");
const matrixIO = require("matrix-protos").matrix_io;
const matrixIP = "127.0.0.1";
const matrixEverloopBasePort = 20021;
let matrixDeviceLeds = 0;
const mic = require("mic");
const zmq = require("zeromq");


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

const updateSocket = zmq.socket("sub");
// Connect Subscriber to Data Update port
updateSocket.connect(`"tcp://${matrixIP}:${(matrixEverloopBasePort + 3)}`);
// Subscribe to messages
updateSocket.subscribe("");
// On Message
updateSocket.on("message", function(buffer) {
    const data = matrixIO.malos.v1.io.EverloopImage.decode(buffer);
    matrixDeviceLeds = data.everloopLength;
});

const micInstance = mic({
    "rate": 16000,
    "channels": 1,
    "debug": true
});
const micInputStream = micInstance.getAudioStream();
const vad = new VAD(VAD.Mode.NORMAL);
micInputStream.on("data", (chunk) => {
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