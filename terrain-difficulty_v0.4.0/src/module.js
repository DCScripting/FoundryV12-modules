/**
 * .SYNOPSIS
 * Terrain Difficulty module for Foundry VTT 12
 *
 * .DESCRIPTION
 * Automatically calculates terrain difficulty for D&D5e systems using MidiQOL.
 * Applies movement penalties to actors and displays optional UI overlays.
 *
 * .NOTES
 * Author: Damien.Cresswell.
 * Last edit: 18/10/2025
 */

Hooks.once("init", async function() {
  console.log("Terrain Difficulty | Initialising module...");

  // Optional: register settings here
  game.settings.register("terrain-difficulty", "showOverlay", {
    name: "Show Terrain Overlay",
    hint: "Display a visual overlay of terrain difficulty on the canvas.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
});

Hooks.on("updateToken", async (token, diff) => {
  // Skip if no movement change
  if (!diff.x && !diff.y) return;

  const actor = token.actor;
  if (!actor) return;  // Skip tokens without actors

  // Ensure the actor has movement data
  if (!actor.system?.attributes?.movement) return;

  try {
    const terrainData = getTerrainDifficultyAt(token.x, token.y);
    if (!terrainData) return;

    const baseSpeed = actor.system.attributes.movement.walk || 30;
    const modifiedSpeed = baseSpeed - terrainData.penalty;

    // Update token actor movement temporarily
    await actor.update({"system.attributes.movement.walk": modifiedSpeed});

    if (game.settings.get("terrain-difficulty", "showOverlay")) {
      drawTerrainOverlay(token, terrainData);
    }

  } catch (err) {
    console.error(`Terrain Difficulty | Error processing token ${token.name}:`, err);
  }
});

/**
 * Returns terrain difficulty data at a given canvas position.
 * Placeholder function: replace with your own logic / tile lookup.
 */
function getTerrainDifficultyAt(x, y) {
  // Example: simple mock terrain
  // In practice, check canvas.scene.tiles, walls, or grid regions
  return {
    penalty: Math.floor(Math.random() * 10)  // Example penalty
  };
}

/**
 * Draw a simple overlay on the canvas for terrain difficulty.
 */
function drawTerrainOverlay(token, terrainData) {
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0xff0000, 0.3);  // semi-transparent red
  overlay.drawRect(token.x, token.y, canvas.grid.size, canvas.grid.size);
  overlay.endFill();
  canvas.foreground.addChild(overlay);

  // Remove overlay after a short delay to prevent clutter
  setTimeout(() => overlay.destroy(), 2000);
}
