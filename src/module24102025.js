/**
 * Terrain Difficulty Tool for Foundry VTT v12
 * 
 * Comprehensive terrain and movement management system for D&D 5e in Foundry VTT.
 * Features terrain painting, automatic movement tracking, combat integration, and enforcement.
 * 
 * TERRAIN FEATURES:
 * - Select from 8 different D&D 5e terrain types (each with unique colors)
 * - Left-click/drag to add terrain, right-click/drag to remove it
 * - Snaps to the scene grid, visually highlights affected cells with type-specific colors
 * - Press Ctrl+Z to undo the last terrain change (up to 20 steps)
 * - Persists terrain data (including types) in scene flags
 * 
 * MOVEMENT TRACKING:
 * - Automatically calculates movement costs (difficult terrain = 2x movement)
 * - Combat tracker integration - tracks remaining movement per token per turn
 * - Visual movement display on token HUD during combat
 * - Movement enforcement - prevents tokens from exceeding available movement
 * - Configurable settings for tracking, enforcement, and combat-only mode
 * - GM tool to manually reset movement for selected tokens
 * 
 * SETTINGS:
 * - Enable/disable movement tracking
 * - Enable/disable movement enforcement
 * - Combat-only mode or always track
 * - Auto-reset movement each turn
 * 
 * @author Damien Cresswell - Sistena Ltd.
 * @version 1.0.0
 * @date 22/10/2025
 */

// Register the control tool immediately
Hooks.on("getSceneControlButtons", (controls) => {
  try {
  // Find the tiles control group
  const tilesControl = controls.find(c => c.name === "tiles");
  
  if (tilesControl && game.user.isGM) {
    // Add our tools to the tiles control group
    tilesControl.tools.push(
      {
        name: "selectTerrainType",
        title: "Select Terrain Type",
        icon: "fas fa-palette",
        onClick: () => showTerrainTypeDialog(),
        button: true
      },
        {
          name: "markRoughTerrain",
          title: "Mark Rough Terrain",
        icon: "fas fa-mountain",
          toggle: true,
          onClick: () => toggleTerrainTool(),
          active: false,
          button: true
        },
        {
          name: "clearAllTerrain",
          title: "Clear All Rough Terrain",
        icon: "fas fa-trash-alt",
          onClick: () => clearAllTerrain(),
          button: true
      },
      {
        name: "resetMovement",
        title: "Reset Selected Token Movement",
        icon: "fas fa-redo",
        onClick: () => resetSelectedTokenMovement(),
          button: true
        }
    );
  }
} catch (error) {
  console.error("Terrain Difficulty | Error adding control buttons:", error);
}
});

Hooks.once("init", () => {
// Register module settings
registerSettings();
});

Hooks.once("ready", () => {
// Set up canvas listeners (GM for terrain, all users for movement tracking)
if (canvas?.ready) {
  attachCanvasListeners();
}

setupCanvasListeners();

// Keyboard shortcuts for terrain tool (GM only)
if (game.user.isGM) {
  setupKeyboardListeners();
}

// Movement tracking for all users
setupMovementTracking();
setupCombatTracking();
setupMovementOverlays();
});

let terrainToolActive = false;
let isDragging = false;
let dragStart = null;
let dragEnd = null;
let previewRect = null;
let undoStack = []; // Stack to store previous terrain states
const MAX_UNDO_STEPS = 20; // Maximum number of undo steps to keep
let selectedTerrainType = "difficult"; // Default terrain type

// D&D 5e Terrain Types with colors
const TERRAIN_TYPES = {
difficult: { 
  label: "Difficult Terrain (General)", 
  color: 0xff8000, 
  alpha: 0.25,
  description: "Costs 2 feet of movement for every 1 foot moved"
},
ice: { 
  label: "Icy/Slippery", 
  color: 0x88ddff, 
  alpha: 0.3,
  description: "Difficult terrain, may require Dexterity saves"
},
mud: { 
  label: "Muddy/Swampy", 
  color: 0x8b4513, 
  alpha: 0.3,
  description: "Difficult terrain, may slow movement further"
},
rubble: { 
  label: "Rocky/Rubble", 
  color: 0x808080, 
  alpha: 0.3,
  description: "Difficult terrain, may provide cover"
},
foliage: { 
  label: "Dense Foliage/Undergrowth", 
  color: 0x228b22, 
  alpha: 0.3,
  description: "Difficult terrain, may provide concealment"
},
water: { 
  label: "Shallow Water", 
  color: 0x1e90ff, 
  alpha: 0.3,
  description: "Difficult terrain, may affect certain abilities"
},
sand: { 
  label: "Sand/Desert", 
  color: 0xdaa520, 
  alpha: 0.3,
  description: "Difficult terrain in deep sand"
},
snow: { 
  label: "Snow/Ice", 
  color: 0xf0f8ff, 
  alpha: 0.4,
  description: "Difficult terrain, may obscure tracks"
}
};

/* -----------------------------
 Module Settings
----------------------------- */
function registerSettings() {
game.settings.register("terrain-difficulty", "enableMovementTracking", {
  name: "Enable Movement Tracking",
  hint: "Show notifications when tokens move through difficult terrain",
  scope: "world",
  config: true,
  type: Boolean,
  default: true
});

game.settings.register("terrain-difficulty", "enforceMovement", {
  name: "Enforce Movement Limits",
  hint: "Prevent tokens from moving if they exceed their available movement speed",
  scope: "world",
  config: true,
  type: Boolean,
  default: true
});

game.settings.register("terrain-difficulty", "combatOnly", {
  name: "Track Movement in Combat Only",
  hint: "Only track and enforce movement during combat encounters",
  scope: "world",
  config: true,
  type: Boolean,
  default: true
});

game.settings.register("terrain-difficulty", "resetOnTurn", {
  name: "Reset Movement Each Turn",
  hint: "Reset available movement at the start of each token's turn",
  scope: "world",
  config: true,
  type: Boolean,
  default: true
});
}

/* -----------------------------
 Terrain Type Selection
----------------------------- */
function showTerrainTypeDialog() {
const terrainOptions = Object.entries(TERRAIN_TYPES).map(([key, data]) => {
  const selected = key === selectedTerrainType ? 'selected' : '';
  return `<option value="${key}" ${selected}>${data.label}</option>`;
}).join('');

const currentType = TERRAIN_TYPES[selectedTerrainType];

new Dialog({
  title: "Select Terrain Type",
  content: `
    <form>
      <div class="form-group">
        <label>Terrain Type:</label>
        <select id="terrain-type-select" style="width: 100%;">
          ${terrainOptions}
        </select>
      </div>
      <div class="form-group">
        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
          <strong>Current:</strong> ${currentType.label}<br>
          <em>${currentType.description}</em>
        </p>
      </div>
    </form>
  `,
  buttons: {
    select: {
      icon: '<i class="fas fa-check"></i>',
      label: "Select",
      callback: (html) => {
        const select = html.find("#terrain-type-select")[0];
        selectedTerrainType = select.value;
        const selected = TERRAIN_TYPES[selectedTerrainType];
        ui.notifications.info(`Selected terrain type: ${selected.label}`);
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancel"
    }
  },
  default: "select"
}).render(true);
}

/* -----------------------------
 Activate / Deactivate Tool
----------------------------- */
function toggleTerrainTool() {
terrainToolActive = !terrainToolActive;
const currentType = TERRAIN_TYPES[selectedTerrainType];
ui.notifications.info(`Terrain Tool ${terrainToolActive ? "Activated" : "Deactivated"} - Type: ${currentType.label}`);
}

/* -----------------------------
 Setup Canvas Interactions
----------------------------- */
let isRightClick = false;

function attachCanvasListeners() {
  try {
    const stage = canvas.stage;
    
    if (!stage) {
    console.error("Terrain Difficulty | Canvas stage not available");
      return;
    }
    
  // Only set up terrain drawing for GMs
  if (game.user.isGM) {
    // Make stage interactive
    stage.eventMode = 'static';
    stage.interactiveChildren = true;
    
    // Remove previous listeners if they exist
    stage.off("pointerdown", handlePointerDown);
    stage.off("pointermove", handlePointerMove);
    stage.off("pointerup", handlePointerUp);
    stage.off("pointerupoutside", handlePointerUp);
    stage.off("rightdown", handleRightDown);

    // Add PIXI event listeners
    stage.on("pointerdown", handlePointerDown);
    stage.on("pointermove", handlePointerMove);
    stage.on("pointerup", handlePointerUp);
    stage.on("pointerupoutside", handlePointerUp);
    stage.on("rightdown", handleRightDown);
    
    // Redraw terrain when scene loads (GM only)
    drawStoredTerrain();
  }
  } catch (error) {
  console.error("Terrain Difficulty | Error setting up canvas listeners:", error);
}
}

function setupCanvasListeners() {
Hooks.on("canvasReady", () => {
  attachCanvasListeners();
  // Clear undo stack when switching scenes
  undoStack = [];
});
}

/* -----------------------------
 Keyboard Listeners (Undo)
----------------------------- */
function setupKeyboardListeners() {
document.addEventListener("keydown", handleKeyDown);
}

function handleKeyDown(event) {
// Check for Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
  // Only undo if terrain tool is active and user is GM
  if (terrainToolActive && game.user.isGM) {
    event.preventDefault();
    undoLastTerrainChange();
  }
}
}

function undoLastTerrainChange() {
if (undoStack.length === 0) {
  ui.notifications.warn("Nothing to undo");
  return;
}

const scene = canvas.scene;
if (!scene) return;

// Pop the last state from the undo stack
const previousState = undoStack.pop();

// Clear all current highlights
for (const child of [...canvas.controls.children]) {
  if (child.terrainHighlight) child.destroy();
}

// Restore the previous terrain state
scene.setFlag("terrain-difficulty", "roughTerrain", previousState);

// Redraw the terrain
for (const cell of previousState) {
  // Support both old string format and new object format for backwards compatibility
  if (typeof cell === 'string') {
    const [x, y] = cell.split(",").map(Number);
    drawTerrainHighlight(x, y, "difficult");
  } else {
    drawTerrainHighlight(cell.x, cell.y, cell.type);
  }
}

ui.notifications.info("Terrain change undone");
}

/* -----------------------------
 Combat Tracking
----------------------------- */
const combatMovementTracker = new Map(); // Store remaining movement per token

function setupCombatTracking() {
// Initialize movement for all combatants when combat starts
Hooks.on("combatStart", (combat, updateData) => {
  console.log("Terrain Difficulty | Combat started, initializing movement for all combatants");
  initializeAllCombatantMovement(combat);
});

// Also initialize when combat round updates (in case combat was already running)
Hooks.on("combatRound", (combat, updateData, updateOptions) => {
  console.log("Terrain Difficulty | Combat round changed");
  // Make sure all combatants have movement data
  for (const combatant of combat.combatants) {
    if (combatant.token && !combatMovementTracker.has(combatant.token.id)) {
      const actor = combatant.token.actor;
      if (actor) {
        const speed = getTokenSpeed(actor);
        combatMovementTracker.set(combatant.token.id, {
          remaining: speed,
          total: speed,
          used: 0
        });
      }
    }
  }
});

// Reset movement at the start of each turn - multiple hooks for reliability
Hooks.on("combatTurn", (combat, updateData, updateOptions) => {
  console.log("Terrain Difficulty | combatTurn hook fired");
  resetCombatantMovement(combat);
});

// This fires when combat is updated (works on all clients)
Hooks.on("updateCombat", (combat, changed, options, userId) => {
  console.log("Terrain Difficulty | updateCombat hook fired, changed:", changed);
  
  // Check if turn or round changed
  if (changed.turn !== undefined || changed.round !== undefined) {
    console.log("Terrain Difficulty | Turn/Round changed, resetting movement");
    resetCombatantMovement(combat);
  }
});

// Clear movement tracking when combat ends
Hooks.on("deleteCombat", () => {
  console.log("Terrain Difficulty | Combat ended, clearing movement tracker");
  combatMovementTracker.clear();
});

// Add movement display to token HUD
Hooks.on("renderTokenHUD", (hud, html, data) => {
  const token = canvas.tokens.get(data._id);
  if (!token) return;
  
  const inCombat = game.combat?.started && game.combat.combatants.some(c => c.tokenId === token.id);
  if (!inCombat) return;
  
  const movementData = combatMovementTracker.get(token.id);
  if (!movementData) return;
  
  const percent = (movementData.remaining / movementData.total) * 100;
  const color = percent > 50 ? "#00ff00" : percent > 25 ? "#ffaa00" : "#ff0000";
  
  const movementDisplay = $(`
    <div class="terrain-movement-display" style="
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      border: 2px solid ${color};
      border-radius: 5px;
      padding: 4px 8px;
      color: white;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
    ">
      <i class="fas fa-running"></i> ${movementData.remaining}/${movementData.total}ft
    </div>
  `);
  
  html.append(movementDisplay);
});
}

function initializeAllCombatantMovement(combat) {
for (const combatant of combat.combatants) {
  if (!combatant.token) continue;
  
  const token = combatant.token;
  const actor = token.actor;
  
  if (actor) {
    const speed = getTokenSpeed(actor);
    combatMovementTracker.set(token.id, {
      remaining: speed,
      total: speed,
      used: 0
    });
    console.log(`Terrain Difficulty | Initialized movement for ${token.name}: ${speed}ft`);
  }
}
}

function resetCombatantMovement(combat) {
console.log("Terrain Difficulty | resetCombatantMovement called");
console.log("Terrain Difficulty | Current combatant:", combat.combatant?.name);

const resetSetting = game.settings.get("terrain-difficulty", "resetOnTurn");
console.log("Terrain Difficulty | Reset on turn setting:", resetSetting);

if (!resetSetting) {
  console.log("Terrain Difficulty | Reset disabled by setting");
  return;
}

const combatant = combat.combatant;
if (!combatant?.token) {
  console.log("Terrain Difficulty | No combatant or token found");
  return;
}

const token = combatant.token;
const actor = token.actor;

if (actor) {
  const speed = getTokenSpeed(actor);
  combatMovementTracker.set(token.id, {
    remaining: speed,
    total: speed,
    used: 0
  });
  
  console.log(`Terrain Difficulty | ✅ RESET movement for ${token.name}: ${speed}ft`);
  console.log("Terrain Difficulty | Movement tracker state:", combatMovementTracker.get(token.id));
  
  // Notify the token owner
  if (game.user.isGM || token.isOwner) {
    ui.notifications.info(`${token.name}'s turn - Movement: ${speed}ft available`);
  }
} else {
  console.log("Terrain Difficulty | No actor found for token");
}
}

function getTokenSpeed(actor) {
// Try to get speed from character data (works with dnd5e system)
if (actor.system?.attributes?.movement?.walk) {
  return actor.system.attributes.movement.walk;
}

// Default to 30ft if no speed data found
return 30;
}

function getRemainingMovement(tokenId) {
const data = combatMovementTracker.get(tokenId);
return data ? data.remaining : null;
}

function updateRemainingMovement(tokenId, cost) {
const data = combatMovementTracker.get(tokenId);
if (data) {
  data.used += cost;
  data.remaining = Math.max(0, data.total - data.used);
  combatMovementTracker.set(tokenId, data);
}
}

function resetSelectedTokenMovement() {
if (!game.user.isGM) {
  ui.notifications.error("Only the GM can reset token movement");
  return;
}

const controlled = canvas.tokens.controlled;
if (controlled.length === 0) {
  ui.notifications.warn("Please select at least one token");
  return;
}

let resetCount = 0;
for (const token of controlled) {
  const actor = token.actor;
  if (actor) {
    const speed = getTokenSpeed(actor);
    combatMovementTracker.set(token.id, {
      remaining: speed,
      total: speed,
      used: 0
    });
    resetCount++;
  }
}

if (resetCount > 0) {
  ui.notifications.info(`Reset movement for ${resetCount} token(s)`);
  // Force token HUD refresh if visible
  canvas.tokens.hud.render();
}
}

/* -----------------------------
 Movement Tracking & Penalties
----------------------------- */
const tokenMovementData = new Map(); // Store movement data per token

function setupMovementTracking() {
console.log("Terrain Difficulty | Setting up movement tracking");

// Hook into token movement updates
Hooks.on("preUpdateToken", (tokenDoc, change, options, userId) => {
  if (!change.x && !change.y) return; // Not a position change
  
  console.log("Terrain Difficulty | Token movement detected:", tokenDoc.name);
  
  // Check if tracking is enabled
  const trackingEnabled = game.settings.get("terrain-difficulty", "enableMovementTracking");
  console.log("Terrain Difficulty | Tracking enabled:", trackingEnabled);
  if (!trackingEnabled) return;
  
  // Check if we should only track in combat
  const combatOnly = game.settings.get("terrain-difficulty", "combatOnly");
  const inCombat = game.combat?.started && game.combat.combatants.some(c => c.tokenId === tokenDoc.id);
  console.log("Terrain Difficulty | Combat only:", combatOnly, "In combat:", inCombat);
  
  if (combatOnly && !inCombat) {
    console.log("Terrain Difficulty | Skipping - not in combat");
    return;
  }
  
  const token = tokenDoc.object;
  if (!token) return;
  
  // Get the scene's terrain data
  const terrain = canvas.scene?.getFlag("terrain-difficulty", "roughTerrain") || [];
  console.log("Terrain Difficulty | Terrain cells found:", terrain.length);
  
  // Calculate movement cost
  const oldPos = { x: tokenDoc.x, y: tokenDoc.y };
  const newPos = { x: change.x ?? tokenDoc.x, y: change.y ?? tokenDoc.y };
  
  const movementCost = calculateMovementCost(oldPos, newPos, terrain);
  console.log("Terrain Difficulty | Movement cost:", movementCost);
  
  // Check if movement enforcement is enabled
  const enforceMovement = game.settings.get("terrain-difficulty", "enforceMovement");
  console.log("Terrain Difficulty | Enforcement enabled:", enforceMovement);
  
  if (enforceMovement && inCombat) {
    let remaining = getRemainingMovement(tokenDoc.id);
    console.log("Terrain Difficulty | Remaining movement:", remaining);
    
    // If no movement data exists, initialize it now
    if (remaining === null) {
      const actor = tokenDoc.actor;
      if (actor) {
        const speed = getTokenSpeed(actor);
        combatMovementTracker.set(tokenDoc.id, {
          remaining: speed,
          total: speed,
          used: 0
        });
        remaining = speed;
        console.log(`Terrain Difficulty | Initialized movement on-demand for ${tokenDoc.name}: ${speed}ft`);
      }
    }
    
    if (remaining !== null && movementCost.totalCost > remaining) {
      // Prevent the movement
      console.log("Terrain Difficulty | BLOCKING MOVEMENT - insufficient movement");
      ui.notifications.error(
        `${tokenDoc.name} doesn't have enough movement! ` +
        `Required: ${movementCost.totalCost}ft, Available: ${remaining}ft`
      );
      
      // Return false to prevent the update
      options.terrainDifficultyBlocked = true;
      return false;
    }
  }
  
  // Store movement data for notification
  tokenMovementData.set(tokenDoc.id, movementCost);
});

// Show notification after token movement completes
Hooks.on("updateToken", (tokenDoc, change, options, userId) => {
  if (!change.x && !change.y) return;
  if (options.terrainDifficultyBlocked) return; // Movement was blocked
  
  const movementCost = tokenMovementData.get(tokenDoc.id);
  if (!movementCost) return;
  
  const trackingEnabled = game.settings.get("terrain-difficulty", "enableMovementTracking");
  if (!trackingEnabled) return;
  
  const gridDistance = canvas.grid.distance;
  const totalSquares = movementCost.normalSquares + movementCost.difficultSquares;
  const actualCost = movementCost.totalCost;
  const baseCost = totalSquares * gridDistance;
  const penalty = actualCost - baseCost;
  
  // Update combat movement tracker if in combat
  const combatOnly = game.settings.get("terrain-difficulty", "combatOnly");
  const inCombat = game.combat?.started && game.combat.combatants.some(c => c.tokenId === tokenDoc.id);
  
  if (inCombat) {
    updateRemainingMovement(tokenDoc.id, actualCost);
    const remaining = getRemainingMovement(tokenDoc.id);
    
    // Show notification with remaining movement if available
    if (remaining !== null) {
      const message = penalty > 0
        ? `${tokenDoc.name} moved ${actualCost}ft through terrain (${penalty}ft penalty). Remaining: ${remaining}ft`
        : `${tokenDoc.name} moved ${actualCost}ft. Remaining: ${remaining}ft`;
      
      ui.notifications.info(message);
    } else if (penalty > 0) {
      // Show notification even without movement tracking if there's a penalty
      ui.notifications.warn(
        `${tokenDoc.name} moved through ${movementCost.difficultSquares} difficult terrain square(s). ` +
        `Movement cost: ${actualCost}ft (${penalty}ft penalty)`
      );
    }
  } else if (!combatOnly) {
    // Show notification outside of combat if tracking is enabled
    if (penalty > 0) {
      ui.notifications.warn(
        `${tokenDoc.name} moved through ${movementCost.difficultSquares} difficult terrain square(s). ` +
        `Movement cost: ${actualCost}ft (${penalty}ft penalty)`
      );
    }
  }
  
  tokenMovementData.delete(tokenDoc.id);
});
}

function calculateMovementCost(oldPos, newPos, terrain) {
const gridSize = canvas.grid.size;
const gridDistance = canvas.grid.distance || 5; // Default to 5ft per square

// Get grid coordinates for start and end positions
const startGrid = {
  x: Math.floor(oldPos.x / gridSize),
  y: Math.floor(oldPos.y / gridSize)
};
const endGrid = {
  x: Math.floor(newPos.x / gridSize),
  y: Math.floor(newPos.y / gridSize)
};

// Get all grid squares along the path
const path = getGridPath(startGrid, endGrid);

let normalSquares = 0;
let difficultSquares = 0;
const terrainTypes = [];

// Check each square in the path for terrain
for (const gridPos of path) {
  const terrainCell = terrain.find(cell => {
    if (typeof cell === 'string') {
      const [x, y] = cell.split(",").map(Number);
      return x === gridPos.x && y === gridPos.y;
    }
    return cell.x === gridPos.x && cell.y === gridPos.y;
  });
  
  if (terrainCell) {
    difficultSquares++;
    const type = typeof terrainCell === 'string' ? 'difficult' : terrainCell.type;
    if (!terrainTypes.includes(type)) {
      terrainTypes.push(type);
    }
  } else {
    normalSquares++;
  }
}

// Calculate total movement cost (difficult terrain costs 2x movement)
const totalCost = (normalSquares * gridDistance) + (difficultSquares * gridDistance * 2);

return {
  normalSquares,
  difficultSquares,
  totalCost,
  terrainTypes
};
}

function getGridPath(start, end) {
const path = [];

// Use Bresenham's line algorithm to get grid squares along the path
const dx = Math.abs(end.x - start.x);
const dy = Math.abs(end.y - start.y);
const sx = start.x < end.x ? 1 : -1;
const sy = start.y < end.y ? 1 : -1;
let err = dx - dy;

let x = start.x;
let y = start.y;

while (true) {
  // Add current position (but not the starting square, as they're already there)
  if (x !== start.x || y !== start.y) {
    path.push({ x, y });
  }
  
  if (x === end.x && y === end.y) break;
  
  const e2 = 2 * err;
  if (e2 > -dy) {
    err -= dy;
    x += sx;
  }
  if (e2 < dx) {
    err += dx;
    y += sy;
  }
}

return path;
}

function handlePointerDown(event) {
if (!terrainToolActive || !game.user.isGM) return;

// Left click only for this handler
if (event.button !== 0) return;

isRightClick = false;
isDragging = true;

// Get position from PIXI event
const pos = event.data.getLocalPosition(canvas.stage);
dragStart = { x: pos.x, y: pos.y };
dragEnd = { x: pos.x, y: pos.y };
}

function handleRightDown(event) {
if (!terrainToolActive || !game.user.isGM) return;

isRightClick = true;
isDragging = true;

// Get position from PIXI event
const pos = event.data.getLocalPosition(canvas.stage);
dragStart = { x: pos.x, y: pos.y };
dragEnd = { x: pos.x, y: pos.y };

event.stopPropagation();
}

function handlePointerMove(event) {
if (!isDragging || !terrainToolActive || !game.user.isGM) return;

// Get position from PIXI event
const pos = event.data.getLocalPosition(canvas.stage);
dragEnd = { x: pos.x, y: pos.y };
drawDragPreview();
}

function handlePointerUp(event) {
if (!isDragging || !terrainToolActive || !game.user.isGM) return;

isDragging = false;
applyDragSelectionNew(isRightClick);
clearDragPreview();
isRightClick = false;
}


/* -----------------------------
 Draw Selection Preview
----------------------------- */
function drawDragPreview() {
// Only GMs can draw terrain
if (!game.user.isGM) return;
if (!canvas?.controls) return;

clearDragPreview();
if (!dragStart || !dragEnd) return;

try {
  const gridSize = canvas.grid.size;
  // Manually snap to grid for v12
  const start = {
    x: Math.floor(dragStart.x / gridSize) * gridSize,
    y: Math.floor(dragStart.y / gridSize) * gridSize
  };
  const end = {
    x: Math.floor(dragEnd.x / gridSize) * gridSize,
    y: Math.floor(dragEnd.y / gridSize) * gridSize
  };

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(start.x - end.x) + gridSize;
  const h = Math.abs(start.y - end.y) + gridSize;

  // Use the selected terrain type color for preview (or removal color)
  const typeData = isRightClick ? { color: 0xff0000, alpha: 0.15 } : TERRAIN_TYPES[selectedTerrainType];
  const color = typeData.color;
  const alpha = typeData.alpha * 0.6; // Slightly more transparent for preview

  previewRect = new PIXI.Graphics();
  // PIXI v8 API - draw, then fill, then stroke
  previewRect.beginFill(color, alpha);
  previewRect.lineStyle(2, color, 0.8);
  previewRect.drawRect(x, y, w, h);
  previewRect.endFill();
  previewRect.zIndex = 2000;
  canvas.controls.addChild(previewRect);
} catch (error) {
  console.error("Terrain Difficulty | Error drawing preview:", error);
}
}

function clearDragPreview() {
if (!game.user.isGM) return;
if (previewRect) {
  previewRect.destroy();
  previewRect = null;
}
}

/* -----------------------------
 Apply Terrain Selection
----------------------------- */
function applyDragSelectionNew(isRemove) {
if (!game.user.isGM) return;
const scene = canvas.scene;
if (!scene || !canvas?.controls) return;

// Save current state to undo stack before making changes
const currentTerrain = scene.getFlag("terrain-difficulty", "roughTerrain") || [];
// Deep copy the array and objects within it
undoStack.push(currentTerrain.map(cell => 
  typeof cell === 'string' ? cell : { ...cell }
));

// Limit the undo stack size
if (undoStack.length > MAX_UNDO_STEPS) {
  undoStack.shift(); // Remove the oldest entry
}

const gridSize = canvas.grid.size;
// Manually snap to grid for v12
const start = {
  x: Math.floor(dragStart.x / gridSize) * gridSize,
  y: Math.floor(dragStart.y / gridSize) * gridSize
};
const end = {
  x: Math.floor(dragEnd.x / gridSize) * gridSize,
  y: Math.floor(dragEnd.y / gridSize) * gridSize
};

const x1 = Math.min(start.x, end.x);
const x2 = Math.max(start.x, end.x);
const y1 = Math.min(start.y, end.y);
const y2 = Math.max(start.y, end.y);

let terrain = [...currentTerrain]; // Work with a copy

for (let x = x1; x <= x2; x += gridSize) {
  for (let y = y1; y <= y2; y += gridSize) {
    const gx = Math.floor(x / gridSize);
    const gy = Math.floor(y / gridSize);

    if (isRemove) {
      terrain = terrain.filter((t) => !(t.x === gx && t.y === gy));
      removeTerrainHighlight(gx, gy);
    } else {
      // Check if this cell already has terrain
      const existingIndex = terrain.findIndex((t) => t.x === gx && t.y === gy);
      if (existingIndex !== -1) {
        // Update existing terrain type
        terrain[existingIndex].type = selectedTerrainType;
        removeTerrainHighlight(gx, gy);
        drawTerrainHighlight(gx, gy, selectedTerrainType);
      } else {
        // Add new terrain
        terrain.push({ x: gx, y: gy, type: selectedTerrainType });
        drawTerrainHighlight(gx, gy, selectedTerrainType);
      }
    }
  }
}

scene.setFlag("terrain-difficulty", "roughTerrain", terrain);
}

/* -----------------------------
 Draw / Remove Highlights
----------------------------- */
function drawTerrainHighlight(gridX, gridY, terrainType = "difficult") {
// Only GMs can see terrain highlights
if (!game.user.isGM) return;
if (!canvas?.controls) return;

try {
const gridSize = canvas.grid.size;
const highlight = new PIXI.Graphics();
  
  // Get color and alpha from terrain type
  const typeData = TERRAIN_TYPES[terrainType] || TERRAIN_TYPES.difficult;
  const color = typeData.color;
  const alpha = typeData.alpha;
  
  // PIXI v8 API - draw, then fill, then stroke
  highlight.beginFill(color, alpha);
  highlight.lineStyle(2, color, 0.8);
  highlight.drawRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize);
  highlight.endFill();
  
highlight.name = `terrain-${gridX}-${gridY}`;
highlight.terrainHighlight = true;
  highlight.terrainType = terrainType;
highlight.zIndex = 100;
canvas.controls.addChild(highlight);
} catch (error) {
  // Silently fail if drawing cannot be created
  console.warn("Terrain Difficulty | Could not create terrain highlight:", error);
}
}

function removeTerrainHighlight(gridX, gridY) {
if (!game.user.isGM) return;
if (!canvas?.controls) return;

try {
const child = canvas.controls.children.find((c) => c.name === `terrain-${gridX}-${gridY}`);
if (child) {
  child.destroy();
  }
} catch (error) {
  console.warn("Terrain Difficulty | Could not remove terrain highlight:", error);
}
}

/* -----------------------------
 Clear / Redraw Terrain
----------------------------- */
function clearAllTerrain() {
if (!game.user.isGM) return;
const scene = canvas.scene;
if (!scene || !canvas?.controls) return;

try {
  // Save current state to undo stack before clearing
  const currentTerrain = scene.getFlag("terrain-difficulty", "roughTerrain") || [];
  if (currentTerrain.length > 0) {
    // Deep copy the array and objects within it
    undoStack.push(currentTerrain.map(cell => 
      typeof cell === 'string' ? cell : { ...cell }
    ));
    
    // Limit the undo stack size
    if (undoStack.length > MAX_UNDO_STEPS) {
      undoStack.shift();
    }
  }

scene.unsetFlag("terrain-difficulty", "roughTerrain");
for (const child of [...canvas.controls.children]) {
  if (child.terrainHighlight) child.destroy();
}
ui.notifications.info("All rough terrain cleared.");
} catch (error) {
  console.error("Terrain Difficulty | Error clearing terrain:", error);
  ui.notifications.error("Failed to clear terrain");
}
}

function drawStoredTerrain() {
if (!game.user.isGM) return;
const scene = canvas.scene;
if (!scene || !canvas?.controls) return;

try {
const terrain = scene.getFlag("terrain-difficulty", "roughTerrain") || [];
  for (const cell of terrain) {
    // Support both old string format and new object format for backwards compatibility
    if (typeof cell === 'string') {
      const [x, y] = cell.split(",").map(Number);
      drawTerrainHighlight(x, y, "difficult");
    } else {
      drawTerrainHighlight(cell.x, cell.y, cell.type);
    }
  }
} catch (error) {
  console.error("Terrain Difficulty | Error drawing stored terrain:", error);
}
}

