"use strict";

const toggleView = () => {
  console.log("Toggling");
  document.querySelector(".settings").classList.toggle("hidden");
  document.querySelector(".input").classList.toggle("hidden");
};

document.querySelector("#viewToggle").addEventListener("click", toggleView);

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

class MIDIHandler {
  #midiAccess;
  selectInput;
  selectOutput;
  currentInput;
  currentOutput;
  constructor(midiAccess) {
    console.log("Constructor");
    this.#midiAccess = midiAccess;
    this.#midiAccess.onstatechange = this.onStateChange.bind(this);
    this.selectInput = document.querySelector("#midi-input-select");
    this.selectOutput = document.querySelector("#midi-output-select");
    this.selectInput.addEventListener("change", this.changeInput.bind(this));
    this.selectOutput.addEventListener("change", this.changeOutput.bind(this));
    this.updateSelects();
    this.setInput(this.#midiAccess.inputs.keys().next().value);
    this.setOutput(this.#midiAccess.outputs.keys().next().value);
  }
  onMIDIMessage(message) {
    logger.log(message.data.join(" "));
  }
  onStateChange(change) {
    logger.logPort(change.port);
    this.updateSelects();
  }
  updateSelects() {
    let inputHTML = "";
    let i = 0;
    let current = 0;
    for (const [id, input] of this.#midiAccess.inputs.entries()) {
      if (this.currentInput === id) current = i;
      i += 1;
      inputHTML += `<option id="${id}" value=${id}>${input.name}</option>`;
    }
    this.selectInput.innerHTML = inputHTML;
    this.selectInput.selectedIndex = current;

    let outputHTML = "";
    i = 0;
    current = 0;
    for (const [id, output] of this.#midiAccess.outputs.entries()) {
      if (this.currentOutput === id) current = i;
      i += 1;
      outputHTML += `<option value=${id}>${output.name}</option>`;
    }
    this.selectOutput.innerHTML = outputHTML;
    this.selectOutput.selectedIndex = current;
  }
  changeInput(event) {
    this.setInput(event.target.value);
  }
  changeOutput(event) {
    this.setOutput(event.target.value);
  }
  setInput(input) {
    if (this.currentInput)
      this.#midiAccess.inputs.get(this.currentInput).onmidimessage ??= null;

    this.currentInput = input;
    this.#midiAccess.inputs.get(this.currentInput).onmidimessage =
      this.onMIDIMessage.bind(this);
  }
  setOutput(output) {
    if (this.currentOutput)
      this.#midiAccess.outputs.get(this.currentOutput).onmidimessage ??= null;

    this.currentOutput = output;
    this.#midiAccess.outputs.get(this.currentOutput).onmidimessage =
      this.onMIDIMessage.bind(this);
  }
}

const load = async () => {
  try {
    toggleView();
    const midi = await navigator.requestMIDIAccess();
    logger.log("Midi Ready!");
    console.dir(midi);
    const midiHandler = new MIDIHandler(midi);
  } catch (err) {
    console.error(err);
    logger.log(err);
  }
};

navigator?.requestMIDIAccess
  ? load()
  : logger.log("Your browser doesn't support midi.");

const dist = (p1, p2) => {
  let x = p1.x - p2.x;
  let y = p1.y - p2.y;
  return Math.sqrt(x * x + y * y);
};

class HexGrid {
  #canvas;
  #ctx;
  #points = new Map();
  #pointerCount = 0;
  #rowcount = 10;
  #colcount = 10;
  constructor(canvas) {
    this.#canvas = canvas;
    this.resize();

    this.#ctx = this.#canvas.getContext("2d");
    this.#canvas.addEventListener("pointerdown", this.onpointerdown.bind(this));
    this.#canvas.addEventListener("pointermove", this.onpointermove.bind(this));
    this.#canvas.addEventListener("pointerup", this.onpointerup.bind(this));

    this.drawgrid();
  }
  resize() {
    const parent = this.#canvas.parentElement;
    this.#canvas.width = parent.clientWidth;
    this.#canvas.height = parent.clientHeight;
    
    const gap = 80;
    const cellSize = 60;
    this.colcount = Math.floor(this.#canvas.width / (cellSize));
    this.rowcount = Math.floor(this.#canvas.height / (cellSize));
    if (this.#ctx) this.redraw();
  }
  addPoint(event) {
    const rect = this.#canvas.getBoundingClientRect();
    this.#points.get(event.pointerId).push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }
  onpointerdown(event) {
    event.preventDefault();
    this.#points.set(event.pointerId, []);
    this.addPoint(event);
    this.redraw();
    this.#pointerCount += 1;
  }
  onpointermove(event) {
    event.preventDefault();
    if (!this.#points.has(event.pointerId)) return;
    this.addPoint(event);
    this.redraw();
  }
  onpointerup(event) {
    event.preventDefault();
    this.addPoint(event);
    this.redraw();
    this.#points.delete(event.pointerId);
    this.#pointerCount -= 1;
  }
  getActiveCells() {
    const gap = 80;
    const cellSize = 60;
    const activePoints = [...this.#points.values()].flatMap((pointArr) =>
      pointArr.slice(-1)
    );
    let cells = [];
    for (let y = 0; y < this.rowcount; y++) {
      const maxRow = y % 2 === 0 ? this.colcount - 1 : this.colcount;
      const offset = y % 2 === 0 ? gap / 2 : 0;
      let row = [];
      for (let x = 0; x < maxRow; x++) {
        row.push(
          activePoints.find(
            (point) =>
              dist(point, { x: x * gap + offset, y: y * gap }) <= cellSize
          )
        );
      }
      cells.push(row);
    }
    return cells;
  }
  drawgrid() {
    const active = this.getActiveCells();
    const cellSize = 60;
    const gap = 80;
    for (let y = 0; y < this.rowcount; y++) {
      const maxRow = y % 2 === 0 ? this.colcount - 1 : this.colcount;
      const offset = y % 2 === 0 ? gap / 2 : 0;
      for (let x = 0; x < maxRow; x++) {
        this.#ctx.beginPath();
        this.#ctx.arc(x * gap + offset, y * gap, cellSize / 2, 0, 2 * Math.PI);
        this.#ctx.stroke();
        if (active[y][x]) this.#ctx.fill();
      }
    }
  }
  redraw() {
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.drawgrid();
    this.#points.forEach((pointArr) => {
      this.#ctx.beginPath();
      this.#ctx.moveTo(pointArr[0].x, pointArr[0].y);
      pointArr.forEach((point) => this.#ctx.lineTo(point.x, point.y));
      this.#ctx.stroke();
    });
  }
}

const grid = new HexGrid(document.getElementById("canvas"));
const page = document.documentElement;
const fullscreen = document.querySelector("#fullscreen");
fullscreen.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    page.requestFullscreen({ navigationUI: "hide" });
    logger.log("Going fullscreen");
  } else {
    document.exitFullscreen();
    logger.log("Leaving fullscreen");
  }
  grid.resize();
});
document.defaultView.addEventListener("resize", grid.resize.bind(grid));
