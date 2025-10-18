Terrain Difficulty — v0.4.0
Overview

Terrain Difficulty is a Foundry VTT v12 module for D&D 5e and MidiQOL users.
It automatically calculates terrain difficulty, applies movement penalties, and provides real-time UI overlays and floating labels showing the impact of difficult terrain as tokens move.

📦 Installation
Manual Installation

Download the latest release:
terrain-difficulty_v0.4.0.zip

Or use the manifest URL:
https://github.com/DCScripting/FoundryV12-modules/blob/main/terrain-difficulty_v0.4.0/module.json

Extract the archive to <Foundry Data Folder>/Data/modules/terrain-difficulty/

Restart Foundry VTT

Enable the module:
Configuration → Manage Modules → Enable "Terrain Difficulty"

⚙️ Configuration

Open Game Settings → Configure Settings → Module Settings → Terrain Difficulty.

Setting	Description	Default
Enable Terrain Overlays	Semi-transparent red overlays on terrain tiles with movement penalties.	✅ Enabled
Apply Midi-QOL Effects	Applies temporary ActiveEffects for speed reduction.	✅ Enabled
Enable Floating Labels	Shows floating text above tokens displaying movement penalties.	✅ Enabled

Floating labels are client-side, so each user can toggle them independently.

🧭 How It Works
Movement Detection

Detects when a token moves onto a tile with terrainDifficulty and optional terrainEffect flags.

Only the highest-penalty tile under the token is applied.

Automatic Effects

Temporary ActiveEffect reduces movement speed for 1 round.

MidiQOL integration applies effects seamlessly.

Effects are automatically removed when leaving the tile.

Visuals

Overlays: Red tinted tiles indicate difficult terrain.

Floating labels: Show “-X ft” above tokens; float upwards and fade out over 1.5 seconds.

🧩 Integration
System	Functionality
D&D 5e	Applies temporary movement reduction.
MidiQOL	ActiveEffects integrate with action economy.

Developer API (optional in future):
const penalty = game.modules.get("terrain-difficulty")?.api?.getLastMovementPenalty(token);

🧰 Features Summary

🔄 Automatic terrain penalty calculation

🌄 Overlays on affected terrain tiles

🕹️ Real-time updates on token movement

🎯 Automatic removal of ActiveEffects when leaving terrain

🧙 Temporary D&D5e speed reduction

⚔️ MidiQOL-compatible integration

✨ Floating labels above tokens showing penalties

⚙️ Per-user visual toggle settings

🪛 Technical Notes

Built for Foundry VTT v12

Requires D&D5e system

Optional MidiQOL integration

Module hooks used:

updateToken

Planned hooks for future improvements: dragRuler.MeasurementUpdated

🧑‍💻 Credits

Author: Damien Cresswell

Version: 0.4.0

Last Edit: 18 October 2025

🧩 Future Improvements

Configurable penalty ratios per terrain type

Token-specific movement multipliers

Automatic identification of terrain via tile metadata

Support for Pathfinder 2e and other systems

🐞 Reporting Issues

Report bugs or request features via:
https://github.com/DCScripting/FoundryV12-modules/issues

✅ All implemented features in v0.4.0:

Terrain penalty calculation (highest-penalty tile)

Overlay visualization

Midi-QOL integration

Automatic ActiveEffect creation/removal

Floating labels above tokens

Per-user toggle settings
