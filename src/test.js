const VAD = require("node-vad");
const debug = require("debug")("app:test.js");
const fs = require("fs");
const vad = new VAD(VAD.Mode.NORMAL);

// eslint-disable-next-line require-jsdoc
function handle(chunk) {
    vad.processAudio(chunk, 16000).then((res) => {
        console.log(JSON.stringify(res));
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

const mic = require("mic");
const micInstance = mic({
    "rate": 16000,
    "channels": 1,
    "debug": true
});

const micInputStream = micInstance.getAudioStream();
debug(JSON.stringify(micInputStream));
const outStream = fs.createWriteStream("out.wav");
micInputStream.pipe(outStream).on("data", (data) => {
    debug(`received data : ${data}`);
});
micInstance.start();

const stream = fs.createReadStream("recording.wav");
stream.on("data", handle);


