/**
 * .SYNOPSIS
 * Terrain Difficulty module for Foundry VTT 12
 *
 * .DESCRIPTION
 * Calculates terrain difficulty from scene tiles, applies movement penalties,
 * dynamically applies/removes Midi-QOL effects, and displays floating labels.
 *
 * .NOTES
 * Author: Damien.Cresswell.
 * Last edit: 18/10/2025
 */

Hooks.once("init", async function() {
  console.log("Terrain Difficulty | Initialising module...");

  // Module settings
  game.settings.register("terrain-difficulty", "showOverlay", {
    name: "Enable Terrain Overlays",
    hint: "Displays tinted overlays on tiles considered difficult terrain.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register("terrain-difficulty", "applyMidiEffects", {
    name: "Apply Midi-QOL Effects",
    hint: "Applies ActiveEffects for speed reduction automatically.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register("terrain-difficulty", "showFloatingLabels", {
    name: "Enable Floating Labels",
    hint: "Displays floating text labels above tokens showing movement penalties.",
    scope: "client",
    config: true,
    default: true,
    type: Boolean
  });
});

const tokenLastTerrain = new Map();

Hooks.on("updateToken", async (token, diff) => {
  if (!diff.x && !diff.y) return;

  const actor = token.actor;
  if (!actor) return;
  if (!actor.system?.attributes?.movement) return;

  try {
    const terrainData = getTerrainDifficultyAt(token.x, token.y);
    const lastData = tokenLastTerrain.get(token.id) || null;

    // Remove previous effect if leaving a tile
    if (lastData && (!terrainData || lastData.effect !== terrainData.effect)) {
      removeTerrainEffect(actor, lastData.effect);
    }

    tokenLastTerrain.set(token.id, terrainData || null);

    if (!terrainData) return;

    const baseSpeed = actor.system.attributes.movement.walk || 30;
    const modifiedSpeed = Math.max(baseSpeed - terrainData.penalty, 0);
    await actor.update({ "system.attributes.movement.walk": modifiedSpeed });

    if (game.settings.get("terrain-difficulty", "applyMidiEffects") && game.modules.get("midi-qol")?.active) {
      applyTerrainEffect(actor, terrainData);
    }

    if (game.settings.get("terrain-difficulty", "showOverlay")) {
      drawTerrainOverlay(token, terrainData);
    }

    if (game.settings.get("terrain-difficulty", "showFloatingLabels")) {
      drawFloatingLabel(token, terrainData);
    }

  } catch (err) {
    console.error(`Terrain Difficulty | Error processing token ${token.name}:`, err);
  }
});

/**
 * Get terrain data at token position (highest-penalty tile only)
 */
function getTerrainDifficultyAt(x, y) {
  if (!canvas.scene) return null;

  const gridSize = canvas.grid.size;
  const tileX = Math.floor(x / gridSize) * gridSize;
  const tileY = Math.floor(y / gridSize) * gridSize;

  const tilesHere = canvas.tiles.placeables.filter(tile => {
    const withinX = tile.x <= tileX && (tile.x + tile.width) > tileX;
    const withinY = tile.y <= tileY && (tile.y + tile.height) > tileY;
    return withinX && withinY;
  });

  if (!tilesHere.length) return null;

  let penalty = 0;
  let effect = "Slowed";

  for (const tile of tilesHere) {
    const tilePenalty = tile.getFlag("terrain-difficulty", "terrainDifficulty") || 0;
    const tileEffect = tile.getFlag("terrain-difficulty", "terrainEffect") || "Slowed";
    if (tilePenalty > penalty) {
      penalty = tilePenalty;
      effect = tileEffect;
    }
  }

  return { penalty, effect };
}

/**
 * Apply terrain Midi-QOL effect to actor
 */
async function applyTerrainEffect(actor, terrainData) {
  const existing = actor.effects.find(e => e.data.label === terrainData.effect);
  if (existing) return;

  const effectData = {
    label: terrainData.effect,
    icon: "icons/svg/trap.svg",
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

  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

/**
 * Remove a terrain Midi-QOL effect from actor
 */
async function removeTerrainEffect(actor, effectLabel) {
  const effect = actor.effects.find(e => e.data.label === effectLabel);
  if (effect) await effect.delete();
}

/**
 * Draw a temporary overlay for terrain
 */
function drawTerrainOverlay(token, terrainData) {
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0xff0000, 0.3);
  overlay.drawRect(token.x, token.y, canvas.grid.size, canvas.grid.size);
  overlay.endFill();
  canvas.foreground.addChild(overlay);

  setTimeout(() => overlay.destroy(), 2000);
}

/**
 * Draw floating text label above token showing movement penalty
 */
function drawFloatingLabel(token, terrainData) {
  const label = new PIXI.Text(`-${terrainData.penalty} ft`, {
    fontFamily: "Arial",
    fontSize: 20,
    fill: 0xff0000,
    stroke: 0x000000,
    strokeThickness: 3
  });

  label.anchor.set(0.5, 1);
  label.x = token.x + canvas.grid.size / 2;
  label.y = token.y;

  canvas.foreground.addChild(label);

  // Animate floating upwards and fade out
  const duration = 1500; // milliseconds
  const startTime = Date.now();

  const ticker = PIXI.Ticker.shared;
  const update = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      label.destroy();
      ticker.remove(update);
      return;
    }

    label.y = token.y - 20 * progress;
    label.alpha = 1 - progress;
  };

  ticker.add(update);
}
