# EmulatorJS Skill

## Overview

EmulatorJS is a web-based emulator that runs RetroArch compiled to WebAssembly. It allows embedding game emulators directly into web pages.

## Documentation

- Main docs: https://emulatorjs.org/docs
- Options: https://emulatorjs.org/docs/options
- Control mapping: https://emulatorjs.org/docs4devs/control-mapping
- Virtual gamepad: https://emulatorjs.org/docs4devs/virtual-gamepad-settings

## Basic Setup

```html
<div id="game"></div>
<script>
  EJS_player = '#game';
  EJS_core = 'gba';  // Game Boy Advance
  EJS_gameUrl = 'path/to/rom.gba';
  EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
</script>
<script src="https://cdn.emulatorjs.org/stable/data/loader.js"></script>
```

## Control Mapping (GBA)

Button IDs for `simulateInput()`:

```javascript
const buttonMap = {
  // GBA Button Mapping
  'B': 0,       // B button
  'Y': 1,       // Y (not on GBA, maps to nothing useful)
  'SELECT': 2,  // Select
  'START': 3,   // Start
  'UP': 4,      // D-pad Up
  'DOWN': 5,    // D-pad Down
  'LEFT': 6,    // D-pad Left
  'RIGHT': 7,   // D-pad Right
  'A': 8,       // A button
  'X': 9,       // X (not on GBA)
  'L': 10,      // Left shoulder
  'R': 11,      // Right shoulder
};

// Press button (1 = down, 0 = up)
emulatorInstance.gameManager.simulateInput(0, buttonId, 1); // Press
emulatorInstance.gameManager.simulateInput(0, buttonId, 0); // Release
```

## Programmatic Input

```javascript
// Press and release a button
function pressButton(button, duration = 100) {
  const buttonId = buttonMap[button];
  emulatorInstance.gameManager.simulateInput(0, buttonId, 1);
  setTimeout(() => {
    emulatorInstance.gameManager.simulateInput(0, buttonId, 0);
  }, duration);
}
```

## Hiding UI Elements

```javascript
// Hide all default controls/buttons on hover
EJS_Buttons = {
  playPause: false,
  restart: false,
  mute: false,
  settings: false,
  fullscreen: false,
  saveState: false,
  loadState: false,
  screenRecord: false,
  gamepad: false,
  cheat: false,
  volume: false,
  saveSavFiles: false,
  loadSavFiles: false,
  quickSave: false,
  quickLoad: false,
  screenshot: false,
  cacheManager: false,
  exitEmulation: false,
};

// Also hide default controls indicator
EJS_defaultControls = false;
```

## Important Callbacks

```javascript
// Called when game is fully loaded and ready
EJS_onGameStart = function() {
  console.log('Game started!');
  // emulatorInstance is now available as window.EJS_emulator
};

// Called when emulator core is ready (before game starts)
EJS_ready = function() {
  console.log('Emulator ready!');
};
```

## Capturing Frames

```javascript
// Get canvas element from emulator
const canvas = document.querySelector('#game canvas');

// Capture frame as data URL
function captureFrame() {
  return canvas.toDataURL('image/png');
}

// Or use toBlob for better performance
function captureFrameBlob(callback) {
  canvas.toBlob(callback, 'image/png');
}
```

## Volume Control

```javascript
// Set volume (0 to 1)
emulatorInstance.setVolume(0.6);

// Get current volume
const volume = emulatorInstance.getVolume();
```

## Save States

```javascript
// Save state
const state = await emulatorInstance.gameManager.getState();

// Load state
await emulatorInstance.gameManager.loadState(state);
```

## Common Issues

### Blank/White Screen on Frame Capture

If `canvas.toDataURL()` returns a blank image:
1. Ensure the canvas has `preserveDrawingBuffer: true` in WebGL context
2. EmulatorJS may clear the buffer between frames
3. Capture during the render loop or use `EJS_screenCapture` settings

### Input Not Registering

1. Ensure emulator is fully initialized (`EJS_onGameStart` fired)
2. Check button mapping matches the core (GBA vs NES have different IDs)
3. Verify `simulateInput` is called on correct player index (usually 0)
4. Add delay between press and release (100ms minimum recommended)

### Cross-Origin Issues

If loading ROMs from different domains:
```javascript
// Set CORS headers on ROM server
// Or use a proxy/blob URL
```

## Full Configuration Example

```javascript
// Player container
EJS_player = '#game';

// Core selection
EJS_core = 'gba';

// ROM URL
EJS_gameUrl = 'https://example.com/game.gba';

// Data path
EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

// Volume (0-1)
EJS_volume = 0.5;

// Auto-start when loaded
EJS_startOnLoaded = true;

// Debug mode (for development)
EJS_DEBUG_XX = false;

// Hide all UI buttons
EJS_Buttons = {
  playPause: false,
  restart: false,
  mute: false,
  settings: false,
  fullscreen: false,
  saveState: false,
  loadState: false,
  screenRecord: false,
  gamepad: false,
  cheat: false,
  volume: false,
  quickSave: false,
  quickLoad: false,
  screenshot: false,
  cacheManager: false,
};

// Callbacks
EJS_onGameStart = function() {
  window.emulatorReady = true;
  window.parent.postMessage({ type: 'READY' }, '*');
};
```
