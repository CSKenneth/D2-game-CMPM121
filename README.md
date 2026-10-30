# What we did

We created a simple drawing canvas with the theme of variety. Users are able to draw using different brush sizes, place stickers, and create their own stick. Users are
also able to export drawings as PNG images.

# Playable Link

https://cskenneth.github.io/D2-game-CMPM121/

# How to use the app

1. Open playable Link
2. Select brush icon to draw on the canvas
3. Click the box to the right of "Brush Width" to change brush width
4. Select any sticker from sticker bar and click on canvas to place on canvas
5. Click "Make Stick" to turn current canvas drawing into a sticker.
6. Click "Create Custom Tool" to create a stick using text and/or emojis
7. Use "Undo" and "Redo" button to reverse or restore a recent drawing aciton
8. Click "Clear Canvas" to remove current items and drawings on canvas.
9. Click "Export PNG" to download current drawing on canvas

# Commits

1. Making a mark - Created a basic canvas where a user can interact and draw on using provided links "Canvas tutorial" as reference.
2. Changed how store data is stored - Changed how the appication is saving the drawing information. Allows strokes to be represented as ordered points and appearances.
   Then also store the completed strokes in a document collection.
3. Added an undo button that reverses strokes - Created an undo and redo button that is able to store the given data then when pressed it is able to undo or redo canvas
   history.
4. Added changable brushes - Created a thin and thick brush with which gives the user more options to paint with.
5. make your own stickers, preset veritiy stickers, also changed some text - Created variety preset stickers and also made makeable stick that allows the user to turn
   their drawing on the canvas into a sticker. Also changed a few variable names and titles. Smelly Code: Found badly named variables that did not fit current code section.
6. Added a brush icon so user can return to brush - Added a brush icon to sticker section that allowed for easy swaping of tools.
7. Created text stick custom tool - Added a custom tool maker that allowed for users to create stickers using text and emojis.
8. Changed how strokes are commited - Changed how stroke on the canvas behaves and made it so that when a stroke is canceled there are no accidentally commited object.
9. added export feature and it works! - Created an export feature that allows the user to save and name their drawing.
10. Removed unnecessary comments - Removed a bunch of unnecessary comments that was cluttering up the code. Smelly Code: Unnecessary comments

# Developer Guide

Rectangle tool maker:

| Existing Location | What would be needed to change                                                   |
| ----------------- | -------------------------------------------------------------------------------- |
| **SelectedTool**  | Add a rectangle to tool options                                                  |
| **Undo/Redo**     | Reuses existing code to store rectangle as documented item                       |
| **exportDrawing** | Reuses existing export code to allow rectangle to appear as a PNG when exporting |

# Commit Link

https://github.com/CSKenneth/D2-game-CMPM121/commits/main/src

# Sources

Used "Canvas tutorial" to create a base canvas. (https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
Used "TypeScript object types" as reference for property modifiers.(https://www.typescriptlang.org/docs/handbook/2/objects.html)
Used "Save" as reference to help save drawing state.(https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save)
Used "Restore" as reference to help restore drawing state.(https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/restore)
Ai image generator used to create imagine of paint brush without a background.

# D2 starter

A minimal TypeScript/Vite browser project with Deno checks and GitHub Pages deployment.(https://deepai.org/machine-learning-model/text2img)

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
