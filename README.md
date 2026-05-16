# User Agent Extension

A Chrome/Chromium browser extension (Manifest V3) that allows you to spoof or modify the browser's User-Agent string for testing how websites respond to different user agents.

## Features

- Override the User-Agent header on requests
- Popup UI for selecting or entering a custom User-Agent string
- Persists settings across browser sessions

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this directory

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Extension manifest (MV3) |
| `background.js` | Service worker / request interception |
| `popup.html` / `popup.js` | Popup UI |
| `popup.css` | Popup styles |
| `images/` | Extension icons |
