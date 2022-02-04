"use strict";

class Logger {
  #views = document.querySelectorAll(".log");
  constructor() {}
  log(text) {
    this.#views.forEach((view) => view.append(text + "\n"));
  }
}

const logger = new Logger();

const load = async () => {
  try {
    const midi = await navigator.requestMIDIAccess();
    logger.log("Midi Ready!");
    console.dir(midi);
    midi.inputs.forEach((input) =>
      logger.log(
        `[INPUT] type: ${input.type} id: ${input.id} manufacturer: ${input.manufacturer} name: ${input.name} version: ${input.version}`
      )
    );
    midi.outputs.forEach((output) =>
      logger.log(
        `[OUTPUT] type: ${output.type} id: ${output.id} manufacturer: ${output.manufacturer} name: ${output.name} version: ${output.version}`
      )
    );
  } catch (err) {
    logger.log(err);
  }
};

navigator?.requestMIDIAccess
  ? load()
  : logger.log("Your browser doesn't support midi.");
