const easing = require("../animation/easing");
const dbg = require("debug");
const debug = dbg("DEBUG:JASMINE:ease.spec");
const error = dbg("ERROR:JASMINE:ease.spec");
const info = dbg("INFO:JASMINE:ease.spec");

describe("easing functions", () => {
    it("should calculate linear tween forward", (done) => {
        const func = easing.linearTween;
        const start = 0;
        const end = 100;
        const duration = 100;

        const initialValue = func(0, start, end, duration);
        expect(initialValue).toEqual(start);
        const lastValue = func(100, start, end, duration);
        expect(lastValue).toEqual(end);
        done();
    });
    it("should calculate linear tween backward", (done) => {
        const func = easing.linearTween;
        const start = 100;
        const end = 0;
        const duration = 100;

        const initialValue = func(0, start, end, duration);
        expect(initialValue).toEqual(start);
        for (let index = 0; index < 100; index++) {
            debug(`${index} ${func(index, start, end, duration)}`);
        }
        const lastValue = func(100, start, end, duration);
        expect(lastValue).toEqual(end);
        done();
    });
});