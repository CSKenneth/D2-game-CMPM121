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

// Shared rendering operation for every recorded drawing command
type DrawingCommand = {
  draw(context: CanvasRenderingContext2D): void;
};

type Stroke = DrawingCommand & {
  kind: "stroke";
  points: Point[];
  color: string;
  lineWidth: number;
};

type PlacedSticker = DrawingCommand & {
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

// Tracks the currently selected tool separately from drawing data
type SelectedTool =
  | { kind: "brush" }
  | { kind: "sticker"; sticker: HTMLCanvasElement };

let selectedTool: SelectedTool = { kind: "brush" };

// Tracks the temporary stroke separately from committed content
let isDrawing = false;
let currentStroke: Stroke | null = null;
let activePointerId: number | null = null;

const redoStack: Item[] = [];

// Stores available sticker tools
const stickers: HTMLCanvasElement[] = [];

// Creates a stroke command that can draw on any canvas context
function createStroke(
  points: Point[],
  color: string,
  lineWidth: number,
): Stroke {
  const stroke: Stroke = {
    kind: "stroke",
    points,
    color,
    lineWidth,

    // Draws this command using the supplied context
    draw(context) {
      drawStroke(context, stroke);
    },
  };

  return stroke;
}

// Creates a sticker command that can draw on any canvas context
function createStickerCommand(
  image: HTMLCanvasElement,
  x: number,
  y: number,
): PlacedSticker {
  const sticker: PlacedSticker = {
    kind: "sticker",
    x,
    y,
    image,

    // Draws this command using the supplied context
    draw(context) {
      context.drawImage(sticker.image, sticker.x, sticker.y);
    },
  };

  return sticker;
}

// Draws a stroke without depending on the interactive canvas context
function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
) {
  if (stroke.points.length === 0) {
    return;
  }

  // Prevents this command's drawing settings from affecting other commands
  context.save();

  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Draws a dot if the user only clicked once
  if (stroke.points.length === 1) {
    const point = stroke.points[0];

    context.beginPath();
    context.arc(
      point.x,
      point.y,
      stroke.lineWidth / 2,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    context.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  context.stroke();
  context.restore();
}

// Draws any recorded command using the target context
function drawItem(context: CanvasRenderingContext2D, item: Item) {
  item.draw(context);
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const item of drawingDocument.items) {
    drawItem(ctx, item);
  }

  if (currentStroke !== null) {
    currentStroke.draw(ctx);
  }
}

function cancelDrawing() {
  const pointerId = activePointerId;

  isDrawing = false;
  currentStroke = null;
  activePointerId = null;

  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }

  redrawCanvas();
}

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
  if (isDrawing) {
    return;
  }

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
  stickerCtx.translate(-minX, -minY);

  for (const stroke of strokes) {
    stroke.draw(stickerCtx);
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
    // Selecting a tool cancels any unfinished gesture
    if (isDrawing) {
      cancelDrawing();
    }

    // Clicking the selected sticker again switches back to the brush
    if (selectedTool.kind === "sticker" && selectedTool.sticker === sticker) {
      selectedTool = { kind: "brush" };
    } else {
      selectedTool = { kind: "sticker", sticker };
    }

    canvas.style.cursor = selectedTool.kind === "sticker"
      ? "copy"
      : "crosshair";

    // Removes the highlight from all thumbnails
    for (const child of Array.from(stickerBar.children)) {
      (child as HTMLElement).style.outline = "";
    }

    // Highlights the selected sticker or brush
    if (selectedTool.kind === "sticker") {
      button.style.outline = "3px solid dodgerblue";
    } else {
      brushButton.style.outline = "3px solid dodgerblue";
    }
  });

  stickerBar.append(button);
}

// Switches back to the brush without changing committed content
brushButton.addEventListener("click", () => {
  if (isDrawing) {
    cancelDrawing();
  }

  selectedTool = { kind: "brush" };
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

  // Adds the custom sticker to the shared collection of tools
  stickers.push(sticker);
  addStickerButton(sticker, content);

  // Creating a tool does not place it on the drawing canvas
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

  // Places the selected sticker as a committed command
  if (selectedTool.kind === "sticker") {
    drawingDocument.items.push(
      createStickerCommand(
        selectedTool.sticker,
        position.x - selectedTool.sticker.width / 2,
        position.y - selectedTool.sticker.height / 2,
      ),
    );

    // A new committed action clears redo history
    redoStack.length = 0;
    redrawCanvas();
    return;
  }

  canvas.setPointerCapture(event.pointerId);

  isDrawing = true;
  activePointerId = event.pointerId;

  currentStroke = createStroke(
    [position],
    ctx.strokeStyle as string,
    Number(widthSelect.value),
  );

  redrawCanvas();
});

canvas.addEventListener("pointermove", (event) => {
  if (
    !isDrawing ||
    currentStroke === null ||
    event.pointerId !== activePointerId
  ) {
    return;
  }

  const position = getPointerPosition(event);
  currentStroke.points.push(position);

  redrawCanvas();
});

function finishDrawing(event: PointerEvent) {
  if (
    !isDrawing ||
    currentStroke === null ||
    event.pointerId !== activePointerId
  ) {
    return;
  }

  const completedStroke = currentStroke;

  currentStroke = null;
  isDrawing = false;
  activePointerId = null;

  drawingDocument.items.push(completedStroke);

  redoStack.length = 0;

  redrawCanvas();
}

canvas.addEventListener("pointerup", finishDrawing);

canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId === activePointerId) {
    cancelDrawing();
  }
});

canvas.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId === activePointerId) {
    cancelDrawing();
  }
});

// Clears the document and discards any unfinished stroke
clearButton.addEventListener("click", () => {
  cancelDrawing();

  drawingDocument.items = [];
  redoStack.length = 0;

  redrawCanvas();
});

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

// Saves the committed drawing as a sticker, then clears the canvas
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

// Adds keyboard shortcuts for undo, redo, and canceling a stroke
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isDrawing) {
    cancelDrawing();
    return;
  }

  const modifier = event.ctrlKey || event.metaKey;

  if (!modifier) {
    return;
  }

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
