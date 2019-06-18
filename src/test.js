const VAD = require("node-vad");
const fs = require("fs");
const vad = new VAD(VAD.Mode.NORMAL);

function handle(chunk) {
	vad.processAudio(chunk, 16000).then((res) => {
		console.log(JSON.stringify(res));
		switch(res) {
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

const stream = fs.createReadStream("recording.wav");
stream.on("data", handle);


