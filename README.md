![Windows XP Portfolio Demo](<assets/boot screen/ScreenRecording2026-02-23at2.05.12AMonline-video-cutter.com-ezgif.com-video-to-gif-converter.gif>)

This repository is a frontend-only personal portfolio implemented as a Windows XP-style desktop environment in the browser.

## Project Scope

The project reproduces a full interactive desktop shell experience, including boot and login flow, desktop interaction patterns, window management behavior, system audio events, taskbar/start menu UX, and multiple XP-inspired applications. It is built as a static website with no backend services.

## Implemented Features

- Session lifecycle: boot animation, welcome/login flow, desktop launch, shutdown flow, restart flow.
- Desktop interaction model: icon selection, drag and drop, snap-to-grid placement, rectangle drag selection, keyboard shortcuts.
- Window manager: open/focus stacking, drag, minimize, maximize/restore, close, taskbar integration, active/inactive window states.
- XP UI shell: classic taskbar styling, start button/menu behavior, system tray clock, context menus, right-click desktop menu.
- System sound design: startup, shutdown, click, notification, error, stop, and window action sounds.
- Personalization: Luna Blue theme path, wallpaper switching, persistent desktop preference state.
- Desktop app routing: direct external redirects for selected shortcuts and in-window apps for desktop utilities.

## Applications Included

- Notepad: editable text area with classic menu interactions (`new`, `save`, `select all`, `time/date`, `word wrap`).
- Paint: drawing canvas, tool tray, brush sizing, color palette, clear/new canvas, PNG export.
- My Computer: Explorer-style layout with system tasks, drive groups, and quick folder links.
- My Documents: structured folder explorer UI with list/details view and navigation interactions.
- Internet Explorer: in-window browser frame with XP-style menubar/toolbar/address row.
- Spotify: in-window media player UI with search, queue controls, seek/progress, and volume control.
- Media Player Classic: embedded video playback window with classic wrapper styling.
- Control Panel: appearance, wallpaper, and sound controls with desktop utility actions.
- Command Prompt: mock shell commands for portfolio navigation and shortcuts.
- Recycle Bin: delete/restore behavior for desktop items.

## Architecture

- `index.html`: shell structure for boot, login, desktop, start menu, taskbar, and application host.
- `js/sessionManager.js`: lifecycle orchestration between boot, login, desktop, and shutdown states.
- `js/windowManager.js`: core runtime for windows, desktop icon behavior, and app initialization.
- `js/appsRegistry.js`: app metadata, desktop shortcut registry, and application HTML templates.
- `js/taskbarController.js`: taskbar button behavior and start menu control logic.
- `js/contextMenu.js`: desktop and shell context menu rendering/behavior.
- `js/clock.js`: taskbar clock rendering and popup behavior.
- `js/soundManager.js`: event sound registry, playback control, and volume management.
- `js/personalization.js`: wallpaper/theme configuration and persistence.
- `css/desktop.css`, `css/windows.css`, `css/taskbar.css`, `css/startmenu.css`: XP-specific visual system.

## Running Locally

Run through a local web server (do not open with `file://`).

```bash
cd /Users/vedang/Desktop/personal-website
python3 -m http.server 5500
```

Open `http://localhost:5500`.

Alternative:

```bash
cd /Users/vedang/Desktop/personal-website
npx serve .
```

## Configuration Points

- Profile content, app definitions, redirects: `js/appsRegistry.js`
- Wallpaper/theme options: `js/personalization.js`
- Sound assets and mappings: `js/soundManager.js`, `assets/sounds/`
- Start menu and shell wiring: `index.html`, `js/taskbarController.js`

## Constraints

- This is a browser simulation and not an operating system emulator.
- Embedded third-party media depends on external platform availability and embed policies.
