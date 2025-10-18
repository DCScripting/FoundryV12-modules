Terrain Difficulty — v0.4.0
Overview

Terrain Difficulty is a Foundry VTT v12 module designed for D&D 5e and MidiQOL users.
It automatically calculates terrain difficulty, applies movement penalties, and provides real-time UI overlays that visualise the impact of difficult terrain as players move tokens.

This helps DMs and players see exactly how terrain affects movement — visually and mechanically — without manual calculations.

📦 Installation
Manual Installation

Download the latest release:
terrain-difficulty_v0.4.0.zip

Or use the manifest URL in the “Install Module” section of Foundry VTT:
https://github.com/DCScripting/FoundryV12-modules/blob/main/terrain-difficulty_v0.4.0/module.json

Extract the archive to your Foundry modules folder:
<Foundry Data Folder>/Data/modules/terrain-difficulty/

The folder structure should look like this:

terrain-difficulty/
├── module.json
├── README.md
└── src/
    └── module.js


Restart Foundry VTT.

In Foundry, go to:
Configuration → Manage Modules → Enable "Terrain Difficulty"

⚙️ Configuration

Once enabled, open Game Settings → Configure Settings → Module Settings → Terrain Difficulty.

You’ll find the following options:

Setting	Description	Default
Enable Terrain Overlays	Displays semi-transparent red overlays on tiles with terrain penalties when a token moves over them.	✅ Enabled
Apply Midi-QOL Effects	Applies temporary ActiveEffects for speed reduction when moving across difficult terrain.	✅ Enabled

Note: Floating labels (“+X ft”) are not implemented in v0.4.0.

🧭 How It Works
Movement Detection

When a token moves:

The module checks whether the token is on a difficult terrain tile (determined via tile flags: terrainDifficulty and optional terrainEffect).

Only the highest-penalty tile under the token is applied.

Visual overlays appear to show affected terrain.

The total adjusted movement is applied to the actor for the current movement.

Automatic Effects

A temporary ActiveEffect is applied to the actor for 1 round, reducing movement speed.

If MidiQOL is active, the effect integrates seamlessly with its action economy and condition tracking.

Effects are automatically removed once the token leaves the tile.

Visuals

Overlays: Semi-transparent red tint applied to the affected grid square.

Floating labels are planned for future versions; not implemented in v0.4.0.

🧩 Integration
System	Functionality
D&D 5e	Applies an ActiveEffect that temporarily reduces movement speed.
MidiQOL	Integrates with movement tracking and action costs automatically.

Developers can access the last terrain penalty programmatically:

const penalty = game.modules.get("terrain-difficulty")?.api?.getLastMovementPenalty(token);


Note: getLastMovementPenalty() is a placeholder API call. It can be implemented in future updates if a module-level API is exposed.

🧰 Features Summary

🔄 Automatic terrain penalty calculation

🌄 Overlays showing affected terrain

🕹️ Real-time updates while dragging tokens

🎯 Automatic removal of effects when leaving terrain

🧙 Automatic D&D5e speed reduction ActiveEffect

⚔️ MidiQOL-compatible integration

⚙️ Per-user visual toggle settings

Not implemented in v0.4.0:

Floating labels for penalties

Cumulative/stacked terrain penalties (only highest-penalty tile applied)

🪛 Technical Notes

Built for Foundry VTT Core v12

Requires D&D5e system

Optional integration with MidiQOL

Module hooks used:

updateToken

Planned hooks for future versions:

dragRuler.MeasurementUpdated (for showing overlays while measuring movement)

🧑‍💻 Credits

Author: Damien Cresswell

Version: 0.4.0

Last Edit: 18 October 2025

🧩 Future Improvements (v0.5.0+)

Configurable penalty ratios per terrain type

Token-specific movement multipliers

Floating labels showing penalty amounts

Automatic identification of terrain via tile metadata

Support for Pathfinder 2e and other systems

🐞 Reporting Issues

If you encounter a bug or want to request features, please open an issue on the GitHub repository:
https://github.com/DCScripting/FoundryV12-modules/issues
