const VAD = require("node-vad");
const dbg = require("debug");
const debug = dbg("DEBUG:VAD:vad.js");
const EventEmitter = require("events");
const info = dbg("INFO:VAD:vad.js");
const error = dbg("ERROR:VAD:vad.js");
const matrix = require("@matrix-io/matrix-lite");

const TRANSITIONS = {
    "SILENCE": 0,
    "VOICE": 1,
    "NOISE": 2,
    "ERROR": -1
};

/**
 * Voice Activity Detector for Matrix Creator
 *
 * @class Vad
 */
class Vad extends EventEmitter {

    /**
     * Handle audio stream chunk
     *
     * @param {*} chunk audio stream chunk
     * @returns {undefined}
     */
    handle(chunk) {
        if (chunk && chunk.speech.state) {
            this.emit("activity", TRANSITIONS.VOICE);
        }
        else {
            this.emit("activity", TRANSITIONS.SILENCE);
        }
    }

    start() {
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
        micInputStream.pipe(outStream).on("data", this.handle);
        micInputStream.on("error", (err) => {
            error(JSON.stringify(err));
            this.start();
        });
        micInstance.start();
    }
}

module.exports = Vad;