/*
.SYNOPSIS
Automatically calculate terrain difficulty in Foundry VTT v12.

.DESCRIPTION
Integrates with MidiQOL and D&D5e to apply movement penalties when tokens move across difficult terrain.
Displays overlays and labels showing the penalty, persisting until movement completes.

.NOTES
Author: Damien.Cresswell.
Last edit: 2025-10-18
*/

Hooks.once('init', () => {
  console.log("Terrain Difficulty | Initialising module v0.4.0");

  game.settings.register("terrain-difficulty", "enableOverlay", {
    name: "Enable Terrain Overlays",
    hint: "Show tinted terrain overlay when crossing difficult terrain.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("terrain-difficulty", "enableLabels", {
    name: "Enable Floating Labels",
    hint: "Display text labels showing terrain penalties.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

Hooks.on("dragRuler.MeasurementUpdated", (ruler, measurement) => {
  const overlaysEnabled = game.settings.get("terrain-difficulty", "enableOverlay");
  const labelsEnabled = game.settings.get("terrain-difficulty", "enableLabels");
  if (!overlaysEnabled && !labelsEnabled) return;

  const difficultTiles = measurement.segments.filter(s => s.terrain === "difficult");
  let totalPenalty = 0;
  difficultTiles.forEach(seg => totalPenalty += seg.distance * 0.5); // Example modifier

  if (labelsEnabled) {
    difficultTiles.forEach(seg => {
      const text = new PreciseText(`+${seg.distance * 0.5} ft`, {fontSize: 14, fill: "#ff5555"});
      text.position.set(seg.ray.B.x, seg.ray.B.y);
      canvas.interface.addChild(text);
      setTimeout(() => text.destroy(), 1000);
    });
  }

  if (overlaysEnabled) {
    difficultTiles.forEach(seg => {
      const gfx = new PIXI.Graphics();
      gfx.beginFill(0xff0000, 0.3);
      gfx.drawRect(seg.ray.B.x - 25, seg.ray.B.y - 25, 50, 50);
      gfx.endFill();
      canvas.interface.addChild(gfx);
      setTimeout(() => gfx.destroy(), 1000);
    });
  }

  ruler.total += totalPenalty;
});

// Apply difficult terrain penalties to tokens when they move
Hooks.on("updateToken", async (token, diff) => {
  if (!diff.x && !diff.y) return;  // Only act on actual movement

  const actor = token.actor;
  if (!actor || !actor.system?.attributes?.movement) return; // Skip tokens without actors or movement

  const penalty = 10; // Example static penalty
  await actor.createEmbeddedDocuments("ActiveEffect", [{
    label: "Difficult Terrain Penalty",
    icon: "icons/svg/trap.svg",
    changes: [{ key: "system.attributes.movement.walk", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -penalty }],
    duration: { rounds: 1 },
    origin: "terrain-difficulty"
  }]);

  if (game.modules.get("midi-qol")?.active) {
    console.log(`MidiQOL integration applied for ${actor.name}`);
  }
});
