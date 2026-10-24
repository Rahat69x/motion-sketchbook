# Motion Sketchbook 🎨✨

> **A curated collection of procedural, mathematical, and generative creative coding motion artworks written in Python.**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure Procedural](https://img.shields.io/badge/Assets-100%25%20Procedural-green.svg)](#motion-sketchbook-projects)

---

## Motion Sketchbook Projects

| Project | Description | Tech Stack | Output Format |
| :--- | :--- | :--- | :--- |
| **[01. Oriental Lily Reel](#01-oriental-lily-reel-lilium-orientalis)** | Procedural 3D botanical bouquet simulation with staged growth, SSS lighting, and terminal playback. | `NumPy`, `OpenCV`, `imageio-ffmpeg` | **9:16 MP4 Video** (`1080x1920`, 30 fps) |
| **[02. Lexical Eyes](#02-lexical-eyes-typographic-vision)** | Living typographic art application where a living pair of eyes is shaped entirely from literary quotes. | `Pygame-ce`, `Pillow`, `NumPy` | **Interactive App** (Full-screen / Windowed) |
| **03. Sunflowers Painting** | Self-contained procedural botanical artwork with 3D depth parallax, organic sway, and instant resize. | `HTML5`, `CSS3`, `SVG`, `Vanilla JS` | **Single-file Web App** (`sunflower.html`) |
| **04. ResumeForge** | Campus placement prep platform with ATS resume scanner, AI mock interviews, and aptitude practice. | `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS` | **Full-Stack Web App** (`resumeforge/`) |

---

## Quickstart & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Rahat69x/motion-sketchbook.git
cd motion-sketchbook
```

### 2. Set Up Virtual Environment
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Consolidated Dependencies
```bash
pip install -r requirements.txt
```

---

## 01. Oriental Lily Reel (*Lilium orientalis*)

A procedural 3D botanical bouquet animation constructed from mathematical parametric curves and subpixel anti-aliased polygon rasterization with **zero external image assets or 3D model files**.

### Visual & Botanical Features
- **Dual-Whorl Petal Nesting**: 3 broad inner petals and 3 narrower outer sepals with ruffled margins, recurved tips, and 3D raised botanical papillae.
- **Versatile Stamens & Pistil**: 6 arched filaments supporting versatile balanced anthers and a central trilobed stigma.
- **Bishop Frame Transport**: Twist-free 3D tubular extrusion along cubic Bezier splines.
- **Subsurface Scattering & Studio Lighting**: Velvety floral gradients (*Stargazer*, *Casablanca*, *Sorbonne* palettes) with floating golden pollen particles.
- **Direct FFmpeg Pipe Streaming**: High-speed frame rendering directly into an H.264 MP4 pipe.

### Run & Render
```bash
# Interactive Windows Launcher:
.\run_in_terminal.bat

# Fast 540x960 Preview (takes ~5 seconds):
python generate_lily_animation.py --preview --open

# Full 1080x1920 Instagram Reel (13 seconds, 30 fps):
python generate_lily_animation.py --output lily_reel.mp4 --duration 13.0 --palette pink --title --open

# Watch directly in terminal via 24-bit ANSI Truecolor half-blocks:
python play_in_terminal.py --loop
```

---

## 02. Lexical Eyes (Typographic Vision)

A standalone digital art application in which **everything visible on screen is made strictly of typography**: literary quotes (Blake, Whitman, Emerson, Dickinson, Keats, Shakespeare, Nietzsche) and poetic words. Nothing is drawn as a solid shape except the ambient background, soft vignette, and clipping masks.

### Visual & Kinetic Features
- **Dual-Eye Anatomy with Asymmetry**: Two eyes side-by-side with $4^\circ-6^\circ$ upward canthal tilt, $2-4\%$ seeded anatomical asymmetry, and warm medial caruncle word clusters.
- **4-Tier Typographic Iris**: Concentric reading-order rings, radiating spoke fibers, golden collarette, and outer limbal rings.
- **Biological Blink Kinematics**: Asymmetric close/hold/open phases, double-blink probability ($15\%$), and Bell's phenomenon upward eye roll.
- **Aperture Polygon Clipping**: Internal anatomy clipped smoothly to living cubic Bezier eyelid curves using `BLEND_RGBA_MULT`.
- **Instant 256-Step LUT Colorization**: 6 rich themes (*Ember*, *Glacier*, *Verdant*, *Amethyst*, *Ink*, *Rose Gold*) with live 1-second cross-fades without re-rasterizing text.
- **Interactive Gaze & Camera Auto-Zoom**: Critically damped spring tracking, pupil dilation, micro-saccades on idle, and cinematic macro/wide zoom timeline.

### Run Lexical Eyes
```bash
# Default Launch: Native Full-Screen (DPI-aware, cursor hidden):
python lexical_eyes.py

# Resizable Windowed Testing Mode (1280x720) with live debug telemetry:
python lexical_eyes.py --windowed --size 1280x720 --debug

# Start with Glacier theme, High Quality, and custom quotes:
python lexical_eyes.py -w --theme glacier --quality high --quotes quotes.txt
```

### Controls Cheat Sheet
| Key / Input | Action |
| :--- | :--- |
| **`B`** / **`Space`** / **Left Click** | Trigger an immediate organic blink |
| **`Z`** | Toggle cinematic auto-zoom timeline |
| **`Up` / `Down` / `+` / `-` / `Wheel`** | Manual camera zoom (0 resets to 1.0x) |
| **`P` / `Right` / `Left`** | Cycle forward / backward through color themes |
| **`1` – `6`** | Jump directly to theme (Ember, Glacier, Verdant, Amethyst, Ink, Rose Gold) |
| **`R`** | Asynchronously regenerate layout with a new random seed (background thread) |
| **`S`** | Save high-resolution lossless screenshot (PNG) |
| **`G`** | Toggle Post-FX (bloom glow, film grain, vignette) |
| **`M`** | Toggle interactive mouse reactivity |
| **`F` / `F11`** | Toggle Fullscreen / Windowed mode live |
| **`H` / `F1`** | Toggle frosted HUD help overlay |
| **`Esc` / `Q`** | Gracefully quit application |

---

## 03. Sunflowers Painting (`sunflower.html`)

A self-contained procedural botanical artwork with true 3D perspective parallax, organic breeze simulation, instant layout recalculation on viewport resize, and reduced-motion compliance.

### Run
Open `sunflower.html` in any modern web browser or run via local server:
```bash
python -m http.server 8000
# Open http://localhost:8000/sunflower.html
```

---

## 04. ResumeForge Platform (`resumeforge/`)

A modern Next.js 16 / React 19 / TypeScript placement preparation platform featuring ATS resume scoring, AI mock interviews, aptitude testing, and print-ready PDF export. See [`resumeforge/README.md`](resumeforge/README.md) for full configuration and documentation.

### Run & Build
```bash
cd resumeforge
npm install
npm test
npm run build
npm run dev
```

---

## Automated Verification & Tests

Run the test suites across all projects:
```bash
# Test Oriental Lily Reel parametric geometry and rendering:
python test_suite.py

# Test Lexical Eyes themes, LUTs, SpriteCache, and smoke test:
python test_lexical_eyes.py
python lexical_eyes.py --smoke-test

# Test ResumeForge backend, engines, auth, ATS, and concurrency mutex:
cd resumeforge && npm test && npm run build
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
