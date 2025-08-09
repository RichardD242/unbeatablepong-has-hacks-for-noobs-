# Unbeatable Pong

A fast, polished browser Pong with upgrades and optional “hacks” for casual play. Runs entirely in your browser—no installs.

## Play the game
- Open `the link with /index at the end` in a modern browser (Chrome, Edge, Firefox, Safari).
- Click Start Game.
- Move your mouse up/down over the game to control your paddle.

## Controls
- Start Game: begins the match (changes to Reset Game while running).
- Upgrades: opens the right panel to buy upgrades and change skins.
- Hack Tools: opens the left panel with optional helpers/cheats.
- Toggle Theme: switches between light and dark themes.

Opening either side panel pauses the game; closing it resumes play.

## Scoring and coins
- Every time your paddle hits the ball: +5 coins.
- Every time you score a point: +10 coins.
- Coins are used to buy upgrades and skins.

## Upgrades
- Platform Size
  - Increases only your paddle’s height.
  - Multiple levels available.
- Multi‑Ball
  - Adds a chance to spawn a second ball when you hit the ball.
  - Can be toggled on/off independently in the Upgrades panel.
- Paddle Skin
  - Buy skins with coins, then click a preview to equip.

## Hack Tools (optional)
- Autoplay Aimbot: plays for you and speeds up gameplay.
- Line: draws a red prediction line to the next intercept.
- Time Hack: faster toward the AI, slower on your side.
- Another Paddle: adds a second player paddle for wider defense.
- God Mode: extreme speed with autopilot; designed to never miss for an endless rally.

Use these for practice, demonstrations, or chaos—they’re fully optional.

## Multi‑ball basics
- On some of your hits (based on upgrade level), a second ball can spawn with a mirrored angle.
- If one ball scores, only that ball is removed; remaining balls keep playing.

## Saving and resets
- Progress (coins, upgrades, skins, toggles) is saved to your browser’s localStorage.
- To reset everything, clear the site’s storage in your browser settings or devtools.

## File structure
- `index.html` — Game page and UI panels.
- `style.css` — Visual theme and layout.
- `game.js` — Game logic, physics, AI, upgrades, and hack tools.
- `favicon.png` — Tab icon.

## Troubleshooting
- If canvas looks stretched, resize the window; the game adapts to maintain the 4:3 playfield.
- If the game appears frozen, ensure a panel isn’t open (the game pauses while panels are visible) or click Reset Game.
- If settings don’t stick, your browser may be blocking local storage—allow it, or try another browser.

Enjoy the rally.
