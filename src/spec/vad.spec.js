const Vad = require("../vad");

describe("emitter", () => {
    it("should emit a test event", (done) => {
        const target = new Vad();
        target.on("activity", (test) => {
            expect(test).toBeDefined();
            done();
        });
        target.handle({ "speech": { "state": true,
            "start": false,
            "end": false,
            "startTime": 27780,
            "duration": 2340 } });
    });
});