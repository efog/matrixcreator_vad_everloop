/* eslint-disable no-fallthrough */
const VAD = require("node-vad");
const dbg = require("debug");
const debug = dbg("DEBUG:VAD:app.js");
const easing = require("./animation/easing");
const info = dbg("INFO:VAD:app.js");
const error = dbg("ERROR:VAD:app.js");
const matrix = require("@matrix-io/matrix-lite");
const matrixIO = require("matrix-protos").matrix_io;
const zmq = require("zeromq");

const TRANSITIONS = {
    "SILENCE": 0,
    "VOICE": 1,
    "NOISE": 2,
    "ERROR": -1
};

const matrixIP = "127.0.0.1";
const matrixEverloopBasePort = 20021;
const vad = new VAD(VAD.Mode.NORMAL);
let matrixDeviceLeds = 0;

const ledAnimationFreq = 1000 / 60;
let transitionInterval = null;
let transitionTimeout = null;
let currentLedState = {
    "red": 0,
    "green": 0,
    "blue": 0,
    "white": 0
};
let currentTransition = TRANSITIONS.SILENCE;

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
 * Gets LED transition target
 *
 * @param {TRANSITIONS} target transition value
 * @returns {object} target transition
 */
function getTransitionTarget(target = TRANSITIONS.SILENCE) {
    debug(`getting transition to ${target}`);
    switch (target) {
    case TRANSITIONS.VOICE:
        return {
            "red": 50,
            "green": 100,
            "blue": 110,
            "white": 10
        };
    case TRANSITIONS.ERROR:
        return {
            "red": 100,
            "green": 0,
            "blue": 0,
            "white": 0
        };
    case TRANSITIONS.NOISE:
        return {
            "red": 0,
            "green": 100,
            "blue": 100,
            "white": 0
        };
    default:
        return {
            "red": 0,
            "green": 0,
            "blue": 0,
            "white": 0
        };
    }
}

/**
 * Transition led color
 * @param {object} transition leds color target
 * @param {number} duration transition duration in ms
 * 
 * @returns {undefined}
 */
function transitionTo(transition = TRANSITIONS.SILENCE, duration = 500) {
    if (transition === currentTransition) {
        return;
    }
    if (transitionInterval) {
        clearInterval(transitionInterval);
        transitionInterval = null;
    }
    if (transitionTimeout) {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
    }

    debug(`transitionning to ${transition} from ${currentTransition}`);
    
    const tween = easing.easeInQuad;
    let currentLedTarget = null;
    let time = 0;

    currentTransition = transition;
    currentLedTarget = getTransitionTarget(currentTransition);
    debug(`target: ${JSON.stringify(currentLedTarget)}`);
    const redStart = currentLedState.red;
    const greenStart = currentLedState.green;
    const blueStart = currentLedState.blue;
    const whiteStart = currentLedState.white;

    transitionInterval = setInterval(() => {        
        debug(`red:     ${time}, ${redStart},   ${duration}`);
        debug(`green:   ${time}, ${greenStart}, ${duration}`);
        debug(`blue:    ${time}, ${blueStart},  ${duration}`);
        debug(`white:   ${time}, ${whiteStart}, ${duration}`);
        const newLedState = {
            "red": Math.max(0, Math.floor(tween(time, redStart, currentLedTarget.red, duration))),
            "green": Math.max(0, Math.floor(tween(time, greenStart, currentLedTarget.green, duration))),
            "blue": Math.max(0, Math.floor(tween(time, blueStart, currentLedTarget.blue, duration))),
            "white": Math.max(0, Math.floor(tween(time, whiteStart, currentLedTarget.white, duration)))
        };
        debug(`animating from ${JSON.stringify(currentLedState)} to ${JSON.stringify(newLedState)}`);
        show(newLedState.red, newLedState.green, newLedState.blue, newLedState.white);
        currentLedState = newLedState;
        time += ledAnimationFreq;
        if (time > duration + ledAnimationFreq + 180) {    
            clearInterval(transitionInterval);
            transitionInterval = null;
        }
    }, ledAnimationFreq);
}

/**
 * Handle audio stream chunk
 *
 * @param {*} chunk audio stream chunk
 * @returns {undefined}
 */
function handle(chunk) {
    if (chunk && chunk.speech.state) {
        transitionTo(TRANSITIONS.VOICE);
    }
    else {
        transitionTo(TRANSITIONS.SILENCE);
    }
}

show(currentLedState.red, currentLedState.green, currentLedState.blue, currentLedState.white);

info(`setting up update socket`);
const updateSocket = zmq.socket("sub");
const updatePort = matrixEverloopBasePort + 3;
updateSocket.connect(`tcp://${matrixIP}:${updatePort}`);
updateSocket.subscribe("");
updateSocket.on("message", function (buffer) {
    const data = matrixIO.malos.v1.io.EverloopImage.decode(buffer);
    debug(`data received from update socket: ${JSON.stringify(data)}`);
    matrixDeviceLeds = data.everloopLength;
});

info(`setting up ping socket`);
const pingSocket = zmq.socket("push");
pingSocket.connect(`tcp://${matrixIP}:${(matrixEverloopBasePort + 1)}`);
pingSocket.send("");

info(`setting up error socket`);
const errorSocket = zmq.socket("sub");
errorSocket.connect(`tcp://${matrixIP}:${(matrixEverloopBasePort + 2)}`);
errorSocket.subscribe("");
errorSocket.on("message", function (errorMessage) {
    error(`Error received: ${errorMessage.toString("utf8")}`);
});

info(`creating microphone instance`);
const micInstance = matrix.alsa.mic({
    "rate": '16000',
    "debug": true,
    "channels": '8'
});
debug(`got microphone instance ${JSON.stringify(micInstance)}`);
const outStream = VAD.createStream({
    "mode": VAD.Mode.VERY_AGGRESSIVE,
    "audioFrequency": 16000,
    "debounceTime": 1500
});
info(`getting audio stream`);
const micInputStream = micInstance.getAudioStream();
micInputStream.pipe(outStream).on("data", handle);
// micInputStream.on("data", console.log);
micInstance.start();
