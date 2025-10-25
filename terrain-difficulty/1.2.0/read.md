# Terrain Difficulty — v1.2.0

## 📖 Overview

**Terrain Difficulty** is a comprehensive terrain and movement management module for **Foundry VTT v12** and the **D&D 5e system**. It provides an intuitive visual terrain painting system combined with automatic movement tracking and enforcement during combat.

### Key Features

🎨 **Visual Terrain Painting**
- Paint 8 different D&D 5e terrain types with unique colors
- Intuitive left-click to add, Shift+drag to remove
- Real-time preview while painting
- Undo/redo support (Ctrl+Z)

⚔️ **Combat Movement Tracking**
- Automatic movement cost calculation (difficult terrain = 2x movement)
- Real-time movement overlay above tokens during combat
- Color-coded visual feedback (green/orange/red)
- Movement enforcement - prevents exceeding available speed
- Per-turn movement reset

🎯 **Intelligent System**
- Tracks token paths through terrain
- Calculates exact movement costs including penalties
- Shows notifications for terrain penalties
- Works for all tokens (player and NPC)

---

## 📦 Prerequisites

### Required

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Foundry VTT** | v12+ | Module is built specifically for v12 |
| **D&D 5e System** | Latest | Required for character speed data |

### Optional

- No additional modules required
- Compatible with other combat and movement modules

---

## 💾 Installation

### Method 1: Manifest URL (Recommended)

1. Open Foundry VTT
2. Go to **Add-on Modules** tab
3. Click **Install Module**
4. Paste the manifest URL:
```
https://github.com/DCScripting/FoundryV12-modules/raw/main/terrain-difficulty/module.json
```
5. Click **Install**
6. Enable the module in your world

### Method 2: Manual Installation

1. Download the latest release: [terrain-difficulty_v1.2.0.zip](https://github.com/DCScripting/FoundryV12-modules/releases)
2. Extract to: `<Foundry Data>/Data/modules/terrain-difficulty/`
3. Restart Foundry VTT
4. Enable in: **Configuration → Manage Modules → Terrain Difficulty**

---

## 🎮 How to Use

### Painting Terrain

#### 1. Activate the Terrain Tool

1. Click the **Tiles** button (🧊) in the left toolbar
2. You'll see the terrain tools in the Tiles menu:
   - 🎨 **Select Terrain Type** - Choose which terrain to paint
   - 🏔️ **Mark Rough Terrain** - Activate the painting tool
   - 🗑️ **Clear All Rough Terrain** - Remove all terrain
   - 🔄 **Reset Selected Token Movement** - Manually reset movement (GM only)

#### 2. Select Terrain Type

Click **Select Terrain Type** and choose from 8 D&D 5e terrain types:

| Terrain Type | Color | Description |
|--------------|-------|-------------|
| **Difficult Terrain (General)** | Orange | Standard 2x movement cost |
| **Icy/Slippery** | Light Blue | May require Dexterity saves |
| **Muddy/Swampy** | Brown | May slow movement further |
| **Rocky/Rubble** | Gray | May provide cover |
| **Dense Foliage** | Green | May provide concealment |
| **Shallow Water** | Blue | May affect certain abilities |
| **Sand/Desert** | Gold | Difficult terrain in deep sand |
| **Snow/Ice** | White | May obscure tracks |

#### 3. Paint Terrain

1. Click **Mark Rough Terrain** to activate the tool
2. **Left-click and drag** to paint terrain
   - See a preview box while dragging
   - Release to apply terrain
3. **Shift + drag** to remove terrain
   - Preview turns red while Shift is held
   - Release to remove terrain
4. **Ctrl+Z** to undo the last change (up to 20 steps)

### Movement Tracking

#### During Combat

When combat is active, tokens automatically display a movement overlay:

```
┌────────────────┐
│ 🏃 25/30ft     │  ← Shows remaining/total movement
└────────────────┘
```

**Color Coding:**
- 🟢 **Green border** - More than 50% movement remaining
- 🟠 **Orange border** - 25-50% movement remaining  
- 🔴 **Red border** - Less than 25% movement remaining

**How It Works:**
1. **Combat starts** - All tokens get their full movement speed
2. **Token moves** - Movement cost is calculated and deducted
3. **Through terrain** - Difficult terrain costs 2x movement
4. **Turn ends** - Movement resets at start of next turn
5. **Enforcement** - Can't move if insufficient movement remaining

#### Outside Combat

Movement tracking can be configured to work outside combat or be combat-only (see Settings).

---

## ⚙️ Configuration

Access settings: **Game Settings → Configure Settings → Module Settings → Terrain Difficulty**

### Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Enable Movement Tracking** | ✅ On | Show notifications and track movement through terrain |
| **Enforce Movement Limits** | ✅ On | Prevent tokens from moving beyond available movement |
| **Track Movement in Combat Only** | ✅ On | Only track movement during combat encounters |
| **Reset Movement Each Turn** | ✅ On | Reset available movement at the start of each token's turn |

### Recommended Configurations

**Strict D&D 5e Rules:**
- ✅ Enable Movement Tracking
- ✅ Enforce Movement Limits
- ✅ Combat Only
- ✅ Reset Each Turn

**Relaxed / Exploration Mode:**
- ✅ Enable Movement Tracking
- ❌ Enforce Movement Limits
- ❌ Combat Only
- ✅ Reset Each Turn

**Disable Movement System:**
- ❌ Enable Movement Tracking
- (Terrain painting still works)

---

## 🔧 Features in Detail

### Terrain Painting System

- **8 Terrain Types** - Each with unique colors and D&D 5e descriptions
- **Grid Snapping** - Automatically aligns to scene grid
- **Intuitive Controls:**
  - Left-click drag = Add terrain
  - Shift + drag = Remove terrain
  - Right-click drag = Remove terrain (alternative)
- **Visual Preview** - See exactly what you're painting before applying
- **Undo/Redo** - Ctrl+Z to undo up to 20 changes
- **Persistent Data** - Terrain saved with scene
- **GM Only** - Only GMs can see and edit terrain

### Movement Tracking System

- **Automatic Detection** - Tracks all token movement
- **Path Calculation** - Uses Bresenham's algorithm to find path
- **Terrain Detection** - Checks each grid square in path
- **Cost Calculation:**
  - Normal terrain: 1 square = 5 feet (default grid distance)
  - Difficult terrain: 1 square = 10 feet (2x cost)
- **Real-Time Updates** - Movement overlay updates instantly
- **Combat Integration:**
  - Auto-initializes when combat starts
  - Resets movement each turn
  - Tracks remaining movement per token
- **Movement Enforcement:**
  - Blocks movement attempts that exceed available speed
  - Shows error message with required vs available movement
- **Character Speed Detection:**
  - Reads walk speed from character sheet
  - Defaults to 30ft if not found

### Visual Feedback

**For GMs:**
- ✅ Terrain highlights (colored overlays on grid)
- ✅ Movement overlays on all combatant tokens
- ✅ All notifications and messages

**For Players:**
- ❌ No terrain highlights (GM only)
- ✅ Movement overlays on their own tokens
- ✅ Movement notifications
- ✅ Enforcement messages

### Notifications

Movement notifications are minimal and efficient:

**In Combat:**
- Brief notification only when moving through terrain
- Example: `"Halan: 2 difficult terrain (+10ft cost)"`

**Outside Combat (if enabled):**
- Full notification with details
- Example: `"Halan moved through 2 difficult terrain square(s). Movement cost: 25ft (10ft penalty)"`

---

## 📊 Technical Details

### Compatibility

**Tested With:**
- Foundry VTT v12.x
- D&D 5e System (latest)
- Combat Tracker (built-in)

**Known Compatible Modules:**
- Simple Fog
- Sequencer Layer
- Most lighting and scene modules

**Potential Conflicts:**
- Other movement enforcement modules may conflict
- Token HUD modules may overlay the movement display

### Performance

- Lightweight - minimal impact on Foundry performance
- Efficient path calculation using Bresenham's algorithm
- Terrain data stored as scene flags (minimal storage)
- Movement overlay updates only when necessary

### Data Storage

**Scene Flags:**
```javascript
scene.flags["terrain-difficulty"]["roughTerrain"]
// Array of objects: [{ x: 10, y: 15, type: "difficult" }, ...]
```

**In-Memory Only:**
- Movement tracking data (resets when combat ends)
- Undo stack (clears when switching scenes)

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo last terrain change (when terrain tool active) |
| **Shift+Drag** | Remove terrain while painting |

---

## 🐛 Troubleshooting

### Movement overlay not showing

**Solution:**
1. Make sure combat is started
2. Verify token is in the combat tracker
3. Check if "Track Movement in Combat Only" is enabled
4. Hard refresh browser (Ctrl+Shift+R)

### Movement not resetting on turn change

**Solution:**
1. Check "Reset Movement Each Turn" is enabled in settings
2. Hard refresh all clients (GM and players)
3. Delete and restart combat

### Player sees permission errors

**Solution:**
1. This is normal - terrain drawing is GM-only
2. Players shouldn't see these if module is up to date
3. Hard refresh player's browser

### Terrain not visible for GM

**Solution:**
1. Make sure you're logged in as GM
2. Check if terrain was actually painted (click terrain tool)
3. Try clearing and repainting a test square

---

## 🔄 Updating

### From v0.x to v1.x

**Breaking Changes:**
- Old terrain data format automatically converted
- Settings have changed - reconfigure after update
- Movement system is completely new

**Steps:**
1. Backup your world
2. Update module via Foundry's module manager
3. Reconfigure settings as needed
4. Old terrain will be converted to "Difficult Terrain (General)"

---

## 🧑‍💻 Credits

**Author:** Damien Cresswell - Sistena Ltd.

**Version:** 1.2.0

**License:** MIT

**Last Updated:** 25 October 2025

### Special Thanks

- Foundry VTT community for API documentation
- D&D 5e system developers
- Beta testers and early adopters

---

## 🚀 Future Improvements

### Planned Features

- [ ] Configurable movement multipliers per terrain type (1.5x, 2x, 3x)
- [ ] Terrain affects other than movement (damage, saves, etc.)
- [ ] Import/export terrain templates
- [ ] Brush sizes for faster painting
- [ ] Terrain type presets by biome
- [ ] Dash action integration (double movement)
- [ ] Flying/swimming movement exceptions
- [ ] Pathfinder 2e system support

### Suggestions Welcome

Have an idea? Open an issue on GitHub!

---

## 📞 Support & Bug Reports

### Report Issues

**GitHub Issues:** [https://github.com/DCScripting/FoundryV12-modules/issues](https://github.com/DCScripting/FoundryV12-modules/issues)

When reporting bugs, please include:
1. Foundry VTT version
2. D&D 5e system version  
3. Module version
4. Console errors (F12 → Console tab)
5. Steps to reproduce
6. Screenshot if applicable

### Feature Requests

Use the same GitHub Issues link and label your request as "Enhancement"

---

## 📜 License

MIT License - See LICENSE file for details

Free to use, modify, and distribute with attribution.

---

## 📚 Changelog

### v1.2.0 (October 25, 2025)
- ➕ Added Shift+drag to remove terrain
- ➕ Improved terrain tool usability
- 📝 Updated tooltips and documentation

### v1.1.0 (October 25, 2025)
- ➕ Added real-time movement overlay above tokens
- ➕ Color-coded visual feedback (green/orange/red)
- ➕ Minimal notifications - reduced spam
- 🐛 Fixed notification ordering issues

### v1.0.0 (October 22, 2025)
- 🎉 Complete rewrite of module
- ➕ Visual terrain painting system
- ➕ 8 D&D 5e terrain types with colors
- ➕ Movement tracking and enforcement
- ➕ Combat tracker integration
- ➕ Configurable settings
- ➕ Undo/redo support
- ➕ GM tools for movement management

### v0.4.0 and earlier
- Legacy versions with different functionality
- Not compatible with v1.x

---

## 🎓 Tips & Best Practices

### For GMs

1. **Paint terrain before players arrive** - Keeps it secret until revealed
2. **Use different terrain types** - Makes combat more interesting
3. **Combine with lighting/fog** - Reveal terrain as players explore
4. **Test movement costs** - Move a token through terrain to verify
5. **Use Reset Movement tool** - For special cases (Dash, magic items, etc.)

### For Players

1. **Watch the movement overlay** - Plan your moves carefully
2. **Consider terrain** - Going around may be faster than through
3. **Communicate with party** - Coordinate movement in difficult terrain
4. **Use Dash action** - When you need extra movement
5. **Check character speed** - Module reads from character sheet

---

## ❓ FAQ

**Q: Can players see the terrain?**  
A: No, terrain highlights are GM-only. Players only see movement costs when they move through it.

**Q: Does this work with non-D&D 5e systems?**  
A: Not currently. The module reads character speed from D&D 5e character sheets. Support for other systems may come in future updates.

**Q: Can I customize the terrain colors?**  
A: Not yet, but this is planned for a future update.

**Q: Does this work with flying/swimming movement?**  
A: Not yet - the module currently only tracks ground movement. Flight/swim exceptions are planned for future updates.

**Q: Can I paint terrain mid-combat?**  
A: Yes! You can add or remove terrain at any time. Movement costs are calculated in real-time.

**Q: Will old terrain data be lost on update?**  
A: No, old terrain is automatically converted to the new format.

**Q: Can I disable just the movement tracking?**  
A: Yes! Turn off "Enable Movement Tracking" in settings. The terrain painting system will still work.

---

**Thank you for using Terrain Difficulty! Happy adventuring! 🗺️⚔️**
