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

//Creates undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.style.marginTop = "10px";
undoButton.style.marginRight = "10px";

// Stores drawing data
type Point = {
  x: number;
  y: number;
};

type Stroke = {
  points: Point[];
  color: string;
  lineWidth: number;
};

type DrawingDocument = {
  strokes: Stroke[];
};

const drawingDocument: DrawingDocument = {
  strokes: [],
};

// Tracks drawing state
let isDrawing = false;
let currentStroke: Stroke | null = null;

function undo() {
  if (isDrawing) {
    return; // don't undo mid-stroke
  }
  if (drawingDocument.strokes.length === 0) {
    return;
  }
  drawingDocument.strokes.pop();
  redrawCanvas();
}

function getPointerPosition(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// Draws a stored stroke
function drawStroke(stroke: Stroke) {
  if (stroke.points.length === 0) {
    return;
  }

  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.lineWidth;

  if (stroke.points.length === 1) {
    const point = stroke.points[0];

    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      stroke.lineWidth / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke();
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of drawingDocument.strokes) {
    drawStroke(stroke);
  }

  if (currentStroke !== null) {
    drawStroke(currentStroke);
  }
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType === "mouse") {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);

  const position = getPointerPosition(event);

  isDrawing = true;

  currentStroke = {
    points: [position],
    color: ctx.strokeStyle as string,
    lineWidth: ctx.lineWidth,
  };

  redrawCanvas();
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDrawing || currentStroke === null) {
    return;
  }

  const position = getPointerPosition(event);

  currentStroke.points.push(position);

  redrawCanvas();
});

// Saves the completed stroke in the document
function finishDrawing() {
  if (!isDrawing) {
    return;
  }
  if (currentStroke !== null) {
    drawingDocument.strokes.push(currentStroke);
    currentStroke = null;
  }

  isDrawing = false;
  redrawCanvas();
}

canvas.addEventListener("pointerup", finishDrawing);
canvas.addEventListener("pointercancel", finishDrawing);

// Clears the document and redraws the empty canvas
clearButton.addEventListener("click", () => {
  isDrawing = false;
  currentStroke = null;
  drawingDocument.strokes = [];

  redrawCanvas();
});

undoButton.addEventListener("click", undo);

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  }
});

// Add everything to the page (once)
app.append(heading, message, canvas, undoButton, clearButton);
