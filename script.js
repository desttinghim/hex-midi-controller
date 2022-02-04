"use strict";

const toggleLogAndInput = () => {
  console.log("Toggling");
  document.querySelector(".log").classList.toggle("hidden");
  document.querySelector(".input").classList.toggle("hidden");
};

document
  .querySelector("#viewToggle")
  .addEventListener("click", toggleLogAndInput);

class Logger {
  #view = document.querySelector(".log");
  constructor() {
    this.#view.addEventListener("click", (event) => {
      if (event.target.classList.contains("toggle")) {
        event.target.closest(".line").classList.toggle("hide-overflow");
      }
    });
  }
  log(text) {
    const el = document.createElement("div");
    el.classList.add("line");
    el.classList.add("hide-overflow");

    const toggle = document.createElement("button");
    toggle.classList.add("toggle");
    toggle.textContent = "Show/Hide";
    el.append(toggle);

    const message = document.createElement("span");
    message.textContent = text;
    el.append(message);

    this.#view.append(el);
  }
  logPort(port) {
    this.log(
      `[${port.type}] ${port.name} ${port.version} ${port.manufacturer} ${port.id}`
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
    toggleLogAndInput();
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

class HexGrid {
  #canvas;
  #ctx;
  constructor(canvas) {
    this.#canvas = canvas;
    const parent = this.#canvas.parentElement;
    console.log(parent.clientWidth, parent.clientHeight);
    this.#canvas.width = parent.clientWidth;
    this.#canvas.height = parent.clientHeight;

    this.#ctx = this.#canvas.getContext("2d");
    this.#canvas.addEventListener("click", this.ontap.bind(this));

    this.#ctx.fillStyle = "green";
    this.#ctx.fillRect(10, 10, 150, 100);
  }
  ontap(event) {
    this.#ctx.fillStyle = "green";
    console.log(event.x, event.y);
    this.#ctx.beginPath();
    this.#ctx.ellipse(event.x, event.y, 40, 40, 0, 0, Math.PI * 2);
    this.#ctx.fill();
  }
}

const grid = new HexGrid(document.getElementById("canvas"));
