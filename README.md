# Oriental Lily Reel (Lilium Orientalis)

> **Procedurally generated, cinematic vertical (9:16) animated video of a blooming Oriental Lily bouquet, styled like an Instagram Reel.**

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Format: 9:16 1080x1920](https://img.shields.io/badge/Format-9%3A16%201080x1920-magenta.svg)](#output-specifications)
[![Pure Procedural](https://img.shields.io/badge/Assets-100%25%20Procedural-green.svg)](#visual-and-botanical-features)

---

## Overview

This project procedurally models, animates, and renders a 9:16 vertical video of an Oriental Lily bouquet (*Lilium orientalis*) using pure Python mathematics (parametric Bezier curves, Bishop parallel transport frames, and OpenCV subpixel rasterization) with **zero external image assets or 3D model files**.

---

## Visual & Botanical Features

- **6 Distinct Petals in Two Whorls**:
  - 3 broad inner petals and 3 narrower outer sepals.
  - Realistic recurved petal tips, longitudinal midrib furrows, and wavy ruffled margins.
  - Raised, tactile botanical speckles (papillae) modeled in 3D along the basal throat.
- **6 Versatile Stamens & Anthers**:
  - Long, arched filaments radiating outward around the pistil.
  - Realistic versatile pollen-covered anthers that swivel and balance perpendicular to the filament tips.
- **Trilobed Pistil**:
  - Central, upright green style terminating in a distinct 3-lobed receptive stigma, standing taller than the surrounding stamens.
- **Natural Stems & Lanceolate Leaves**:
  - Stems with variable curvature and realistic taper from base to receptacle.
  - Glossy, dark-green lanceolate leaves with longitudinal venation and organic gravity droop.
- **Multi-Palette Support**:
  - `pink`: Classic *Stargazer* lily (deep magenta core, rose-pink body, white crisp margins, dark crimson papillae).
  - `white`: Pure *Casablanca* lily (ivory white, pale chartreuse lime throat, golden anthers).
  - `magenta`: Vibrant *Sorbonne* lily (deep raspberry pink throughout).
- **Cinematic Reel Atmosphere**:
  - Studio rim lighting and Subsurface Scattering (SSS) simulation.
  - Subtle camera drift and slow parallax zoom.
  - Gentle idle breeze sway with natural phase offsets.
  - Floating golden pollen particles with gentle bokeh blur.
  - Subtle film grain, warm vignette, and an understated high-fashion botanical title card reveal.

---

## Output Specifications

| Parameter | Specification |
| :--- | :--- |
| **Resolution** | Exactly **1080 x 1920** (9:16 vertical portrait) |
| **Frame Rate** | **30 fps** |
| **Duration** | **12.0 – 15.0 seconds** (proportional scaling via `--duration`) |
| **Format** | **MP4** (`libx264`, `yuv420p`, `+faststart`) for instant mobile & Instagram playback |
| **Memory Streaming** | Direct raw pipe to FFmpeg with zero RAM bloat |

---

## Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Rahat69x/oriental-lily-reel.git
cd oriental-lily-reel
```

### 2. Create and Activate Virtual Environment
```bash
# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

> **Note on FFmpeg**: The `imageio-ffmpeg` dependency automatically downloads and provides a standalone, high-performance static FFmpeg binary. No system-level FFmpeg installation is required!

---

## Usage

### 1. Interactive Menu Launcher (Windows)
Double-click `run_in_terminal.bat` or run:
```powershell
.\run_in_terminal.bat
```

### 2. Fast Low-Resolution Preview (540x960)
Renders a preview in seconds:
```bash
python generate_lily_animation.py --preview --open
```

### 3. Render Full 1080x1920 Instagram Reel
```bash
python generate_lily_animation.py --output lily_reel.mp4 --duration 13.0 --palette pink --title --open
```

### 4. Command Line Flags
| Flag | Default | Description |
| :--- | :---: | :--- |
| `--output` | `lily_reel.mp4` | Destination MP4 file path |
| `--duration` | `13.0` | Video duration in seconds (12–15s recommended) |
| `--fps` | `30` | Target frame rate |
| `--flowers` | `6` | Number of flowers in bouquet (5 to 7) |
| `--palette` | `pink` | Floral palette: `pink` (*Stargazer*), `white` (*Casablanca*), `magenta` (*Sorbonne*) |
| `--seed` | `42` | Random seed for bouquet variation |
| `--preview` | `False` | Renders at 540x960 with coarse mesh for rapid testing |
| `--title` | `False` | Displays the elegant botanical title card at the end |
| `--open` | `False` | Automatically launches the rendered video in the default media player |

---

## Terminal ANSI Truecolor Player

Watch the animation directly in your terminal console using 24-bit ANSI truecolor half-blocks (`▀`):
```bash
python play_in_terminal.py --loop
```

---

## Testing

Run the automated unit and integration test suite:
```bash
python test_suite.py
```

---

## Architecture

- **`Petal`**: Parametric cubic Bezier centerline with Bishop parallel transport framing, midrib curvature, and ruffled margins.
- **`Stamen` & `Pistil`**: Swept 3D cylindrical extrusions with versatile pivoted anthers and trilobed stigma head.
- **`Stem` & `Leaf`**: Continuous geometric splines with natural unfurling and venation.
- **`Lily`**: Flower coordinator handling staged petal unfurling, stamen emergence, and idle breeze sway.
- **`Bouquet`**: Hierarchical 3D arrangement of 5–7 lilies at varying heights, angles, and bloom stages (open, half-open, buds).
- **`Renderer`**: Depth sorting, subsurface scattering (SSS) lighting, camera drift, pollen particles, film grain, and pipe streaming.

---

## Reference & Attribution

Inspired by procedural 3D botanical construction techniques demonstrated in [mishratanya2311/lily-animation-python](https://github.com/mishratanya2311/lily-animation-python) (notably parametric Bezier curves, Bishop parallel transport frames, and OpenCV subpixel anti-aliased polyfill rasterization). This project provides a clean object-oriented architecture, complete 9:16 Instagram Reel composition, multi-palette styling, and live terminal playback.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
