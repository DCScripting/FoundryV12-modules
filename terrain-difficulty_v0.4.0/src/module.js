/**
 * .SYNOPSIS
 * Terrain Difficulty module for Foundry VTT 12
 *
 * .DESCRIPTION
 * Automatically calculates terrain difficulty for D&D5e systems using MidiQOL.
 * Applies movement penalties to actors and optionally applies Midi-QOL effects.
 * Also displays visual overlays of terrain difficulty.
 *
 * .NOTES
 * Author: Damien.Cresswell - Sistena Ltd.
 * Last edit: 18/10/2025
 */

Hooks.once("init", async function() {
  console.log("Terrain Difficulty | Initialising module...");

  // Module settings
  game.settings.register("terrain-difficulty", "showOverlay", {
    name: "Show Terrain Overlay",
    hint: "Display a visual overlay of terrain difficulty on the canvas.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register("terrain-difficulty", "applyMidiEffects", {
    name: "Apply Midi-QOL Effects",
    hint: "Apply effects like slowed movement automatically via Midi-QOL when moving through difficult terrain.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
});

Hooks.on("updateToken", async (token, diff) => {
  // Only process if token actually moved
  if (!diff.x && !diff.y) return;

  const actor = token.actor;
  if (!actor) return; // Skip tokens without actors
  if (!actor.system?.attributes?.movement) return;

  try {
    const terrainData = getTerrainDifficultyAt(token.x, token.y);
    if (!terrainData) return;

    const baseSpeed = actor.system.attributes.movement.walk || 30;
    const modifiedSpeed = Math.max(baseSpeed - terrainData.penalty, 0);

    // Update actor speed temporarily
    await actor.update({"system.attributes.movement.walk": modifiedSpeed});

    // Apply Midi-QOL effects if enabled
    if (game.settings.get("terrain-difficulty", "applyMidiEffects") && game.modules.get("midi-qol")?.active) {
      applyMidiQOLEffects(actor, terrainData);
    }

    // Draw overlay if enabled
    if (game.settings.get("terrain-difficulty", "showOverlay")) {
      drawTerrainOverlay(token, terrainData);
    }

  } catch (err) {
    console.error(`Terrain Difficulty | Error processing token ${token.name}:`, err);
  }
});

/**
 * Returns terrain difficulty data at a given canvas position.
 * Replace this with your tile/wall/scene logic.
 */
function getTerrainDifficultyAt(x, y) {
  // Example: simple random penalty for demonstration
  return {
    penalty: Math.floor(Math.random() * 10), // Movement penalty
    effect: "Slowed" // Optional Midi-QOL effect label
  };
}

/**
 * Apply Midi-QOL effects such as movement reduction or disadvantage.
 */
function applyMidiQOLEffects(actor, terrainData) {
  // Check if the actor already has the effect
  const existingEffect = actor.effects.find(e => e.data.label === terrainData.effect);
  if (existingEffect) return;

  // Create temporary effect
  const effectData = {
    label: terrainData.effect,
    icon: "icons/svg/trap.svg", // Example icon
    origin: "Terrain Difficulty",
    disabled: false,
    duration: { rounds: 1 },
    changes: [
      {
        key: "data.attributes.movement.walk",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        value: 1 - (terrainData.penalty / (actor.system.attributes.movement.walk || 30)),
        priority: 20
      }
    ]
  };

  actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * Draw a simple overlay on the canvas for terrain difficulty.
 */
function drawTerrainOverlay(token, terrainData) {
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0xff0000, 0.3);
  overlay.drawRect(token.x, token.y, canvas.grid.size, canvas.grid.size);
  overlay.endFill();
  canvas.foreground.addChild(overlay);

  // Remove overlay after short delay to prevent clutter
  setTimeout(() => overlay.destroy(), 2000);
}
