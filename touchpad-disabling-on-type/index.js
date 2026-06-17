let keydownTime;
let keyupTime;

let lastKeydownMousemove;
let lastKeyupMousemove;
let lastKeydownMousedown;
let lastKeyupMousedown;
let minKeydownMousemove;
let minKeyupMousemove;
let minKeydownMousedown;
let minKeyupMousedown;

const fillLast = () => {
  lastKeydownMousemoveEl.innerText =
    lastKeydownMousemove === undefined
      ? ""
      : `${Math.round(lastKeydownMousemove)} мс`;
  lastKeyupMousemoveEl.innerText =
    lastKeyupMousemove === undefined
      ? ""
      : `${Math.round(lastKeyupMousemove)} мс`;
  lastKeydownMousedownEl.innerText =
    lastKeydownMousedown === undefined
      ? ""
      : `${Math.round(lastKeydownMousedown)} мс`;
  lastKeyupMousedownEl.innerText =
    lastKeyupMousedown === undefined
      ? ""
      : `${Math.round(lastKeyupMousedown)} мс`;
};

const fillMin = () => {
  minKeydownMousemoveEl.innerText =
    minKeydownMousemove === undefined
      ? ""
      : `${Math.round(minKeydownMousemove)} мс`;
  minKeyupMousemoveEl.innerText =
    minKeyupMousemove === undefined
      ? ""
      : `${Math.round(minKeyupMousemove)} мс`;
  minKeydownMousedownEl.innerText =
    minKeydownMousedown === undefined
      ? ""
      : `${Math.round(minKeydownMousedown)} мс`;
  minKeyupMousedownEl.innerText =
    minKeyupMousedown === undefined
      ? ""
      : `${Math.round(minKeyupMousedown)} мс`;
};

const onKeydown = (e) => {
  keydownTime = e.timeStamp;

  keyupTime = undefined;
  lastKeydownMousemove = undefined;
  lastKeyupMousemove = undefined;
  lastKeydownMousedown = undefined;
  lastKeyupMousedown = undefined;

  fillLast();
};

const onKeyup = (e) => {
  keyupTime = e.timeStamp;
};

const onMousedown = (e) => {
  let changed = false;

  if (
    keydownTime !== undefined &&
    lastKeydownMousedown === undefined &&
    e.timeStamp > keydownTime
  ) {
    lastKeydownMousedown = e.timeStamp - keydownTime;
    minKeydownMousedown =
      minKeydownMousedown === undefined
        ? lastKeydownMousedown
        : Math.min(minKeydownMousedown, lastKeydownMousedown);
    changed = true;
  }

  if (
    keyupTime !== undefined &&
    lastKeyupMousedown === undefined &&
    e.timeStamp > keyupTime
  ) {
    lastKeyupMousedown = e.timeStamp - keyupTime;
    minKeyupMousedown =
      minKeyupMousedown === undefined
        ? lastKeyupMousedown
        : Math.min(minKeyupMousedown, lastKeyupMousedown);
    changed = true;
  }

  if (changed) {
    fillLast();
    fillMin();
  }
};

const onMousemove = (e) => {
  let changed = false;

  if (
    keydownTime !== undefined &&
    lastKeydownMousemove === undefined &&
    e.timeStamp > keydownTime
  ) {
    lastKeydownMousemove = e.timeStamp - keydownTime;
    minKeydownMousemove =
      minKeydownMousemove === undefined
        ? lastKeydownMousemove
        : Math.min(minKeydownMousemove, lastKeydownMousemove);
    changed = true;
  }

  if (
    keyupTime !== undefined &&
    lastKeyupMousemove === undefined &&
    e.timeStamp > keyupTime
  ) {
    lastKeyupMousemove = e.timeStamp - keyupTime;
    minKeyupMousemove =
      minKeyupMousemove === undefined
        ? lastKeyupMousemove
        : Math.min(minKeyupMousemove, lastKeyupMousemove);
    changed = true;
  }

  if (changed) {
    fillLast();
    fillMin();
  }
};

document.addEventListener("keydown", onKeydown);
document.addEventListener("keyup", onKeyup);
document.addEventListener("mousedown", onMousedown);
document.addEventListener("mousemove", onMousemove);
