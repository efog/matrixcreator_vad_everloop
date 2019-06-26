const EventEmitter = require("events");

class EmitterBase extends EventEmitter {
    test() {
        this.emit("test", "test");
    }
}

describe("emitter", () => {
    it("should emit a test event", (done) => {
        const target = new EmitterBase();
        target.on("test", (test) => {
            expect(test).toBeDefined();
            done();
        });
        target.test();
    });
});