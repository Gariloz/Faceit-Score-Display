# Faceit Score Display

**Faceit Score Display** is a userscript for Tampermonkey/Greasemonkey that displays match scores from FACEIT in a separate popup window with customizable font size, sound notifications, and auto-reload functionality.

## Main Features

* Display live match scores in a separate popup window
* Match time display alongside score
* Customizable font size for score display
* Instant sound notifications when score changes
* Auto-reload page functionality with configurable intervals
* Settings persistence across browser sessions
* Works on all FACEIT pages (*.faceit.com) including Supermatches
* Multi-tab support with intelligent tab prioritization
* Aggressive monitoring of inactive tabs
* Comprehensive configuration system
* No caching - always shows real-time data

## Installation

### Option 1: Without Extension (Quick Start)

1. Open any FACEIT match page (`/match/` or `/room/`)
2. Open browser console (`F12` or `Ctrl+Shift+J` / `Cmd+Option+J` on Mac)
3. Open `Faceit-Score-Display.user.js` file and copy all code
4. **IMPORTANT**: Delete the first 9 lines (metadata starting with `// ==UserScript==` and ending with `// ==/UserScript==`)
5. Paste the remaining code (starting from line 11 with `(function() {`) into console and press `Enter`
6. Click the green "Показать счет" button to open the score popup

⚠️ **Note**: Script stops after page reload. You'll need to run it again.

### Option 2: With Tampermonkey/Greasemonkey (Recommended)

1. Install Tampermonkey or Greasemonkey browser extension
2. Download the `Faceit-Score-Display.user.js` file
3. Click on the userscript file to install it in Tampermonkey
4. Navigate to any FACEIT match page
5. Click the "Показать счет" button that appears in the top-right corner

✅ **Advantage**: Script works automatically on every page load.

## Usage

* Click the green "Показать счет" button to open the score popup
* Click the eye icon (👁️) on the button to hide it - a small eye icon will appear in its place
* Click the small eye icon to show the button again
* Adjust font size using the number input in the popup
* Toggle sound notifications with the checkbox
* Enable auto-reload and set interval in seconds
* The popup will automatically update with live scores and match time
* Script activates only when popup is opened (saves system resources)
* After page reload, script automatically recovers if popup is still open

## Changes in Version

* **Complete configuration centralization** - All settings easily customizable
* **No caching system** - Always shows real-time data, no stored values
* **Multi-tab support** - Intelligent tab prioritization system
* **Aggressive inactive tab monitoring** - Keeps inactive tabs updating
* **Match page load delay** - Prevents freezing when navigating to matches
* **Comprehensive unit labeling** - All settings clearly marked with units (ms, px, seconds)
* **Enhanced error handling** - Better recovery from various error states
* **Optimized performance** - Reduced CPU usage and memory consumption
* **Real-time data only** - No stale data display, always current information
* **Improved tab switching** - Smooth transitions between multiple tabs
* **Better popup management** - Enhanced popup lifecycle handling

## GitHub

https://github.com/Gariloz/Faceit-Score-Display

---

**Author:** Gariloz