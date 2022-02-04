"use strict";

class Logger {
  #views = document.querySelectorAll(".log");
  constructor() {}
  log(text) {
    this.#views.forEach((view) => view.append(text + "\n"));
  }
  logPort(port) {
    this.log(
      `[${port.type.toUpperCase()}] id: ${port.id} manufacturer: ${
        port.manufacturer
      } name: ${port.name} version: ${port.version}`
    );
  }
}

const logger = new Logger();

const onMIDIMessage = (message) => {
  console.dir(message);
  logger.log(message.data.join(" "));
};

const onStateChange = (change) => {
  console.dir(change);
  const port = change.port;
  logger.logPort(port);
};

const load = async () => {
  try {
    const midi = await navigator.requestMIDIAccess();
    logger.log("Midi Ready!");
    console.dir(midi);
    midi.onstatechange = onStateChange;
    midi.inputs.forEach((input) => {
      logger.logPort(input);
      console.dir(input);
      input.onmidimessage = onMIDIMessage;
    });
    midi.outputs.forEach((output) => logger.logPort(output));
  } catch (err) {
    logger.log(err);
  }
};

navigator?.requestMIDIAccess
  ? load()
  : logger.log("Your browser doesn't support midi.");
