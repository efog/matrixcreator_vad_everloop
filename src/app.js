/* eslint-disable no-fallthrough */
const LedManager = require("./led-manager");
const Vad = require("./vad");
const dbg = require("debug");
const debug = dbg("DEBUG:VAD:app.js");
const info = dbg("INFO:VAD:app.js");
const error = dbg("ERROR:VAD:app.js");

info(`starting application`);
const ledManager = new LedManager();
ledManager.start();
const vad = new Vad();
vad.on("activity", ledManager.transitionTo);
vad.start();
