const app = document.querySelector<HTMLElement>("#app")!;

// Creates heading and instructions
const heading = document.createElement("h1");
heading.textContent = "D2 project";

const message = document.createElement("p");
message.textContent = "Click and drag to draw";

// Creates canvas
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 500;

canvas.style.width = "100%";
canvas.style.maxWidth = "800px";
canvas.style.height = "auto";
canvas.style.display = "block";
canvas.style.border = "2px solid black";
canvas.style.backgroundColor = "white";
canvas.style.cursor = "crosshair";
canvas.style.touchAction = "none";

// Creates brush
const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "black";

// Creates clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
clearButton.style.marginTop = "10px";

// Tracks drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function getPointerPosition(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// Starts drawing when pointer is pressed down
canvas.addEventListener("pointerdown", (event) => {
  // Ignore right-clicks and other non-left mouse buttons.
  if (event.button !== 0 && event.pointerType === "mouse") {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);

  const position = getPointerPosition(event);

  isDrawing = true;
  lastX = position.x;
  lastY = position.y;

  ctx.beginPath();
  ctx.arc(lastX, lastY, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
});

// Draws the line as pointer moves
canvas.addEventListener("pointermove", (event) => {
  // Do not draw unless the user is actively drawing.
  if (!isDrawing) {
    return;
  }

  const position = getPointerPosition(event);

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(position.x, position.y);
  ctx.stroke();

  lastX = position.x;
  lastY = position.y;
});

function finishDrawing() {
  isDrawing = false;
  ctx.beginPath();
}

canvas.addEventListener("pointerup", finishDrawing);
canvas.addEventListener("pointercancel", finishDrawing);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

app.append(heading, message, canvas, clearButton);
