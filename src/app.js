const VAD = require("node-vad");
const matrix = require("@matrix-io/matrix-lite");
const mic = require("mic");
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
            matrix.led.set("red");
            console.log("ERROR");
            break;
        case VAD.Event.NOISE:
            matrix.led.set("yellow");
            console.log("NOISE");
            break;
        case VAD.Event.SILENCE:
            matrix.led.set("black");
            console.log("SILENCE");
            break;
        case VAD.Event.VOICE:
            matrix.led.set("green");
            console.log("VOICE");
            break;
        }
    })
        .catch(console.error);
});