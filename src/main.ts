// Imports sticker images from the assets folder
import crueltyUrl from "./assets/cruelty.png";
import curiosityUrl from "./assets/curiosity.png";
import falsityUrl from "./assets/falsity.png";
import lovityUrl from "./assets/lovity.png";
import verityUrl from "./assets/verity.png";
import brushUrl from "./assets/brush.png";

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

// Creates undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.style.marginTop = "10px";
undoButton.style.marginLeft = "10px";
undoButton.style.marginRight = "10px";

// Creates redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.style.marginTop = "10px";
redoButton.style.marginRight = "10px";

// Creates make sticker button
const makeStickerButton = document.createElement("button");
makeStickerButton.textContent = "Make Sticker";
makeStickerButton.style.marginTop = "10px";
makeStickerButton.style.marginRight = "10px";

// Creates custom tool button
const createToolButton = document.createElement("button");
createToolButton.textContent = "Create Custom Tool";
createToolButton.style.marginTop = "10px";
createToolButton.style.marginRight = "10px";

// Creates a container for the custom tool form
const customToolForm = document.createElement("div");
customToolForm.style.marginTop = "10px";
customToolForm.style.marginBottom = "10px";
customToolForm.style.display = "none";

// Creates the emoji or text input
const toolContentInput = document.createElement("input");
toolContentInput.type = "text";
toolContentInput.placeholder = "Enter emoji or short text";
toolContentInput.setAttribute("aria-label", "Emoji or short text");

// Creates the submit button
const submitToolButton = document.createElement("button");
submitToolButton.textContent = "Create Tool";
submitToolButton.style.marginLeft = "5px";

// Creates a cancel button
const cancelToolButton = document.createElement("button");
cancelToolButton.textContent = "Cancel";
cancelToolButton.style.marginLeft = "5px";

// Adds the input and buttons to the form
customToolForm.append(
  toolContentInput,
  submitToolButton,
  cancelToolButton,
);

// Creates bar that holds the brush and sticker thumbnails
const stickerBar = document.createElement("div");
stickerBar.style.marginTop = "10px";

// Creates brush selection button using an image asset
const brushButton = document.createElement("button");
brushButton.title = "Brush Mode";
brushButton.style.width = "60px";
brushButton.style.height = "50px";
brushButton.style.marginRight = "5px";
brushButton.style.verticalAlign = "top";
brushButton.style.outline = "3px solid dodgerblue";

const brushImage = document.createElement("img");
brushImage.src = brushUrl;
brushImage.alt = "Brush";
brushImage.style.width = "40px";
brushImage.style.height = "40px";
brushImage.style.objectFit = "contain";

brushButton.append(brushImage);

// Adds the brush before the sticker thumbnails
stickerBar.append(brushButton);

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

// Undoes the most recent drawing or sticker placement
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

// Redoes the most recently undone action
function redo() {
  if (isDrawing) return;

  const item = redoStack.pop();
  if (item) {
    drawingDocument.items.push(item);
    redrawCanvas();
  }
}

// Gets the pointer position relative to the canvas
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

// Redraws all saved items on the canvas
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
  sticker.width = Math.max(1, Math.ceil(maxX - minX));
  sticker.height = Math.max(1, Math.ceil(maxY - minY));

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
function addStickerButton(sticker: HTMLCanvasElement, name = "Sticker") {
  const button = document.createElement("button");
  button.title = name;
  button.setAttribute("aria-label", name);
  button.style.width = "60px";
  button.style.height = "50px";
  button.style.marginRight = "5px";
  button.style.verticalAlign = "top";

  const image = document.createElement("img");
  image.src = sticker.toDataURL("image/png");
  image.alt = name;
  image.style.height = "40px";
  image.style.maxWidth = "50px";
  image.style.objectFit = "contain";

  button.append(image);

  button.addEventListener("click", () => {
    // Clicking the selected sticker again deselects it
    selectedSticker = selectedSticker === sticker ? null : sticker;
    canvas.style.cursor = selectedSticker ? "copy" : "crosshair";

    // Removes the highlight from all thumbnails
    for (const child of Array.from(stickerBar.children)) {
      (child as HTMLElement).style.outline = "";
    }

    // Highlights the selected sticker or brush
    if (selectedSticker) {
      button.style.outline = "3px solid dodgerblue";
    } else {
      brushButton.style.outline = "3px solid dodgerblue";
    }
  });

  stickerBar.append(button);
}

// Switches back to the brush and deselects the current sticker
brushButton.addEventListener("click", () => {
  selectedSticker = null;
  canvas.style.cursor = "crosshair";

  // Removes the highlight from all thumbnails
  for (const child of Array.from(stickerBar.children)) {
    (child as HTMLElement).style.outline = "";
  }

  // Highlights the brush button
  brushButton.style.outline = "3px solid dodgerblue";
});

// Shows or hides the custom tool form
createToolButton.addEventListener("click", () => {
  if (customToolForm.style.display === "none") {
    customToolForm.style.display = "block";
    toolContentInput.focus();
  } else {
    customToolForm.style.display = "none";
  }
});

// Creates a custom sticker tool from the form input
submitToolButton.addEventListener("click", () => {
  const content = toolContentInput.value.trim();

  // Does not create a tool if the input is empty
  if (content === "") {
    return;
  }

  // Creates a transparent canvas for the custom sticker
  const sticker = document.createElement("canvas");
  sticker.width = 120;
  sticker.height = 80;

  const stickerCtx = sticker.getContext("2d")!;

  // Draws the emoji or text onto the sticker
  stickerCtx.font = "40px sans-serif";
  stickerCtx.textAlign = "center";
  stickerCtx.textBaseline = "middle";
  stickerCtx.fillStyle = "black";
  stickerCtx.fillText(content, 60, 40, 116);

  // Adds the custom sticker to the shared collection
  stickers.push(sticker);

  // Uses the emoji or text as the custom tool name
  addStickerButton(sticker, content);

  // Clears and hides the form after creating the tool
  toolContentInput.value = "";
  customToolForm.style.display = "none";
});

// Allows Enter to create the custom tool
toolContentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitToolButton.click();
  }
});

// Closes the form without creating a tool
cancelToolButton.addEventListener("click", () => {
  toolContentInput.value = "";
  customToolForm.style.display = "none";
});

// Handles drawing or placing a sticker on the canvas
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

// Adds points while the user draws
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

// Connects undo and redo buttons
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
  addStickerButton(sticker, "My Drawing");

  drawingDocument.items = [];
  redoStack.length = 0;

  redrawCanvas();
});

// Adds keyboard shortcuts for undo and redo
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

// List of preset sticker assets
const assetUrls = [
  crueltyUrl,
  curiosityUrl,
  falsityUrl,
  lovityUrl,
  verityUrl,
];

// Adds the preset stickers to the palette
for (const url of assetUrls) {
  addAssetSticker(url);
}

// Adds all interface elements to the page
app.append(
  heading,
  message,
  widthInput,
  canvas,
  makeStickerButton,
  createToolButton,
  customToolForm,
  clearButton,
  undoButton,
  redoButton,
  stickerBar,
);
