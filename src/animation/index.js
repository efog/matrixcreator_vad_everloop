const EventEmitter = require("events").EventEmitter;
const dbg = require("debug");
const easing = require("./easing");
const debug = dbg("DEBUG:VAD:animator");
const error = dbg("ERROR:VAD:animator");
const info = dbg("INFO:VAD:animator");

/**
 * Animator class containing several everloop animations
 */
class Animator {
    constructor(image, ledCount) {
        info(`new animator with image ${JSON.stringify(image)} and ${ledCount} leds`);
        this._emitter = new EventEmitter();
        this._image = image;
        this._ledCount = ledCount;
    }

    /**
     * Gets event emitter
     */
    get events() {
        return this._emitter;
    }

    /**
     * Pulse led array from dark to white   
     * 
     * @param {int} duration animation in ms
     * @param {int} repetitions number of pulses
     * @returns {undefined}
     */
    pulse(duration = 1000, repetitions = 1) {
        let time = 0;
        const freq = 1000 / 60;
        const ease = easing.easeInOutSine;

        info(`running pulse for ${duration} ms with a rate of ${1000 / freq} fps`);
        let intervalFunc = null;
        intervalFunc = setInterval(() => { 
            const update = { "image": {
                "led": [],
                "everloopLength": this._ledCount
            }};
            info(`leds config ${JSON.stringify(update)}`);
            const red = ease(time, 0, 126, duration / repetitions);
            const green = ease(time, 0, 126, duration / repetitions);
            const blue = ease(time, 0, 126, duration / repetitions);
            for (let index = 0; index < this._ledCount; index++) {
                const value = {
                    "red": Math.floor(red) + 1,
                    "green": Math.floor(green) + 1,
                    "blue": Math.floor(blue) + 1,
                    "white": 0
                };
                update.image.led[index] = value;
            }
            info(`leds config ${JSON.stringify(update)}`);
            this._emitter.emit("update", update);
            time += freq;
            if (time > duration) {
                info(`pulse animation complete after ${time} ms`);
                clearInterval(intervalFunc);
                for (let index = 0; index < this._ledCount; index++) {
                    const value = {
                        "red": Math.floor(0),
                        "green": Math.floor(0),
                        "blue": Math.floor(0),
                        "white": 0
                    };
                    update.image.led[index] = value;
                }
                info(`leds config ${JSON.stringify(update)}`);
                this._emitter.emit("update", update);
            }
        }, freq);
    }
}

module.exports = Animator;