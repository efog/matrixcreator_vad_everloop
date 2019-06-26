const dbg = require("debug");
const debug = dbg("DEBUG:VAD:led-manager.js");
const easing = require("./animation/easing");
const info = dbg("INFO:VAD:led-manager.js");
const error = dbg("ERROR:VAD:led-manager.js");
const matrix = require("@matrix-io/matrix-lite");
const matrixIO = require("matrix-protos").matrix_io;
const zmq = require("zeromq");

const TRANSITIONS = {
    "SILENCE": 0,
    "VOICE": 1,
    "NOISE": 2,
    "ERROR": -1
};

class LedManager {

    constructor() {
        this._configSocket = null;
        this._ledAnimationFreq = 1000 / 60;
        this._ledImage = null;
        this._matrixIP = "127.0.0.1";
        this._matrixEverloopBasePort = 20021;
        this._matrixDeviceLeds = 0;
        this._transitionInterval = null;
        this._transitionTimeout = null;
        this._currentLedState = {
            "red": 0,
            "green": 0,
            "blue": 0,
            "white": 0
        };
        this._currentTransition = TRANSITIONS.SILENCE;
    }

    /**
     * Display led color
     * @param {number} red intensity number
     * @param {number} green intensity number
     * @param {number} blue intensity number
     * @param {number} white intensity number
     * 
     * @returns {undefined}
     */
    show(red = 0, green = 0, blue = 0, white = 0) {
        for (let idx = 0; idx < this._matrixDeviceLeds; ++idx) {
            // Set individual LED value
            this._ledImage.led[idx] = {
                "red": red,
                "green": green,
                "blue": blue,
                "white": white
            };
        }
        const config = matrixIO.malos.v1.driver.DriverConfig.create({
            "image": this._ledImage
        });
        if (this._matrixDeviceLeds > 0) {
            this._configSocket.send(matrixIO.malos.v1.driver.DriverConfig.encode(config).finish());
        }
    }

    /**
     * Gets LED transition target
     *
     * @param {TRANSITIONS} target transition value
     * @returns {object} target transition
     */
    getTransitionTarget(target = TRANSITIONS.SILENCE) {
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
    transitionTo(transition = TRANSITIONS.SILENCE, duration = 500) {
        if (transition === this._currentTransition) {
            return;
        }
        if (this._transitionInterval) {
            clearInterval(this._transitionInterval);
            this._transitionInterval = null;
        }
        if (this._transitionTimeout) {
            clearTimeout(this._transitionTimeout);
            this._transitionTimeout = null;
        }

        debug(`transitionning to ${transition} from ${this._currentTransition}`);

        const tween = easing.easeInQuad;
        let currentLedTarget = null;
        let time = 0;

        this._currentTransition = transition;
        currentLedTarget = this.getTransitionTarget(this._currentTransition);
        debug(`target: ${JSON.stringify(currentLedTarget)}`);
        const redStart = this._currentLedState.red;
        const greenStart = this._currentLedState.green;
        const blueStart = this._currentLedState.blue;
        const whiteStart = this._currentLedState.white;

        this._transitionInterval = setInterval(() => {
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
            debug(`animating from ${JSON.stringify(this._currentLedState)} to ${JSON.stringify(newLedState)}`);
            this.show(newLedState.red, newLedState.green, newLedState.blue, newLedState.white);
            this._currentLedState = newLedState;
            time += this._ledAnimationFreq;
            if (time > duration + this._ledAnimationFreq + 180) {
                clearInterval(this._transitionInterval);
                this._transitionInterval = null;
            }
        }, this._ledAnimationFreq);
    }

    start() {

        debug(`starting`);
        debug(`setting up config socket`);
        this._configSocket = zmq.socket("push");
        this._configSocket.connect(`tcp://${this._matrixIP}:${this._matrixEverloopBasePort}`);
        this._ledImage = matrixIO.malos.v1.io.EverloopImage.create();
        info(`setting up update socket`);

        this._updateSocket = zmq.socket("sub");
        this._updatePort = this._matrixEverloopBasePort + 3;
        this._updatePort.connect(`tcp://${this._matrixIP}:${this._updatePort}`);
        this._updatePort.subscribe("");
        this._updatePort.on("message", (buffer) => {
            const data = matrixIO.malos.v1.io.EverloopImage.decode(buffer);
            debug(`data received from update socket: ${JSON.stringify(data)}`);
            this._matrixDeviceLeds = data.everloopLength;
        });

        info(`setting up ping socket`);
        this._pingSocket = zmq.socket("push");
        this._pingSocket.connect(`tcp://${this._matrixIP}:${(this._matrixEverloopBasePort + 1)}`);
        this._pingSocket.send("");

        info(`setting up error socket`);
        this._errorSocket = zmq.socket("sub");
        this._errorSocket.connect(`tcp://${this._matrixIP}:${(this._matrixEverloopBasePort + 2)}`);
        this._errorSocket.subscribe("");
        this._errorSocket.on("message", (errorMessage) => {
            error(`Error received: ${errorMessage.toString("utf8")}`);
        });

        this.show(this._currentLedState.red, this._currentLedState.green, this._currentLedState.blue, this._currentLedState.white);
    }
}

module.exports = LedManager;