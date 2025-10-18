# Terrain Difficulty — v0.4.0

## Overview

**Terrain Difficulty** is a Foundry VTT v12 module designed for **D&D 5e** and **MidiQOL** users.  
It automatically calculates terrain difficulty, applies movement penalties, and provides real-time UI overlays that visualise the impact of difficult terrain as players move tokens.

This helps DMs and players see exactly how terrain affects movement — visually and mechanically — without manual calculations.

---

## 📦 Installation

### Manual Installation

1. Download the latest release:
   [terrain-difficulty_v0.4.0.zip](https://github.com/DCScripting/FoundryV12-modules/archive/refs/heads/main.zip)

2. Extract the archive to your Foundry modules folder:
<Foundry Data Folder>/Data/modules/terrain-difficulty/

The folder structure should look like this:
terrain-difficulty/
├── module.json
├── README.md
└── src/
└── module.js


3. Restart Foundry VTT.

4. In Foundry, go to:
Configuration > Manage Modules > Enable "Terrain Difficulty"

---

## ⚙️ Configuration

Once enabled, open **Game Settings → Configure Settings → Module Settings → Terrain Difficulty**.

You’ll find the following options:

| Setting | Description | Default |
|----------|--------------|----------|
| **Enable Terrain Overlays** | Displays tinted red overlays on tiles considered difficult terrain when a token path crosses them. | ✅ Enabled |
| **Enable Floating Labels** | Displays floating text labels (e.g. “+10 ft”) above terrain showing movement penalties. | ✅ Enabled |

These settings are **client-side**, allowing each user to toggle them individually.

---

## 🧭 How It Works

### Movement Detection
When a token moves or the ruler tool measures distance:
- The module checks whether the token’s path crosses **difficult terrain** tiles.
- Any movement penalty (e.g., half speed, +10 ft) is calculated and displayed.
- Visual overlays and floating labels appear to show affected areas.
- The total adjusted movement is displayed to the player or GM.

### Automatic Effects
When movement completes:
- The system applies a **temporary ActiveEffect** to the actor for **1 round**, reducing available movement speed.
- If **MidiQOL** is active, the effect integrates seamlessly with its action economy and condition tracking.

### Visuals
- Overlays: Red tinted tiles stay visible until the movement completes.
- Floating Labels: Display “+X ft” penalties above affected terrain.

---

## 🧩 Integration

| System | Functionality |
|---------|----------------|
| **D&D 5e** | Applies an ActiveEffect that temporarily reduces movement speed. |
| **MidiQOL** | Integrates with movement tracking and action costs automatically. |

Developers can access the latest penalty value programmatically:
```js
const penalty = game.modules.get("terrain-difficulty").api.getLastMovementPenalty(token);

🧰 Features Summary

🔄 Automatic terrain penalty calculation

🌄 Overlays & labels showing affected terrain

🕹️ Real-time updates while dragging tokens or using the ruler

🎯 Stays visible until movement completes

🧙 Automatic D&D5e speed reduction ActiveEffect

⚔️ MidiQOL-compatible integration

⚙️ Per-user visual toggle settings


🪛 Technical Notes

Built for Foundry VTT Core v12

Requires D&D5e system

Optional integration with MidiQOL

Module hooks:

dragRuler.MeasurementUpdated

updateToken


🧑‍💻 Credits

Author: Damien Cresswell.
Version: 0.4.0
Last Edit: 18 October 2025

🧩 Future Improvements

Planned features for v0.5.0:

Configurable penalty ratios per terrain type

Token-specific movement multipliers

Automatic identification of terrain via tile metadata

Support for Pathfinder 2e and other systems

🐞 Reporting Issues


If you encounter a bug or want to request features, please open an issue or submit feedback through your development environment or GitHub repository (when available).


