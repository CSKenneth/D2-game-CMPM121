import crueltyUrl from "./assets/cruelty.png";
import curiosityUrl from "./assets/curiosity.png";
import falsityUrl from "./assets/falsity.png";
import lovityUrl from "./assets/lovity.png";
import verityUrl from "./assets/verity.png";
import brushUrl from "./assets/brush.png";

const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "Draw Your Own Personal Helper Friend!";

const message = document.createElement("p");
message.textContent = "Click and drag to draw";

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

const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "black";

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

const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
clearButton.style.marginTop = "10px";

const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.style.marginTop = "10px";
undoButton.style.marginLeft = "10px";
undoButton.style.marginRight = "10px";

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.style.marginTop = "10px";
redoButton.style.marginRight = "10px";

const makeStickerButton = document.createElement("button");
makeStickerButton.textContent = "Make Sticker";
makeStickerButton.style.marginTop = "10px";
makeStickerButton.style.marginRight = "10px";

const createToolButton = document.createElement("button");
createToolButton.textContent = "Create Custom Tool";
createToolButton.style.marginTop = "10px";
createToolButton.style.marginRight = "10px";

const exportButton = document.createElement("button");
exportButton.textContent = "Export PNG";
exportButton.style.marginTop = "10px";
exportButton.style.marginRight = "10px";

const customToolForm = document.createElement("div");
customToolForm.style.marginTop = "10px";
customToolForm.style.marginBottom = "10px";
customToolForm.style.display = "none";

const toolContentInput = document.createElement("input");
toolContentInput.type = "text";
toolContentInput.placeholder = "Enter emoji or short text";
toolContentInput.setAttribute("aria-label", "Emoji or short text");

const submitToolButton = document.createElement("button");
submitToolButton.textContent = "Create Tool";
submitToolButton.style.marginLeft = "5px";

const cancelToolButton = document.createElement("button");
cancelToolButton.textContent = "Cancel";
cancelToolButton.style.marginLeft = "5px";

customToolForm.append(
  toolContentInput,
  submitToolButton,
  cancelToolButton,
);

const stickerBar = document.createElement("div");
stickerBar.style.marginTop = "10px";

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

stickerBar.append(brushButton);

type Point = {
  x: number;
  y: number;
};

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

type Item = Stroke | PlacedSticker;

type DrawingDocument = {
  items: Item[];
};

const drawingDocument: DrawingDocument = {
  items: [],
};

type SelectedTool =
  | { kind: "brush" }
  | { kind: "sticker"; sticker: HTMLCanvasElement };

let selectedTool: SelectedTool = { kind: "brush" };

let isDrawing = false;
let currentStroke: Stroke | null = null;
let activePointerId: number | null = null;

const redoStack: Item[] = [];

const stickers: HTMLCanvasElement[] = [];

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

    draw(context) {
      drawStroke(context, stroke);
    },
  };

  return stroke;
}

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

    draw(context) {
      context.save();
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(sticker.image, sticker.x, sticker.y);
      context.restore();
    },
  };

  return sticker;
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
) {
  if (stroke.points.length === 0) {
    return;
  }

  context.save();

  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";

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

function drawItem(context: CanvasRenderingContext2D, item: Item) {
  item.draw(context);
}

function renderItems(context: CanvasRenderingContext2D, items: Item[]) {
  for (const item of items) {
    drawItem(context, item);
  }
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderItems(ctx, drawingDocument.items);

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
    if (isDrawing) {
      cancelDrawing();
    }

    if (selectedTool.kind === "sticker" && selectedTool.sticker === sticker) {
      selectedTool = { kind: "brush" };
    } else {
      selectedTool = { kind: "sticker", sticker };
    }

    canvas.style.cursor = selectedTool.kind === "sticker"
      ? "copy"
      : "crosshair";

    for (const child of Array.from(stickerBar.children)) {
      (child as HTMLElement).style.outline = "";
    }

    if (selectedTool.kind === "sticker") {
      button.style.outline = "3px solid dodgerblue";
    } else {
      brushButton.style.outline = "3px solid dodgerblue";
    }
  });

  stickerBar.append(button);
}

brushButton.addEventListener("click", () => {
  if (isDrawing) {
    cancelDrawing();
  }

  selectedTool = { kind: "brush" };
  canvas.style.cursor = "crosshair";

  for (const child of Array.from(stickerBar.children)) {
    (child as HTMLElement).style.outline = "";
  }

  brushButton.style.outline = "3px solid dodgerblue";
});

createToolButton.addEventListener("click", () => {
  if (customToolForm.style.display === "none") {
    customToolForm.style.display = "block";
    toolContentInput.focus();
  } else {
    customToolForm.style.display = "none";
  }
});

submitToolButton.addEventListener("click", () => {
  const content = toolContentInput.value.trim();

  if (content === "") {
    return;
  }

  const sticker = document.createElement("canvas");
  sticker.width = 120;
  sticker.height = 80;

  const stickerCtx = sticker.getContext("2d")!;

  stickerCtx.font = "40px sans-serif";
  stickerCtx.textAlign = "center";
  stickerCtx.textBaseline = "middle";
  stickerCtx.fillStyle = "black";
  stickerCtx.fillText(content, 60, 40, 116);

  stickers.push(sticker);
  addStickerButton(sticker, content);

  toolContentInput.value = "";
  customToolForm.style.display = "none";
});

toolContentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitToolButton.click();
  }
});

cancelToolButton.addEventListener("click", () => {
  toolContentInput.value = "";
  customToolForm.style.display = "none";
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType === "mouse") {
    return;
  }

  event.preventDefault();

  const position = getPointerPosition(event);

  if (selectedTool.kind === "sticker") {
    drawingDocument.items.push(
      createStickerCommand(
        selectedTool.sticker,
        position.x - selectedTool.sticker.width / 2,
        position.y - selectedTool.sticker.height / 2,
      ),
    );

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

clearButton.addEventListener("click", () => {
  cancelDrawing();

  drawingDocument.items = [];
  redoStack.length = 0;

  redrawCanvas();
});

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

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

const MAX_ASSET_SIZE = 120;

function addAssetSticker(url: string) {
  const image = new Image();

  image.addEventListener("load", () => {
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

const EXPORT_SCALE = 2;

function exportDrawing() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * EXPORT_SCALE; // 1600
  exportCanvas.height = canvas.height * EXPORT_SCALE; // 1000

  const exportCtx = exportCanvas.getContext("2d")!;

  exportCtx.fillStyle = "white";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Same document coordinates, scaled up
  exportCtx.scale(EXPORT_SCALE, EXPORT_SCALE);

  renderItems(exportCtx, drawingDocument.items);

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-helper-friend.png";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

exportButton.addEventListener("click", exportDrawing);

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
  makeStickerButton,
  createToolButton,
  customToolForm,
  exportButton,
  clearButton,
  undoButton,
  redoButton,
  stickerBar,
);
