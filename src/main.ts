// Imports sticker images from the assets folder
import crueltyUrl from "./assets/cruelty.png";
import curiosityUrl from "./assets/curiosity.png";
import falsityUrl from "./assets/falsity.png";
import lovityUrl from "./assets/lovity.png";
import verityUrl from "./assets/verity.png";

const app = document.querySelector<HTMLElement>("#app")!;

// Creates heading and instructions
const heading = document.createElement("h1");
heading.textContent = "Draw Your Own Personal Helper Friend!";

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

// Creates brush width selector
const widthInput = document.createElement("label");
widthInput.textContent = "Brush Width: ";

const widthSelect = document.createElement("select");

const thinOption = document.createElement("option");
thinOption.value = "2";
thinOption.textContent = "Thin (2px)";

const mediumOption = document.createElement("option");
mediumOption.value = "5";
mediumOption.textContent = "Medium (5px)";

const thickOption = document.createElement("option");
thickOption.value = "10";
thickOption.textContent = "Thick (10px)";

widthSelect.append(thinOption, mediumOption, thickOption);
widthInput.append(widthSelect);
widthInput.style.display = "block";
widthInput.style.marginBottom = "10px";

// Creates clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
clearButton.style.marginTop = "10px";

//Creates undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.style.marginTop = "10px";
undoButton.style.marginRight = "10px";

//creates redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.style.marginTop = "10px";
redoButton.style.marginRight = "10px";

//Creates make sticker button
const makeStickerButton = document.createElement("button");
makeStickerButton.textContent = "Make Sticker";
makeStickerButton.style.marginTop = "10px";
makeStickerButton.style.marginRight = "10px";

//Creates bar that holds the sticker thumbnails
const stickerBar = document.createElement("div");
stickerBar.style.marginTop = "10px";

// Stores drawing data
type Point = {
  x: number;
  y: number;
};

type Stroke = {
  kind: "stroke";
  points: Point[];
  color: string;
  lineWidth: number;
};

type PlacedSticker = {
  kind: "sticker";
  x: number;
  y: number;
  image: HTMLCanvasElement;
};

// Strokes and stickers share one list so undo/redo works for both
type Item = Stroke | PlacedSticker;

type DrawingDocument = {
  items: Item[];
};

const drawingDocument: DrawingDocument = {
  items: [],
};

// Tracks drawing state
let isDrawing = false;
let currentStroke: Stroke | null = null;

const redoStack: Item[] = [];

// Tracks sticker state
const stickers: HTMLCanvasElement[] = [];
let selectedSticker: HTMLCanvasElement | null = null;

function undo() {
  if (isDrawing) {
    return;
  }
  const item = drawingDocument.items.pop();
  if (item) {
    redoStack.push(item);
    redrawCanvas();
  }
}

function redo() {
  if (isDrawing) return;
  const item = redoStack.pop();
  if (item) {
    drawingDocument.items.push(item);
    redrawCanvas();
  }
}

function getPointerPosition(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

// Draws a stored stroke or sticker onto any canvas context
function drawItem(context: CanvasRenderingContext2D, item: Item) {
  if (item.kind === "sticker") {
    context.drawImage(item.image, item.x, item.y);
    return;
  }

  if (item.points.length === 0) {
    return;
  }

  context.strokeStyle = item.color;
  context.fillStyle = item.color;
  context.lineWidth = item.lineWidth;

  if (item.points.length === 1) {
    const point = item.points[0];

    context.beginPath();
    context.arc(
      point.x,
      point.y,
      item.lineWidth / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    return;
  }

  context.beginPath();
  context.moveTo(item.points[0].x, item.points[0].y);

  for (let i = 1; i < item.points.length; i++) {
    context.lineTo(item.points[i].x, item.points[i].y);
  }

  context.stroke();
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const item of drawingDocument.items) {
    drawItem(ctx, item);
  }

  if (currentStroke !== null) {
    drawItem(ctx, currentStroke);
  }
}

// Turns the current strokes into a cropped, transparent sticker
function createStickerFromDrawing(): HTMLCanvasElement | null {
  const strokes = drawingDocument.items.filter(
    (item): item is Stroke => item.kind === "stroke",
  );

  if (strokes.length === 0) {
    return null;
  }

  // Finds the bounding box of everything drawn
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    const pad = stroke.lineWidth / 2;

    for (const point of stroke.points) {
      minX = Math.min(minX, point.x - pad);
      minY = Math.min(minY, point.y - pad);
      maxX = Math.max(maxX, point.x + pad);
      maxY = Math.max(maxY, point.y + pad);
    }
  }

  const sticker = document.createElement("canvas");
  sticker.width = Math.ceil(maxX - minX);
  sticker.height = Math.ceil(maxY - minY);

  const stickerCtx = sticker.getContext("2d")!;
  stickerCtx.lineCap = "round";
  stickerCtx.lineJoin = "round";
  stickerCtx.translate(-minX, -minY); // shifts the drawing to (0, 0)

  for (const stroke of strokes) {
    drawItem(stickerCtx, stroke);
  }

  return sticker;
}

// Adds a thumbnail button for a sticker
function addStickerButton(sticker: HTMLCanvasElement) {
  const button = document.createElement("button");

  const image = document.createElement("img");
  image.src = sticker.toDataURL("image/png");
  image.style.height = "40px";
  image.style.maxWidth = "80px";

  button.append(image);

  button.addEventListener("click", () => {
    // Clicking the selected sticker again deselects it
    selectedSticker = selectedSticker === sticker ? null : sticker;
    canvas.style.cursor = selectedSticker ? "copy" : "crosshair";

    for (const child of Array.from(stickerBar.children)) {
      (child as HTMLElement).style.outline = "";
    }

    if (selectedSticker) {
      button.style.outline = "3px solid dodgerblue";
    }
  });

  stickerBar.append(button);
}

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType === "mouse") {
    return;
  }

  event.preventDefault();

  const position = getPointerPosition(event);

  // Places the selected sticker instead of drawing
  if (selectedSticker) {
    drawingDocument.items.push({
      kind: "sticker",
      x: position.x - selectedSticker.width / 2, // centers on the pointer
      y: position.y - selectedSticker.height / 2,
      image: selectedSticker,
    });
    redoStack.length = 0;

    redrawCanvas();
    return;
  }

  canvas.setPointerCapture(event.pointerId);

  isDrawing = true;

  currentStroke = {
    kind: "stroke",
    points: [position],
    color: ctx.strokeStyle as string,
    lineWidth: Number(widthSelect.value),
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
    drawingDocument.items.push(currentStroke);
    redoStack.length = 0; // new stroke invalidates redo history
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
  drawingDocument.items = [];
  redoStack.length = 0;

  redrawCanvas();
});

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

// Saves the drawing as a sticker, then clears the canvas
makeStickerButton.addEventListener("click", () => {
  if (isDrawing) {
    return;
  }

  const sticker = createStickerFromDrawing();
  if (!sticker) {
    return;
  }

  stickers.push(sticker);
  addStickerButton(sticker);

  drawingDocument.items = [];
  redoStack.length = 0;

  redrawCanvas();
});

document.addEventListener("keydown", (event) => {
  const modifier = event.ctrlKey || event.metaKey;
  if (!modifier) return;

  const key = event.key.toLowerCase();

  if (key === "z") {
    event.preventDefault();
    undo();
  } else if (key === "y") {
    event.preventDefault();
    redo();
  }
});

// Loads a PNG file, shrinks it if it's large, and adds it as a sticker
const MAX_ASSET_SIZE = 120;

function addAssetSticker(url: string) {
  const image = new Image();

  image.addEventListener("load", () => {
    // Only shrinks images, never enlarges them
    const scale = Math.min(
      1,
      MAX_ASSET_SIZE / Math.max(image.width, image.height),
    );

    const sticker = document.createElement("canvas");
    sticker.width = Math.max(1, Math.round(image.width * scale));
    sticker.height = Math.max(1, Math.round(image.height * scale));

    const stickerCtx = sticker.getContext("2d")!;
    stickerCtx.drawImage(image, 0, 0, sticker.width, sticker.height);

    stickers.push(sticker);
    addStickerButton(sticker);
  });

  image.src = url;
}

const assetUrls = [
  crueltyUrl,
  curiosityUrl,
  falsityUrl,
  lovityUrl,
  verityUrl,
];

for (const url of assetUrls) {
  addAssetSticker(url);
}

app.append(
  heading,
  message,
  widthInput,
  canvas,
  undoButton,
  redoButton,
  makeStickerButton,
  clearButton,
  stickerBar,
);
