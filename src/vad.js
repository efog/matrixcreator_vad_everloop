const VAD = require("node-vad");
const debug = require("debug")("app:test.js");
const fs = require("fs");
const matrix = require("@matrix-io/matrix-lite");
const vad = new VAD(VAD.Mode.LOW_BITRATE);

const fsOutStream = fs.createWriteStream("out/test.wav");

// eslint-disable-next-line require-jsdoc
function handle(chunk) {
    fsOutStream.write(chunk.audioData);
    vad.processAudio(chunk.audioData, 16000).then((res) => {
        switch (res) {
        case VAD.Event.ERROR:
            console.log("ERROR");
            break;
        case VAD.Event.NOISE:
            console.log("NOISE");
            break;
        case VAD.Event.SILENCE:
            console.log("SILENCE");
            break;
        case VAD.Event.VOICE:
            console.log("VOICE");
            break;
        default:
            console.log("WTF");

        }
    });
}

const mic = matrix.alsa.mic();
const micInstance = mic({
    "rate": '16000',
    "debug": true,
    "exitOnSilence": 6,
    "channels": '1'
});

const outStream = VAD.createStream({
    "mode": VAD.Mode.NORMAL,
    "audioFrequency": 16000,
    "debounceTime": 1000
});

const micInputStream = micInstance.getAudioStream();
micInputStream.pipe(fsOutStream);
// micInputStream.pipe(outStream).on("data", handle);

micInputStream.on("error", function (err) {
    console.log(`Error in Input Stream: ${err}`);
});

micInputStream.on("startComplete", function () {
    console.log("Got SIGNAL startComplete");
});

micInputStream.on("stopComplete", function () {
    console.log("Got SIGNAL stopComplete");
});

micInputStream.on("pauseComplete", function () {
    console.log("Got SIGNAL pauseComplete");
});

micInputStream.on("resumeComplete", function () {
    console.log("Got SIGNAL resumeComplete");
});

micInputStream.on("silence", function () {
    console.log("Got SIGNAL silence");
});

micInputStream.on("processExitComplete", function () {
    console.log("Got SIGNAL processExitComplete");
});

micInstance.start();


