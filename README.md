# Synthpocalypse Now! War of Words

A browser rhythm game where you type lyric phrases from the *Synth-pocalypse Now!* album in time with the music, while a neon Three.js scene plays a duel beside the lyrics. The splash screen title is **Synthpocalypse Now!** with the subtitle **War of Words**. The browser tab, and comments in the scripts, use the earlier name **SynthBoarders**.

## Gameplay

1. Open the game and choose **Enable Music & Enter Game**. Browsers need that click before they will start audio.
2. The main menu plays `assets/music/title_concrete_jungle.mp3` and labels it **Title: Concrete Jungle**.
3. **Start Game** loads level 1, **March at Dawn**. The player and the enemy slide in from off-screen, then the track starts.
4. Each sung line fades in along the bottom with punctuation removed. Lines that carry a typing target show that phrase in green in the center. Type it before the window closes.
5. A finished phrase scores 100 points, fires a muzzle flash, and damages the enemy. A wrong character turns the input red, shakes the overlay, and is removed. An expired window marks the phrase failed.
6. When the next line is more than four seconds away, the screen shows **GET READY**. After the first lyric section, the enemy fires during those gaps and stops about three seconds before the next line.
7. The arrow keys move the player. A bullet that reaches the player turns the character red, shakes the view, and flashes a red vignette.
8. Completing the last phrase shows **BATTLE WON**. The same banner appears if that last phrase times out. When the audio ends, the level index advances. With the current track list, that starts **March at Dawn** again.

**Escape** opens the pause menu.

| Button | Effect |
| --- | --- |
| Resume | Continues the battle and the music |
| Restart Battle | Restarts the current track, clears bullets, and resets accuracy and targets hit |
| Restart Campaign | Returns to level 1 and clears the score |
| Quit to Main Menu | Leaves the battle and returns to the Concrete Jungle menu music |

### HUD

- **Character:** level, speed, and score
- **Typing:** the green target phrase and the characters entered so far
- **Game info:** current track, accuracy, and targets hit
- **Enemy:** a health bar with a maximum of 1000, shown after the entrance animation

Accuracy is correct keystrokes divided by correct plus incorrect keystrokes. Each successful phrase deals 29 damage. The 35th successful phrase brings the enemy to 0. The on-screen end card is the **BATTLE WON** banner tied to the last phrase.

### Typing window

The default window is 4 seconds. If the next lyric arrives sooner, the window becomes that gap minus 0.3 seconds, with a floor of 1 second. The last phrase keeps the 4 second window. The game accepts letters and spaces, and it shows letters in uppercase. **Backspace** deletes the last character.

### Movement

The player stays on the left (about x = -45 to -10). **Left** and **Right** strafe, **Up** jumps, and **Down** crouches. The enemy patrols on the right and sometimes crouches, pauses, or turns around.

## Features

- A neon Three.js scene: dark blue sky, a scrolling cyan wireframe grid, a magenta sun, and purple wireframe mountains
- Blocky fighters built from meshes: a magenta player with a cyan visor and a gun, and a larger orange-red enemy with a red visor and a cyan weapon
- Typing targets synced to **March at Dawn**
- Enemy health, floating damage numbers, and a muzzle flash when a phrase lands
- Bullets with trails during **GET READY** gaps. Level 1 uses a horizontal shot about every 1.25 seconds. Stream, vertical-lane, and extra horizontal-lane patterns are coded for later level indexes
- Pause, restart battle, restart campaign, and quit
- A **Vibe Jam 2025** link in the page corner, pointing at [jam.pieter.com](https://jam.pieter.com)

## Tech stack

The game is static HTML, CSS, and JavaScript. Serve the folder and open it; nothing is installed or compiled.

- [Three.js](https://threejs.org/) r128, loaded from cdnjs
- An HTML5 `<audio>` element for the menu MP3 and the battle Ogg Vorbis file
- Google Fonts: Orbitron and Creepster
- Scripts loaded by `index.html`:
  - `enemy_movement.js` — patrol, crouch, and pause
  - `enemy_damage.js` — 1000 health and 29 damage per successful phrase
  - `muzzle_flash.js` — weapon flash and particles
  - `bullet_origin_fix.js` — bullet spawn follows the enemy barrel, including while the enemy is crouched
  - `bullet_collision_fix.js` — extra feedback when a bullet hits the player

## How to run

Use a current browser with WebGL. The page also needs a network connection to load Three.js and the fonts.

From the repository root:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Serving this directory keeps the paths to `assets/music` and the local scripts working. Any other static server is fine if this folder is the site root.

`debug.html` is a separate page. It prints a short key-regex check to the browser console and does not launch the game.

## Tracks and lyrics

| Role | File | On-screen label |
| --- | --- | --- |
| Menu music | `assets/music/title_concrete_jungle.mp3` | Title: Concrete Jungle |
| Level 1 | `assets/music/1 March at Dawn.ogg` | Level 1: March at Dawn |

The battle track is **1 March at Dawn** by **Vanitas**, from the album **Synth-pocalypse Now!**. The LRC file credits **Matthew Walker** (`assets/lyrics/1 March at Dawn.lrc`). The Ogg file runs about 5 minutes 39 seconds.

A second entry, **Doubts Dismissed**, sits commented out in the track list until its audio file is added.

## Project layout

```
index.html                  Scene, HUD, typing, bullets, and menus
enemy_damage.js             Enemy health and damage numbers
enemy_movement.js           Enemy patrol and crouch
muzzle_flash.js             Muzzle flash on a successful phrase
bullet_origin_fix.js        Barrel-relative bullet origin
bullet_collision_fix.js     Extra bullet-hit feedback
debug.html                  Console-only key test
assets/lyrics/              LRC for March at Dawn
assets/music/               Menu MP3 and battle Ogg
```

## Status

This is a playable single-level build.

- The active campaign is **March at Dawn**. Finishing the audio loops that same track. The HUD speed labels **Fast** and **Insane** are assigned at later level indexes, which this track list never reaches, so speed stays **Normal**.
- Bullet patterns past the level-1 horizontal shot run only when the level index is above 0, so they stay unused with the current track list.
- Phrase timings in play come from a hardcoded list in `index.html`. That list was taken from the LRC, and timestamps later in the song differ from `assets/lyrics/1 March at Dawn.lrc`.
- Bullet contact is feedback only: a red flash, a shake, and a vignette. Score and enemy health are the combat numbers on the HUD.
- A green debug readout stays at the bottom left during play. The **B** key spawns an extra test bullet.
- If an audio file fails to load, the track label turns red (`Error loading audio - Check console`) and the game tries the next track after three seconds.
- The repository has no license file.
