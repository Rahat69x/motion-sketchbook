"""
===============================================================================
LEXICAL EYES: Typographic Vision Art Application
===============================================================================
A living pair of expressive, breathing eyes rendered entirely from typography.
Every anatomical structure—iris fibers, pupil depths, eyelid margins, lashes,
sclera contours, brows, and surrounding celestial halo—is sculpted from poetic
quotes, phrases, and single resonant words.

Tech Stack:
  - Python 3.9+
  - Pygame-ce / Pygame 2.5+ (windowing, hardware timing, input, compositing)
  - NumPy 1.24+ (vectorized geometry, Bezier arc-length sampling, LUT colorization)
  - Pillow 10+ (pure ImageFont & ImageDraw typography rendering)

Author: Antigravity Pair Programmer
License: MIT
===============================================================================
"""

import sys
import os
import math
import time
import argparse
import random
import threading
import queue
from typing import Dict, List, Tuple, Optional, Any

import numpy as np
from PIL import Image, ImageFont, ImageDraw

# Windows DPI Awareness pre-initialization
if sys.platform.startswith("win"):
    try:
        import ctypes
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

import pygame

# =============================================================================
# CONSTANTS: TUNABLE CONFIGURATION PARAMETERS
# =============================================================================
# Script & Asset Directories
SCRIPT_DIR: str = os.path.dirname(os.path.abspath(__file__))
DEFAULT_QUOTES_PATH: str = os.path.join(SCRIPT_DIR, "quotes.txt")

# Window & Display
DEFAULT_WINDOW_WIDTH: int = 1280
DEFAULT_WINDOW_HEIGHT: int = 720
DEFAULT_FPS: int = 60
DEFAULT_THEME: str = "ember"
DEFAULT_QUALITY: str = "medium"

# Quality Presets: (Bake Oversample Factor, Word Density Factor)
QUALITY_PRESETS = {
    "low":    {"bake_scale": 1.00, "density": 0.75, "blur_div": 8},
    "medium": {"bake_scale": 1.35, "density": 1.00, "blur_div": 6},
    "high":   {"bake_scale": 1.70, "density": 1.25, "blur_div": 4},
}

# Eye Anatomical Geometry (Normalized scene space where U = scene height)
EYE_SPACING_U: float = 0.46          # Center of eyes at x = -0.46U and +0.46U
ALMOND_HALF_WIDTH_U: float = 0.36    # Half-width of palpebral aperture
UPPER_LID_HEIGHT_U: float = 0.17     # Max upper aperture height when fully open
LOWER_LID_HEIGHT_U: float = 0.11     # Max lower aperture height when fully open
IRIS_RADIUS_U: float = 0.135         # Radius of the iris disc
PUPIL_RADIUS_MIN_RATIO: float = 0.28 # Pupil radius as ratio of iris radius (constricted)
PUPIL_RADIUS_MAX_RATIO: float = 0.55 # Pupil radius as ratio of iris radius (dilated)
CANTHAL_TILT_DEG: float = 5.0        # Outer eye corner upward tilt angle
ASYMMETRY_SCALE_MIN: float = 0.97    # 2-4% seeded individual eye asymmetry
ASYMMETRY_SCALE_MAX: float = 1.03

# Animation Dynamics & Timing
BLINK_INTERVAL_MIN: float = 2.5      # Seconds between blinks
BLINK_INTERVAL_MAX: float = 6.0
BLINK_CLOSE_DURATION: float = 0.095  # 95 ms close phase (ease-in)
BLINK_HOLD_DURATION: float = 0.045   # 45 ms closed hold
BLINK_OPEN_DURATION: float = 0.185   # 185 ms open phase (ease-out)
DOUBLE_BLINK_CHANCE: float = 0.15    # 15% probability of a quick double-blink
SLEEPY_BLINK_CHANCE: float = 0.08    # Occasional slow languid blink
EYE_BLINK_OFFSET_SEC: float = 0.018  # 18 ms natural offset between left and right eyes
LOWER_LID_RISE_RATIO: float = 0.20   # Lower lid rises 20% to meet upper lid
BELLS_PHENOMENON_RATIO: float = 0.06 # Iris rolls up 6% of iris radius during blink

# Gaze, Spring Physics & Parallax
GAZE_SPRING_K: float = 38.0          # Critically damped gaze tracking stiffness
GAZE_SPRING_DAMP: float = 12.3       # Critical damping coefficient (2 * sqrt(K))
GAZE_MAX_TRAVEL_RATIO: float = 0.28  # Maximum iris travel (28% of iris radius)
GAZE_CONVERGENCE_FACTOR: float = 0.08# Disconjugate convergence shift as cursor nears
MOUSE_IDLE_TIMEOUT: float = 4.0      # Idle seconds before micro-saccades trigger
LID_GAZE_FOLLOW_RATIO: float = 0.15  # Eyelids follow vertical gaze travel

# Parallax Depth Weights
PARALLAX_IRIS: float = 1.00
PARALLAX_PUPIL: float = 1.05
PARALLAX_GLINTS: float = 0.30
PARALLAX_LIDS: float = 0.15
PARALLAX_BROWS: float = 0.10
PARALLAX_BACKGROUND: float = 0.05

# Camera Auto-Zoom Timeline
ZOOM_TIMELINE_CYCLE: float = 32.0    # Seconds for full cinematic cycle
MAX_AUTO_ZOOM: float = 2.05          # Maximum zoom in on single eye
LISSAJOUS_PAN_AMPLITUDE: float = 0.015 # Lissajous slow drift amplitude
BREATHING_ZOOM_AMPLITUDE: float = 0.008

# Cache & Baking Limits
SPRITE_CACHE_MAX_ITEMS: int = 3500   # Maximum cached word/phrase textures
ROTATION_QUANTIZE_DEG: int = 3       # 3-degree rotation buckets (120 buckets)
TIME_SLICE_BUDGET_MS: float = 8.0    # Frame time budget for async background baking


# =============================================================================
# 1. COLOR THEMES AND PALETTE LOOKUP TABLE (LUT) BUILDER
# =============================================================================
class Theme:
    """Defines background colors and 256-step gradient stops for every layer role."""
    def __init__(
        self,
        name: str,
        bg_top: Tuple[int, int, int],
        bg_bottom: Tuple[int, int, int],
        stops: Dict[str, List[Tuple[float, Tuple[int, int, int]]]]
    ):
        self.name = name
        self.bg_top = bg_top
        self.bg_bottom = bg_bottom
        self.stops = stops
        self.luts: Dict[str, np.ndarray] = self._build_luts()

    def _build_luts(self) -> Dict[str, np.ndarray]:
        """Builds hardware-fast (256, 3) uint8 lookup tables using NumPy interpolation."""
        luts = {}
        indices = np.linspace(0.0, 1.0, 256)
        for role, stop_list in self.stops.items():
            pos = [s[0] for s in stop_list]
            r = [s[1][0] for s in stop_list]
            g = [s[1][1] for s in stop_list]
            b = [s[1][2] for s in stop_list]

            lut = np.zeros((256, 3), dtype=np.uint8)
            lut[:, 0] = np.clip(np.interp(indices, pos, r), 0, 255).astype(np.uint8)
            lut[:, 1] = np.clip(np.interp(indices, pos, g), 0, 255).astype(np.uint8)
            lut[:, 2] = np.clip(np.interp(indices, pos, b), 0, 255).astype(np.uint8)
            luts[role] = lut
        return luts


THEMES: Dict[str, Theme] = {
    # 1. Ember: Near-black warm background, molten gold to crimson iris, warm white text
    "ember": Theme(
        name="Ember",
        bg_top=(11, 6, 4),
        bg_bottom=(22, 10, 6),
        stops={
            "iris":     [(0.0, (255, 225, 140)), (0.35, (255, 185, 75)), (0.7, (215, 80, 25)), (1.0, (120, 20, 20))],
            "sclera":   [(0.0, (230, 220, 205)), (0.6, (180, 165, 150)), (1.0, (95, 80, 70))],
            "pupil":    [(0.0, (22, 14, 12)), (0.5, (14, 8, 7)), (1.0, (6, 3, 2))],
            "lids":     [(0.0, (210, 150, 115)), (0.5, (160, 100, 70)), (1.0, (75, 40, 25))],
            "lashes":   [(0.0, (55, 30, 20)), (1.0, (25, 10, 8))],
            "brows":    [(0.0, (165, 105, 75)), (0.6, (115, 65, 40)), (1.0, (60, 30, 18))],
            "halo":     [(0.0, (245, 195, 120)), (0.5, (170, 110, 55)), (1.0, (80, 45, 20))],
            "whispers": [(0.0, (145, 105, 75)), (1.0, (70, 45, 30))],
            "glint":    [(0.0, (255, 252, 245)), (0.5, (255, 235, 190)), (1.0, (220, 160, 80))],
            "accent":   [(0.0, (245, 130, 110)), (1.0, (170, 60, 45))],
        }
    ),
    # 2. Glacier: Deep navy, ice blue to cyan to indigo iris, pale silver text
    "glacier": Theme(
        name="Glacier",
        bg_top=(5, 10, 22),
        bg_bottom=(9, 20, 38),
        stops={
            "iris":     [(0.0, (215, 245, 255)), (0.35, (120, 205, 255)), (0.7, (50, 130, 215)), (1.0, (20, 45, 110))],
            "sclera":   [(0.0, (220, 235, 245)), (0.6, (160, 185, 205)), (1.0, (80, 105, 125))],
            "pupil":    [(0.0, (12, 18, 28)), (0.5, (7, 12, 20)), (1.0, (3, 5, 10))],
            "lids":     [(0.0, (140, 175, 205)), (0.5, (95, 130, 165)), (1.0, (45, 65, 90))],
            "lashes":   [(0.0, (25, 45, 65)), (1.0, (10, 20, 30))],
            "brows":    [(0.0, (120, 150, 185)), (0.6, (75, 105, 135)), (1.0, (35, 55, 75))],
            "halo":     [(0.0, (180, 225, 255)), (0.5, (100, 165, 220)), (1.0, (40, 80, 125))],
            "whispers": [(0.0, (110, 145, 180)), (1.0, (45, 70, 95))],
            "glint":    [(0.0, (255, 255, 255)), (0.5, (210, 240, 255)), (1.0, (130, 195, 245))],
            "accent":   [(0.0, (205, 185, 230)), (1.0, (130, 110, 170))],
        }
    ),
    # 3. Verdant: Black-green, lime to emerald to deep forest iris
    "verdant": Theme(
        name="Verdant",
        bg_top=(4, 10, 6),
        bg_bottom=(8, 22, 14),
        stops={
            "iris":     [(0.0, (225, 255, 145)), (0.35, (120, 235, 130)), (0.7, (45, 165, 85)), (1.0, (15, 65, 30))],
            "sclera":   [(0.0, (225, 240, 225)), (0.6, (165, 190, 170)), (1.0, (80, 105, 85))],
            "pupil":    [(0.0, (10, 20, 14)), (0.5, (6, 14, 9)), (1.0, (2, 6, 3))],
            "lids":     [(0.0, (160, 195, 145)), (0.5, (110, 150, 95)), (1.0, (50, 75, 45))],
            "lashes":   [(0.0, (25, 50, 30)), (1.0, (10, 22, 12))],
            "brows":    [(0.0, (125, 160, 110)), (0.6, (80, 115, 70)), (1.0, (40, 60, 35))],
            "halo":     [(0.0, (195, 245, 160)), (0.5, (115, 195, 110)), (1.0, (45, 95, 45))],
            "whispers": [(0.0, (110, 155, 110)), (1.0, (50, 80, 50))],
            "glint":    [(0.0, (255, 255, 245)), (0.5, (225, 255, 200)), (1.0, (145, 225, 120))],
            "accent":   [(0.0, (245, 215, 140)), (1.0, (175, 140, 70))],
        }
    ),
    # 4. Amethyst: Deep indigo, electric pink to royal violet iris
    "amethyst": Theme(
        name="Amethyst",
        bg_top=(10, 6, 24),
        bg_bottom=(20, 10, 42),
        stops={
            "iris":     [(0.0, (255, 175, 245)), (0.35, (205, 95, 235)), (0.7, (135, 45, 195)), (1.0, (60, 15, 95))],
            "sclera":   [(0.0, (235, 225, 245)), (0.6, (180, 165, 200)), (1.0, (95, 80, 115))],
            "pupil":    [(0.0, (18, 10, 28)), (0.5, (12, 6, 18)), (1.0, (5, 2, 8))],
            "lids":     [(0.0, (195, 145, 215)), (0.5, (145, 95, 170)), (1.0, (70, 40, 90))],
            "lashes":   [(0.0, (45, 20, 60)), (1.0, (20, 8, 28))],
            "brows":    [(0.0, (150, 105, 175)), (0.6, (100, 65, 125)), (1.0, (50, 30, 65))],
            "halo":     [(0.0, (235, 165, 255)), (0.5, (165, 90, 220)), (1.0, (75, 35, 110))],
            "whispers": [(0.0, (140, 95, 170)), (1.0, (65, 40, 85))],
            "glint":    [(0.0, (255, 250, 255)), (0.5, (245, 215, 255)), (1.0, (190, 130, 240))],
            "accent":   [(0.0, (255, 140, 190)), (1.0, (185, 60, 120))],
        }
    ),
    # 5. Ink: Pure black, monochrome grayscale with a faint crimson glint accent
    "ink": Theme(
        name="Ink",
        bg_top=(3, 3, 3),
        bg_bottom=(7, 7, 7),
        stops={
            "iris":     [(0.0, (245, 245, 245)), (0.35, (185, 185, 185)), (0.7, (115, 115, 115)), (1.0, (40, 40, 40))],
            "sclera":   [(0.0, (225, 225, 225)), (0.6, (165, 165, 165)), (1.0, (85, 85, 85))],
            "pupil":    [(0.0, (14, 14, 14)), (0.5, (8, 8, 8)), (1.0, (2, 2, 2))],
            "lids":     [(0.0, (175, 175, 175)), (0.5, (120, 120, 120)), (1.0, (55, 55, 55))],
            "lashes":   [(0.0, (40, 40, 40)), (1.0, (15, 15, 15))],
            "brows":    [(0.0, (140, 140, 140)), (0.6, (90, 90, 90)), (1.0, (45, 45, 45))],
            "halo":     [(0.0, (205, 205, 205)), (0.5, (135, 135, 135)), (1.0, (55, 55, 55))],
            "whispers": [(0.0, (115, 115, 115)), (1.0, (50, 50, 50))],
            "glint":    [(0.0, (255, 255, 255)), (0.6, (255, 210, 210)), (1.0, (255, 75, 75))], # Crimson accent
            "accent":   [(0.0, (190, 50, 50)), (1.0, (110, 25, 25))],
        }
    ),
    # 6. Rose Gold: Dark plum background, champagne rose gold to burgundy iris
    "rose_gold": Theme(
        name="Rose Gold",
        bg_top=(18, 7, 12),
        bg_bottom=(28, 12, 20),
        stops={
            "iris":     [(0.0, (252, 215, 195)), (0.35, (246, 175, 145)), (0.7, (195, 95, 90)), (1.0, (95, 25, 45))],
            "sclera":   [(0.0, (240, 225, 225)), (0.6, (185, 165, 170)), (1.0, (105, 85, 90))],
            "pupil":    [(0.0, (22, 10, 15)), (0.5, (14, 6, 9)), (1.0, (5, 2, 4))],
            "lids":     [(0.0, (215, 160, 165)), (0.5, (165, 110, 120)), (1.0, (85, 45, 55))],
            "lashes":   [(0.0, (50, 22, 32)), (1.0, (22, 8, 14))],
            "brows":    [(0.0, (165, 115, 125)), (0.6, (115, 70, 80)), (1.0, (60, 32, 40))],
            "halo":     [(0.0, (245, 190, 185)), (0.5, (180, 120, 130)), (1.0, (85, 45, 60))],
            "whispers": [(0.0, (150, 105, 120)), (1.0, (75, 45, 55))],
            "glint":    [(0.0, (255, 252, 250)), (0.5, (255, 225, 220)), (1.0, (235, 160, 165))],
            "accent":   [(0.0, (240, 110, 130)), (1.0, (160, 50, 75))],
        }
    )
}
THEME_KEYS = list(THEMES.keys())


# =============================================================================
# 2. EXTENSIVE LEXICON AND QUOTE REPOSITORY
# =============================================================================
DEFAULT_QUOTES: Dict[str, List[str]] = {
    "iris": [
        "To see a World in a Grain of Sand",
        "And a Heaven in a Wild Flower",
        "Hold Infinity in the palm of your hand",
        "And Eternity in an hour",
        "If the doors of perception were cleansed",
        "Everything would appear to man as it is, Infinite",
        "The eye is the first circle",
        "The horizon which it forms is the second",
        "I become a transparent eyeball",
        "I am nothing, I see all",
        "The currents of the Universal Being circulate through me",
        "Mine eyes are made the fools o the other senses",
        "Thou still unravished bride of quietness",
        "Beauty is truth, truth beauty",
        "A thing of beauty is a joy for ever",
        "The bright suns I see and the dark suns I cannot see",
        "A vast similitude interlocks all",
        "All truths wait in all things",
        "For here there is no place that does not see you",
        "Could a greater miracle take place than to look through each others eyes",
        "Time is but the stream I go a-fishing in",
        "The question is not what you look at, but what you see",
        "Open thine eyes and see",
        "In the mind of the observer lies eternity",
        "The stars awaken when mortals slumber",
        "Reflecting the constellations of quiet thought",
        "Orbital mechanics of celestial light",
        "A prism dividing the white radiance of eternity",
    ],
    "pupil": [
        "And if thou gaze long into an abyss",
        "The abyss will also gaze into thee",
        "I contain multitudes",
        "The Brain is wider than the Sky",
        "There is that in me, I do not know what it is",
        "Into the silent midnight core",
        "The center where all rays converge and vanish",
        "Singularity of infinite contemplation",
        "Darkness visible through the threshold of thought",
        "The profound silence of uncharted depths",
        "Where memory sleeps without form or name",
        "Black wellspring of unuttered dreams",
        "A fathomless horizon within the soul",
        "The secret geometry of the void",
        "Stillness at the axis of the turning sphere",
    ],
    "sclera": [
        "The Soul selects her own Society",
        "Then shuts the Door",
        "Tell all the truth but tell it slant",
        "Success in Circuit lies",
        "There is a solitude of space",
        "A solitude of sea",
        "A solitude of death, but these",
        "Society shall be compared with that profounder site",
        "That polar privacy of a soul in silence",
        "Ivory expanse of quietude and breath",
        "The uncarved marble of perception",
        "Daylight resting softly upon porcelain shores",
        "Still waters reflecting cloudy skies",
        "The quiet meadow where vision begins",
        "Unwritten parchment of the morning",
    ],
    "lids": [
        "Our revels now are ended",
        "We are such stuff as dreams are made on",
        "And our little life is rounded with a sleep",
        "The moonlight sleeps upon this bank",
        "Here will we sit and let the sounds of music",
        "Creep in our ears: soft stillness and the night",
        "Become the touches of sweet harmony",
        "Fold after fold the twilight gathers",
        "Veil of the waking mind",
        "Curtain descending upon the theater of day",
        "Tender descent of slumbering peace",
        "Where shadow meets the waking shore",
        "Soft threshold between sight and dream",
    ],
    "brows": [
        "My heart aches, and a drowsy numbness pains",
        "My sense, as though of hemlock I had drunk",
        "Was it a vision, or a waking dream?",
        "Fled is that music: Do I wake or sleep?",
        "Above the silent arch of human thought",
        "Contemplation carved upon the noble brow",
        "The stoic ridge overlooking mortal time",
        "Shelter of dreams and silent resolutions",
        "A vault of stars across the temple wall",
    ],
    "halo": [
        "There is a light that never goes out",
        "Resonance of an unseen companion",
        "Aura of ancient words once spoken",
        "Concentric ripples upon the lake of memory",
        "Perimeter of wonder expanding outward",
        "Threshold where language turns to music",
        "Radiant circumference of sacred geometry",
        "The quiet aura of enduring grace",
    ],
    "whispers": [
        "breath", "hush", "echo", "trace", "pulse", "silence", "drift", "pause",
        "lingering", "shadow", "air", "spark", "glance", "murmur", "memory", "tide",
        "mist", "veil", "dream", "subtle", "vision", "faint", "repose", "hallow",
        "luz", "ojo", "sguardo", "claritas", "oculus", "lux", "lumen", "mirada"
    ],
    "glint": [
        "lux", "luz", "light", "lumen", "spark", "flare", "gleam", "radiance", "sun"
    ],
    "caruncle": [
        "dawn", "pulse", "coral", "rose", "warmth", "flesh", "dew", "spring", "origin"
    ]
}

SINGLE_WORDS = {
    "iris": ["radiance", "mandala", "vortex", "filament", "prism", "crystal", "orbit", "starlight", "chakra", "wheel", "infinite", "fiber", "aurora", "constellation", "horizon"],
    "pupil": ["abyss", "void", "core", "deep", "midnight", "night", "singularity", "hollow", "silent", "shadow", "fathomless", "black", "well", "source", "eternity"],
    "sclera": ["ivory", "marble", "porcelain", "expanse", "stillness", "shore", "mist", "alabaster", "cloud", "daylight", "parchment", "field", "quiet", "calm", "pure"],
    "lids": ["curtain", "veil", "shelter", "twilight", "dusk", "softness", "fold", "slumber", "crease", "mantle", "tender", "gentle", "nocturnal", "sleep", "shadow"],
    "lashes": ["fringe", "sweep", "shade", "plume", "quill", "comb", "lattice", "needle", "curtain", "fringe", "guard", "veil", "sweep", "arch", "line"],
    "brows": ["arch", "ridge", "crest", "poise", "canopy", "frame", "crown", "span", "thought", "horizon", "shelter", "vault", "nobility", "temple"],
    "halo": ["corona", "aura", "glow", "ripple", "radiance", "perimeter", "resonance", "echo", "boundary", "tide", "wave", "threshold", "atmosphere"]
}


class Lexicon:
    """
    Manages tagged literary quotes and poetic words for every ocular layer.
    Supports dynamic loading and appending of quotes from external files.
    """
    def __init__(self, quotes_file: Optional[str] = None):
        self.quotes: Dict[str, List[str]] = {k: list(v) for k, v in DEFAULT_QUOTES.items()}
        self.words: Dict[str, List[str]] = {k: list(v) for k, v in SINGLE_WORDS.items()}
        if quotes_file:
            self.load_quotes_file(quotes_file)
        elif os.path.exists(DEFAULT_QUOTES_PATH):
            self.load_quotes_file(DEFAULT_QUOTES_PATH)
        elif os.path.exists("quotes.txt"):
            self.load_quotes_file("quotes.txt")

    def load_quotes_file(self, filepath: str):
        if not os.path.exists(filepath):
            return
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]
                if lines:
                    self.quotes["whispers"].extend(lines)
                    self.quotes["iris"].extend(lines)
                    print(f"[Lexical Eyes] Loaded {len(lines)} custom quotes from {filepath}")
        except Exception as e:
            print(f"[Lexical Eyes] Warning: Could not read quotes from {filepath}: {e}")

    def get_quote(self, role: str, rng: random.Random) -> str:
        pool = self.quotes.get(role, self.quotes.get("whispers", ["Infinite"]))
        return rng.choice(pool)

    def get_words(self, role: str, count: int, rng: random.Random) -> List[str]:
        words: List[str] = []
        while len(words) < count:
            q = self.get_quote(role, rng)
            words.extend(q.split())
        return words[:count]

    def get_whisper(self, rng: random.Random) -> str:
        return rng.choice(self.quotes["whispers"])


# =============================================================================
# 3. FONT MANAGEMENT AND SPRITE CACHE
# =============================================================================
class FontBank:
    """Discovers and provides system and fallback TrueType fonts across OSes."""
    def __init__(self, override_font_path: Optional[str] = None):
        self.override_path = override_font_path
        self.font_paths: Dict[str, Optional[str]] = self._discover_fonts()
        self._font_cache: Dict[Tuple[str, int], ImageFont.FreeTypeFont] = {}

    def _discover_fonts(self) -> Dict[str, Optional[str]]:
        search_dirs = ["./fonts", os.path.join(SCRIPT_DIR, "fonts")]
        if self.override_path and os.path.exists(self.override_path):
            return {
                "italic": self.override_path,
                "regular": self.override_path,
                "bold": self.override_path,
                "mono": self.override_path,
            }

        if sys.platform.startswith("win"):
            windir = os.environ.get("WINDIR", "C:\\Windows")
            search_dirs.append(os.path.join(windir, "Fonts"))
        elif sys.platform.startswith("darwin"):
            search_dirs.extend([
                "/System/Library/Fonts",
                "/Library/Fonts",
                os.path.expanduser("~/Library/Fonts")
            ])
        else: # Linux / BSD
            search_dirs.extend([
                "/usr/share/fonts",
                "/usr/local/share/fonts",
                os.path.expanduser("~/.fonts"),
                os.path.expanduser("~/.local/share/fonts")
            ])

        candidates = {
            "italic":  ["georgiai.ttf", "timesi.ttf", "palai.ttf", "DejaVuSerif-Italic.ttf", "LiberationSerif-Italic.ttf"],
            "regular": ["georgia.ttf", "times.ttf", "pala.ttf", "DejaVuSerif.ttf", "LiberationSerif-Regular.ttf"],
            "bold":    ["georgiab.ttf", "timesbd.ttf", "palab.ttf", "DejaVuSerif-Bold.ttf", "LiberationSerif-Bold.ttf"],
            "mono":    ["cour.ttf", "consola.ttf", "DejaVuSansMono.ttf", "LiberationMono-Regular.ttf", "arial.ttf"],
        }

        found = {"italic": None, "regular": None, "bold": None, "mono": None}
        for voice, fnames in candidates.items():
            for sdir in search_dirs:
                if not os.path.isdir(sdir):
                    continue
                for root, _, files in os.walk(sdir):
                    file_map = {f.lower(): f for f in files}
                    for fname in fnames:
                        if fname.lower() in file_map:
                            found[voice] = os.path.join(root, file_map[fname.lower()])
                            break
                    if found[voice]:
                        break
                if found[voice]:
                    break
        return found

    def get_font(self, voice: str, size: int) -> Any:
        """Retrieves a cached Pillow ImageFont instance, falling back gracefully."""
        size = max(8, int(round(size)))
        key = (voice, size)
        if key in self._font_cache:
            return self._font_cache[key]

        path = self.font_paths.get(voice)
        font = None
        if path and os.path.exists(path):
            try:
                font = ImageFont.truetype(path, size)
            except Exception:
                font = None

        if font is None:
            # Fallback to Pillow default
            try:
                font = ImageFont.load_default(size=size)
            except Exception:
                font = ImageFont.load_default()

        self._font_cache[key] = font
        return font


class SpriteCache:
    """
    Renders words into grayscale alpha masks with Pillow, caches Pygame surfaces,
    and quantizes rotations to 3-degree buckets.
    """
    def __init__(self, font_bank: FontBank, max_items: int = SPRITE_CACHE_MAX_ITEMS):
        self.font_bank = font_bank
        self.max_items = max_items
        self._base_cache: Dict[Tuple[str, str, int], pygame.Surface] = {}
        self._rotated_cache: Dict[Tuple[str, str, int, int], pygame.Surface] = {}

    def get_base_sprite(self, text: str, voice: str, size: int) -> pygame.Surface:
        """Renders text once into an RGBA mask where RGB=255 and Alpha=glyph intensity."""
        key = (text, voice, size)
        if key in self._base_cache:
            return self._base_cache[key]

        font = self.font_bank.get_font(voice, size)
        try:
            bbox = font.getbbox(text)
            w = max(4, bbox[2] - bbox[0] + 4)
            h = max(4, bbox[3] - bbox[1] + 4)
            offset_x = -bbox[0] + 2
            offset_y = -bbox[1] + 2
        except Exception:
            w, h = max(12, int(size * 0.6 * len(text))), max(12, int(size * 1.2))
            offset_x, offset_y = 2, 2

        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        try:
            draw.text((offset_x, offset_y), text, fill=(255, 255, 255, 255), font=font)
        except Exception:
            pass

        surf = pygame.image.frombytes(img.tobytes(), (w, h), "RGBA")

        # LRU eviction if needed
        if len(self._base_cache) >= self.max_items:
            # Evict first 10%
            keys = list(self._base_cache.keys())[:int(self.max_items * 0.1)]
            for k in keys:
                del self._base_cache[k]

        self._base_cache[key] = surf
        return surf

    def get_rotated_sprite(self, text: str, voice: str, size: int, angle_deg: float) -> pygame.Surface:
        """Retrieves or creates a rotated sprite quantized to 3-degree increments."""
        # Quantize to 3 degree buckets
        quantized_angle = int(round(angle_deg / ROTATION_QUANTIZE_DEG)) * ROTATION_QUANTIZE_DEG % 360
        if quantized_angle == 0:
            return self.get_base_sprite(text, voice, size)

        key = (text, voice, size, quantized_angle)
        if key in self._rotated_cache:
            return self._rotated_cache[key]

        base = self.get_base_sprite(text, voice, size)
        # Note: Pygame rotation is counter-clockwise; negate for math angle
        rotated = pygame.transform.rotate(base, -quantized_angle)

        if len(self._rotated_cache) >= self.max_items * 2:
            keys = list(self._rotated_cache.keys())[:int(self.max_items * 0.2)]
            for k in keys:
                del self._rotated_cache[k]

        self._rotated_cache[key] = rotated
        return rotated


# =============================================================================
# 4. GEOMETRY HELPERS: BEZIER, ARC-LENGTH SAMPLING, AND POISSON DISK
# =============================================================================
def sample_cubic_bezier(p0: np.ndarray, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray, n: int = 160) -> Tuple[np.ndarray, np.ndarray, float]:
    """Evaluates a cubic Bezier curve and returns sampled coordinates, cumulative arc lengths, and total length."""
    t = np.linspace(0.0, 1.0, n)[:, None]
    pts = (1 - t)**3 * p0 + 3 * (1 - t)**2 * t * p1 + 3 * (1 - t) * t**2 * p2 + t**3 * p3
    diffs = np.diff(pts, axis=0)
    dists = np.linalg.norm(diffs, axis=1)
    cum_dist = np.concatenate(([0.0], np.cumsum(dists)))
    return pts, cum_dist, float(cum_dist[-1])


def sample_curve_at_distance(pts: np.ndarray, cum_dist: np.ndarray, total_len: float, s: float) -> Tuple[np.ndarray, float]:
    """Samples coordinates and tangent angle (in degrees) along a curve at arc-length distance s."""
    s = np.clip(s, 0.0, total_len)
    idx = int(np.searchsorted(cum_dist, s))
    if idx <= 0:
        p = pts[0]
        tan_vec = pts[1] - pts[0] if len(pts) > 1 else np.array([1.0, 0.0])
    elif idx >= len(pts):
        p = pts[-1]
        tan_vec = pts[-1] - pts[-2] if len(pts) > 1 else np.array([1.0, 0.0])
    else:
        s0, s1 = cum_dist[idx - 1], cum_dist[idx]
        factor = (s - s0) / (s1 - s0 + 1e-8)
        p = pts[idx - 1] + factor * (pts[idx] - pts[idx - 1])
        tan_vec = pts[idx] - pts[idx - 1]

    angle_deg = math.degrees(math.atan2(tan_vec[1], tan_vec[0]))
    return p, angle_deg


class OccupancyGrid:
    """Spatial 2D boolean grid to guarantee zero text collisions on free-placement layers."""
    def __init__(self, width: int, height: int, cell_size: int = 16):
        self.cell_size = cell_size
        self.cols = max(1, width // cell_size + 1)
        self.rows = max(1, height // cell_size + 1)
        self.grid = np.zeros((self.rows, self.cols), dtype=bool)

    def is_occupied(self, x: float, y: float, w: float, h: float) -> bool:
        c0 = max(0, int((x - w * 0.5) / self.cell_size))
        c1 = min(self.cols, int((x + w * 0.5) / self.cell_size) + 1)
        r0 = max(0, int((y - h * 0.5) / self.cell_size))
        r1 = min(self.rows, int((y + h * 0.5) / self.cell_size) + 1)
        if c0 >= c1 or r0 >= r1:
            return False
        return bool(np.any(self.grid[r0:r1, c0:c1]))

    def occupy(self, x: float, y: float, w: float, h: float):
        c0 = max(0, int((x - w * 0.5) / self.cell_size))
        c1 = min(self.cols, int((x + w * 0.5) / self.cell_size) + 1)
        r0 = max(0, int((y - h * 0.5) / self.cell_size))
        r1 = min(self.rows, int((y + h * 0.5) / self.cell_size) + 1)
        if c0 < c1 and r0 < r1:
            self.grid[r0:r1, c0:c1] = True


# =============================================================================
# 5. EYE ANATOMY MODEL AND SEEDED ASYMMETRY
# =============================================================================
class EyeModel:
    """Parametric model for a single eye with organic seeded asymmetry."""
    def __init__(self, is_left: bool, seed: int):
        self.is_left = is_left
        rng = random.Random(seed + (101 if is_left else 202))

        # Asymmetry factors
        self.scale = rng.uniform(ASYMMETRY_SCALE_MIN, ASYMMETRY_SCALE_MAX)
        self.tilt_deg = CANTHAL_TILT_DEG * (-1.0 if is_left else 1.0) + rng.uniform(-0.5, 0.5)
        self.lid_height_mult = rng.uniform(0.96, 1.04)
        self.iris_tone_offset = rng.randint(-6, 6)

        # Baseline dimensions (in normalized scene units U)
        self.center_x = (-EYE_SPACING_U if is_left else EYE_SPACING_U)
        self.center_y = 0.0
        self.half_width = ALMOND_HALF_WIDTH_U * self.scale
        self.upper_height = UPPER_LID_HEIGHT_U * self.scale * self.lid_height_mult
        self.lower_height = LOWER_LID_HEIGHT_U * self.scale * self.lid_height_mult
        self.iris_radius = IRIS_RADIUS_U * self.scale
        self.pupil_radius_min = self.iris_radius * PUPIL_RADIUS_MIN_RATIO
        self.pupil_radius_max = self.iris_radius * PUPIL_RADIUS_MAX_RATIO

    def get_eyelid_curves(self, blink_progress: float = 0.0) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculates upper and lower eyelid curves for the given blink progress (0.0=open, 1.0=closed).
        Left eye (at -0.46U): nasal corner at +half_width, temporal at -half_width (tilted up).
        Right eye (at +0.46U): nasal corner at -half_width, temporal at +half_width (tilted up).
        """
        tilt_rad = math.radians(abs(self.tilt_deg))
        tilt_dy = self.half_width * math.sin(tilt_rad)

        # Inner (nasal) and outer (temporal) corners
        if self.is_left:
            p_inner = np.array([self.half_width, 0.0])
            p_outer = np.array([-self.half_width, tilt_dy])
        else:
            p_inner = np.array([-self.half_width, 0.0])
            p_outer = np.array([self.half_width, tilt_dy])

        # Blink movement: upper lid travels down fully; lower lid rises 20%
        meet_y = -self.lower_height * LOWER_LID_RISE_RATIO
        curr_upper_h = self.upper_height * (1.0 - blink_progress) + meet_y * blink_progress
        curr_lower_h = -self.lower_height * (1.0 - blink_progress) + meet_y * blink_progress

        # Upper lid cubic Bezier
        apex_upper = np.array([0.0, curr_upper_h])
        p0 = p_inner
        p1 = p_inner * 0.5 + apex_upper * 0.5 + np.array([0.0, curr_upper_h * 0.25])
        p2 = apex_upper + (p_inner - apex_upper) * 0.25
        p3 = apex_upper
        pts_up1, _, _ = sample_cubic_bezier(p0, p1, p2, p3, n=80)

        p4 = apex_upper + (p_outer - apex_upper) * 0.25
        p5 = p_outer * 0.5 + apex_upper * 0.5 + np.array([0.0, curr_upper_h * 0.20])
        p6 = p_outer
        pts_up2, _, _ = sample_cubic_bezier(p3, p4, p5, p6, n=80)
        upper_curve = np.vstack([pts_up1[:-1], pts_up2])

        # Lower lid cubic Bezier
        apex_lower = np.array([0.0, curr_lower_h])
        q0 = p_inner
        q1 = p_inner * 0.5 + apex_lower * 0.5 + np.array([0.0, curr_lower_h * 0.25])
        q2 = apex_lower + (p_inner - apex_lower) * 0.25
        q3 = apex_lower
        pts_dn1, _, _ = sample_cubic_bezier(q0, q1, q2, q3, n=80)

        q4 = apex_lower + (p_outer - apex_lower) * 0.25
        q5 = p_outer * 0.5 + apex_lower * 0.5 + np.array([0.0, curr_lower_h * 0.20])
        q6 = p_outer
        pts_dn2, _, _ = sample_cubic_bezier(q3, q4, q5, q6, n=80)
        lower_curve = np.vstack([pts_dn1[:-1], pts_dn2])

        return upper_curve, lower_curve


# =============================================================================
# 6. TEXT ELEMENT DRAW LIST AND LAYOUT BUILDER
# =============================================================================
class TextElement:
    """Represents a single positioned word or letter with role and palette index."""
    __slots__ = ("text", "voice", "size_px", "x", "y", "angle_deg", "role", "gray_idx", "alpha")
    def __init__(
        self,
        text: str,
        voice: str,
        size_px: int,
        x: float,
        y: float,
        angle_deg: float,
        role: str,
        gray_idx: int,
        alpha: int = 255
    ):
        self.text = text
        self.voice = voice
        self.size_px = max(8, int(round(size_px)))
        self.x = x
        self.y = y
        self.angle_deg = angle_deg
        self.role = role
        self.gray_idx = max(0, min(255, int(gray_idx)))
        self.alpha = max(0, min(255, int(alpha)))


class LayoutBuilder:
    """Generates complete typographic layouts for background, halo, brows, and both eyes."""
    def __init__(self, quotes: Dict[str, List[str]], seed: int, quality: str = "medium"):
        self.quotes = quotes
        self.seed = seed
        self.quality = quality
        self.density = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["medium"])["density"]
        self.rng = random.Random(seed)

    def _get_quote(self, role: str) -> str:
        pool = self.quotes.get(role, self.quotes["whispers"])
        return self.rng.choice(pool)

    def _get_words(self, role: str, count: int) -> List[str]:
        words = []
        while len(words) < count:
            q = self._get_quote(role)
            words.extend(q.split())
        return words[:count]

    def build_layout(self, u_px: float) -> Dict[str, Any]:
        """
        Constructs all static and dynamic layer draw lists scaled to current unit size U.
        Returns a structured dictionary of elements.
        """
        layout = {
            "u_px": u_px,
            "seed": self.seed,
            "static_layers": {
                "background": [],
                "halo": [],
                "brows": [],
                "left_sclera": [],
                "right_sclera": [],
                "left_iris": [],
                "right_iris": [],
                "left_pupil": [],
                "right_pupil": [],
                "left_glints": [],
                "right_glints": [],
                "left_caruncle": [],
                "right_caruncle": [],
            },
            "dynamic_templates": {
                "left_lids": [],
                "right_lids": [],
                "left_lashes": [],
                "right_lashes": [],
            },
            "eyes": {
                "left": EyeModel(is_left=True, seed=self.seed),
                "right": EyeModel(is_left=False, seed=self.seed),
            }
        }

        # 1. Background Atmosphere: Poisson-disk whispers + drifting giant quotes
        self._build_background(layout, u_px)

        # 2. Halo and Bridging Contour Threads
        self._build_halo(layout, u_px)

        # 3. Eyebrows (Thick tapered arches)
        self._build_brows(layout, u_px)

        # 4. Sclera, Iris, Pupil, Glints, and Caruncle for each eye
        for eye_key in ("left", "right"):
            eye: EyeModel = layout["eyes"][eye_key]
            self._build_eye_static_elements(layout, eye, eye_key, u_px)

        return layout

    def _build_background(self, layout: Dict[str, Any], u_px: float):
        """Builds faint whisper words and deep quotes drifting in background."""
        elements = layout["static_layers"]["background"]
        occ = OccupancyGrid(int(u_px * 2.8), int(u_px * 1.6), cell_size=20)
        n_whispers = int(140 * self.density)

        # Center clearance: avoid placing inside eyes
        for _ in range(n_whispers * 3):
            if len(elements) >= n_whispers:
                break
            x = self.rng.uniform(-u_px * 1.3, u_px * 1.3)
            y = self.rng.uniform(-u_px * 0.7, u_px * 0.7)

            # Avoid eye almonds
            d_left = math.hypot(x - (-EYE_SPACING_U * u_px), y)
            d_right = math.hypot(x - (EYE_SPACING_U * u_px), y)
            if d_left < u_px * 0.42 or d_right < u_px * 0.42:
                continue

            # Density falloff toward outer edges
            dist_norm = math.hypot(x / (u_px * 1.3), y / (u_px * 0.7))
            if self.rng.random() < dist_norm * 0.45:
                continue

            word = self.rng.choice(self.quotes["whispers"])
            font_size = int(round(12 * (u_px / 1080.0) * self.rng.uniform(0.85, 1.25)))
            font_size = max(9, font_size)
            w_est = len(word) * font_size * 0.65
            h_est = font_size * 1.2

            if not occ.is_occupied(x + u_px * 1.4, y + u_px * 0.8, w_est, h_est):
                occ.occupy(x + u_px * 1.4, y + u_px * 0.8, w_est, h_est)
                rot = self.rng.uniform(-12.0, 12.0)
                alpha = int(self.rng.uniform(35, 75))
                elements.append(TextElement(word, "italic", font_size, x, y, rot, "whispers", self.rng.randint(60, 180), alpha))

    def _build_halo(self, layout: Dict[str, Any], u_px: float):
        """Concentric contour rings around the almond shape and bridging nasal threads."""
        elements = layout["static_layers"]["halo"]
        for eye_key in ("left", "right"):
            eye: EyeModel = layout["eyes"][eye_key]
            cx = eye.center_x * u_px
            cy = eye.center_y * u_px
            tilt_rad = math.radians(eye.tilt_deg)
            cos_t, sin_t = math.cos(tilt_rad), math.sin(tilt_rad)

            # 3 contour rings snugly framing each almond like a topographic elevation map
            n_rings = 3
            for ring_idx in range(n_rings):
                ring_scale = 1.06 + ring_idx * 0.05
                hw = eye.half_width * u_px * ring_scale
                hh_up = eye.upper_height * u_px * ring_scale
                hh_dn = eye.lower_height * u_px * ring_scale
                perimeter = math.pi * (2 * hw + hh_up + hh_dn)

                words = self._get_words("halo", max(5, int(perimeter / 68)))
                font_size = max(9, int(round(11 * (u_px / 1080.0) * (1.0 + ring_idx * 0.08))))
                step_theta = 2.0 * math.pi / max(1, len(words))

                for i, word in enumerate(words):
                    theta = i * step_theta + ring_idx * 0.35
                    cur_hh = hh_up if math.sin(theta) >= 0 else hh_dn
                    lx = hw * math.cos(theta)
                    ly = cur_hh * math.sin(theta)

                    rx = lx * cos_t - ly * sin_t
                    ry = lx * sin_t + ly * cos_t

                    tangent_deg = math.degrees(math.atan2(-cur_hh * math.cos(theta), -hw * math.sin(theta))) + eye.tilt_deg
                    alpha = max(18, int(round(115 * (1.0 - ring_idx * 0.28))))
                    elements.append(TextElement(word, "regular", font_size, cx + rx, cy - ry, tangent_deg, "halo", 80 + ring_idx * 30, alpha))

        # Bridging nasal threads between the eyes
        n_bridge = int(8 * self.density)
        bridge_words = self._get_words("halo", n_bridge)
        for i, word in enumerate(bridge_words):
            t_frac = (i + 1) / float(n_bridge + 1)
            # Bridge the gap between left eye nasal canthus and right eye nasal canthus
            x = (-0.12 + t_frac * 0.24) * u_px
            y = -math.sin(t_frac * math.pi) * u_px * 0.03
            font_size = max(8, int(round(10 * (u_px / 1080.0))))
            elements.append(TextElement(word, "italic", font_size, x, y, 0.0, "halo", 115, 65))

    def _build_brows(self, layout: Dict[str, Any], u_px: float):
        """Thick, tapered arches of 4 to 6 rows of text following a curve above each eye."""
        elements = layout["static_layers"]["brows"]
        for eye_key in ("left", "right"):
            eye: EyeModel = layout["eyes"][eye_key]
            cx = eye.center_x * u_px
            cy = eye.center_y * u_px
            is_l = eye.is_left

            arch_span = eye.half_width * u_px * 1.15
            arch_lift = eye.upper_height * u_px * 1.65

            n_rows = 5
            for row in range(n_rows):
                row_offset_y = (row - 2) * (10 * (u_px / 1080.0))
                # Left eye: nasal head is at +x (towards center), temple tail at -x
                # Right eye: nasal head is at -x (towards center), temple tail at +x
                if is_l:
                    p0 = np.array([arch_span * 0.90, arch_lift * 0.72 + row_offset_y])
                    p1 = np.array([arch_span * 0.20, arch_lift * 1.30 + row_offset_y])
                    p2 = np.array([-arch_span * 0.30, arch_lift * 1.32 + row_offset_y])
                    p3 = np.array([-arch_span * 1.15, arch_lift * 0.50 + row_offset_y])
                else:
                    p0 = np.array([-arch_span * 0.90, arch_lift * 0.72 + row_offset_y])
                    p1 = np.array([-arch_span * 0.20, arch_lift * 1.30 + row_offset_y])
                    p2 = np.array([arch_span * 0.30, arch_lift * 1.32 + row_offset_y])
                    p3 = np.array([arch_span * 1.15, arch_lift * 0.50 + row_offset_y])

                pts, cum_d, total_len = sample_cubic_bezier(p0, p1, p2, p3, n=80)
                words = self._get_words("brows", max(4, int(total_len / 50)))

                curr_s = total_len * 0.05
                for word in words:
                    if curr_s >= total_len * 0.95:
                        break
                    pt, angle = sample_curve_at_distance(pts, cum_d, total_len, curr_s)
                    dist_mid = abs(curr_s - total_len * 0.5) / (total_len * 0.5)
                    size_mult = (1.25 - dist_mid * 0.35) * (1.1 if row in (1, 2) else 0.9)
                    font_size = max(9, int(round(12 * (u_px / 1080.0) * size_mult)))
                    advance = len(word) * font_size * 0.62 + 7

                    elements.append(TextElement(
                        word, "regular", font_size,
                        cx + pt[0], cy - pt[1], angle,
                        "brows", 100 + row * 25, 220 - int(dist_mid * 60)
                    ))
                    curr_s += advance

    def _build_eye_static_elements(self, layout: Dict[str, Any], eye: EyeModel, eye_key: str, u_px: float):
        """Constructs sclera, 4-tier iris, pupil disc, glints, and caruncle for one eye."""
        r_iris = eye.iris_radius * u_px
        r_pupil_min = eye.pupil_radius_min * u_px
        r_pupil_max = eye.pupil_radius_max * u_px

        # --- A. SCLERA TEXT CURVES ---
        sclera_list = layout["static_layers"][f"{eye_key}_sclera"]
        hw = eye.half_width * u_px * 0.95
        hh_up = eye.upper_height * u_px * 0.90
        hh_dn = eye.lower_height * u_px * 0.90

        n_sclera_rows = int(9 * self.density)
        for r_idx in range(n_sclera_rows):
            y_frac = (r_idx - n_sclera_rows // 2) / float(n_sclera_rows // 2 + 1)
            y_pos = y_frac * (hh_up if y_frac >= 0 else hh_dn)
            # Elliptic width at this height
            w_at_y = hw * math.sqrt(max(0.04, 1.0 - (y_pos / (hh_up if y_pos >= 0 else hh_dn))**2))

            words = self._get_words("sclera", int(w_at_y * 2 / 50))
            curr_x = -w_at_y * 0.92
            for word in words:
                if curr_x >= w_at_y * 0.92:
                    break
                font_size = max(8, int(round(10 * (u_px / 1080.0))))
                adv = len(word) * font_size * 0.60 + 7
                # Darken slightly toward outer corners
                corner_dist = abs(curr_x) / hw
                gray_idx = int(round(190 - corner_dist * 80))
                alpha = int(round(160 - corner_dist * 50))
                sclera_list.append(TextElement(word, "regular", font_size, curr_x, y_pos, 0.0, "sclera", gray_idx, alpha))
                curr_x += adv

        # --- B. IRIS (4 SUB-LAYERS) ---
        iris_list = layout["static_layers"][f"{eye_key}_iris"]

        # Sub-layer 1: Concentric rings of words along circular arcs (continuous reading)
        n_rings = int(7 * self.density)
        for ring_idx in range(n_rings):
            frac = ring_idx / float(max(1, n_rings - 1))
            ring_r = r_pupil_min * 1.05 + frac * (r_iris - r_pupil_min * 1.05)
            circ = 2.0 * math.pi * ring_r
            words = self._get_words("iris", int(circ / 42))
            font_size = max(8, int(round((11 + frac * 2) * (u_px / 1080.0))))

            step_rad = 2.0 * math.pi / max(1, len(words))
            for i, word in enumerate(words):
                theta = i * step_rad + ring_idx * 0.45
                x = ring_r * math.cos(theta)
                y = ring_r * math.sin(theta)
                tangent_deg = math.degrees(theta + math.pi * 0.5)
                # Stamped palette index: gradient from inner warm to outer deep
                gray_val = int(round(frac * 210 + eye.iris_tone_offset))
                iris_list.append(TextElement(word, "regular", font_size, x, y, tangent_deg, "iris", gray_val, 235))

        # Sub-layer 2: Radial Spokes (words oriented outward from pupil at irregular angles)
        n_spokes = int(24 * self.density)
        spoke_words = self._get_words("iris", n_spokes)
        for i, word in enumerate(spoke_words):
            phi = (i / float(n_spokes)) * 2.0 * math.pi + self.rng.uniform(-0.06, 0.06)
            mid_r = (r_pupil_min + r_iris) * 0.52 + self.rng.uniform(-r_iris * 0.08, r_iris * 0.08)
            x = mid_r * math.cos(phi)
            y = mid_r * math.sin(phi)
            outward_deg = math.degrees(phi)
            font_size = max(8, int(round(10 * (u_px / 1080.0))))
            iris_list.append(TextElement(word, "italic", font_size, x, y, outward_deg, "iris", self.rng.randint(70, 160), 190))

        # Sub-layer 3: Collarette Ring (warmer, jagged ring near pupil)
        n_coll = int(14 * self.density)
        coll_words = self._get_words("iris", n_coll)
        r_coll_base = r_pupil_min * 1.35
        for i, word in enumerate(coll_words):
            theta = (i / float(n_coll)) * 2.0 * math.pi
            r_jitter = r_coll_base + (math.sin(theta * 6.0) * r_pupil_min * 0.14)
            x = r_jitter * math.cos(theta)
            y = r_jitter * math.sin(theta)
            font_size = max(8, int(round(9 * (u_px / 1080.0))))
            iris_list.append(TextElement(word, "bold", font_size, x, y, math.degrees(theta + math.pi * 0.5), "iris", 25, 245))

        # Sub-layer 4: Limbal Ring (dark, dense rim of small text at outer boundary)
        n_limbal = int(32 * self.density)
        limbal_words = self._get_words("iris", n_limbal)
        for i, word in enumerate(limbal_words):
            theta = (i / float(n_limbal)) * 2.0 * math.pi
            x = r_iris * 0.98 * math.cos(theta)
            y = r_iris * 0.98 * math.sin(theta)
            font_size = max(8, int(round(9 * (u_px / 1080.0))))
            iris_list.append(TextElement(word, "regular", font_size, x, y, math.degrees(theta + math.pi * 0.5), "iris", 235, 255))

        # --- C. PUPIL: TIGHTLY PACKED DEEP ABYSS DISK ---
        pupil_list = layout["static_layers"][f"{eye_key}_pupil"]
        # Packed in 3 tight concentric circles up to max pupil radius
        for p_ring in range(3):
            p_rad = r_pupil_max * (0.35 + p_ring * 0.30)
            circ = 2.0 * math.pi * p_rad
            p_words = self._get_words("pupil", max(4, int(circ / 36)))
            step_rad = 2.0 * math.pi / max(1, len(p_words))
            font_size = max(8, int(round(11 * (u_px / 1080.0))))
            for i, word in enumerate(p_words):
                theta = i * step_rad + p_ring * 0.5
                x = p_rad * math.cos(theta)
                y = p_rad * math.sin(theta)
                pupil_list.append(TextElement(word, "bold", font_size, x, y, math.degrees(theta + math.pi * 0.5), "pupil", p_ring * 60 + 30, 255))

        # Central abyss anchor word
        core_word = self.rng.choice(["abyss", "void", "core", "deep"])
        font_size = max(9, int(round(12 * (u_px / 1080.0))))
        pupil_list.append(TextElement(core_word, "bold", font_size, 0.0, 0.0, 0.0, "pupil", 240, 255))

        # --- D. GLINTS (TWO SPECULAR HIGHLIGHTS) ---
        glints_list = layout["static_layers"][f"{eye_key}_glints"]
        # Primary highlight (upper-left light source)
        gx1, gy1 = -r_iris * 0.42, -r_iris * 0.42
        font_size_g1 = max(8, int(round(11 * (u_px / 1080.0))))
        glints_list.append(TextElement("lux", "bold", font_size_g1, gx1, gy1, -15.0, "glint", 10, 255))
        glints_list.append(TextElement("luz", "regular", font_size_g1 - 2, gx1 + 6, gy1 - 6, -15.0, "glint", 40, 240))

        # Secondary softer specular highlight
        gx2, gy2 = r_iris * 0.35, r_iris * 0.32
        font_size_g2 = max(8, int(round(9 * (u_px / 1080.0))))
        glints_list.append(TextElement("light", "italic", font_size_g2, gx2, gy2, 35.0, "glint", 80, 180))

        # --- E. CARUNCLE (INNER CANTHUS DETAIL) ---
        caruncle_list = layout["static_layers"][f"{eye_key}_caruncle"]
        canthus_x = -hw if eye.is_left else hw
        car_words = self.quotes["caruncle"][:4]
        for idx, c_word in enumerate(car_words):
            dx = (idx * 5 + 3) * (1.0 if eye.is_left else -1.0)
            dy = (idx % 2 * 4 - 2)
            font_size_c = max(8, int(round(8 * (u_px / 1080.0))))
            caruncle_list.append(TextElement(c_word, "italic", font_size_c, canthus_x + dx, dy, 0.0, "accent", 60 + idx * 40, 230))


# =============================================================================
# 7. TIME-SLICED LAYER BAKER AND THEME COLORIZER
# =============================================================================
class Baker:
    """
    Renders draw lists into high-resolution grayscale-index Surfaces,
    and applies 256-entry NumPy LUTs to colorize without re-rasterizing text.
    """
    def __init__(self, sprite_cache: SpriteCache, quality: str = "medium"):
        self.sprite_cache = sprite_cache
        self.quality = quality
        self.bake_scale = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["medium"])["bake_scale"]

    def bake_layer_grayscale(
        self,
        elements: List[TextElement],
        width: int,
        height: int,
        origin_x: float,
        origin_y: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Bakes text elements into two (H, W) uint8 NumPy arrays:
        gray_indices (0-255) and alpha_mask (0-255).
        """
        w_scaled = int(round(width * self.bake_scale))
        h_scaled = int(round(height * self.bake_scale))
        gray_arr = np.zeros((h_scaled, w_scaled), dtype=np.uint8)
        alpha_arr = np.zeros((h_scaled, w_scaled), dtype=np.uint8)

        # Pygame surface for rapid sub-pixel blitting
        surf = pygame.Surface((w_scaled, h_scaled), pygame.SRCALPHA)

        for el in elements:
            size_scaled = int(round(el.size_px * self.bake_scale))
            sprite = self.sprite_cache.get_rotated_sprite(el.text, el.voice, size_scaled, el.angle_deg)
            sw, sh = sprite.get_size()
            px = int(round((el.x + origin_x) * self.bake_scale - sw * 0.5))
            py = int(round((el.y + origin_y) * self.bake_scale - sh * 0.5))

            if px + sw <= 0 or px >= w_scaled or py + sh <= 0 or py >= h_scaled:
                continue

            # Tint sprite with gray_idx and alpha
            tinted = sprite.copy()
            # Stamped gray intensity in RGB channels
            tinted.fill((el.gray_idx, el.gray_idx, el.gray_idx, 255), special_flags=pygame.BLEND_RGB_MULT)
            if el.alpha < 255:
                tinted.set_alpha(el.alpha)
            surf.blit(tinted, (px, py))

        # Extract buffers into NumPy
        raw = pygame.image.tobytes(surf, "RGBA")
        rgba = np.frombuffer(raw, dtype=np.uint8).reshape((h_scaled, w_scaled, 4))
        gray_arr = rgba[..., 0].copy() # Red channel contains stamped gray_idx
        alpha_arr = rgba[..., 3].copy()
        return gray_arr, alpha_arr

    def colorize_layer(self, gray_arr: np.ndarray, alpha_arr: np.ndarray, lut: np.ndarray) -> pygame.Surface:
        """Applies a (256, 3) theme LUT to the grayscale index layer in ~3 ms using NumPy."""
        h, w = gray_arr.shape
        rgba = np.empty((h, w, 4), dtype=np.uint8)
        rgba[..., :3] = lut[gray_arr]
        rgba[..., 3] = alpha_arr
        return pygame.image.frombuffer(rgba.tobytes(), (w, h), "RGBA")


# =============================================================================
# 8. CONTROLLERS: BLINK, GAZE (SPRING PHYSICS), PUPIL, AND CAMERA
# =============================================================================
class BlinkController:
    """Natural, organic blink generator with double blinks and eye offsets."""
    def __init__(self, seed: int):
        self.rng = random.Random(seed + 999)
        self.left_timer = self.rng.uniform(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX)
        self.right_timer = self.left_timer + EYE_BLINK_OFFSET_SEC
        self.left_progress = 0.0
        self.right_progress = 0.0
        self._left_state = "idle" # idle, closing, holding, opening
        self._right_state = "idle"
        self._state_t_left = 0.0
        self._state_t_right = 0.0

    def trigger_blink_now(self):
        """Forces an immediate natural blink on both eyes."""
        self._left_state = "closing"
        self._state_t_left = 0.0
        self._right_state = "closing"
        self._state_t_right = -EYE_BLINK_OFFSET_SEC

    def update(self, dt: float):
        # Update Left Eye Blink State Machine
        self.left_progress = self._update_eye_blink("left", dt)
        self.right_progress = self._update_eye_blink("right", dt)

    def _update_eye_blink(self, eye: str, dt: float) -> float:
        state = getattr(self, f"_{eye}_state")
        t = getattr(self, f"_state_t_{eye}") + dt
        setattr(self, f"_state_t_{eye}", t)

        if state == "idle":
            timer = getattr(self, f"{eye}_timer") - dt
            setattr(self, f"{eye}_timer", timer)
            if timer <= 0.0:
                setattr(self, f"_{eye}_state", "closing")
                setattr(self, f"_state_t_{eye}", 0.0)
            return 0.0

        elif state == "closing":
            if t < 0.0:
                return 0.0 # Waiting for offset
            frac = min(1.0, t / BLINK_CLOSE_DURATION)
            # Ease-in: quadratic acceleration
            prog = frac * frac
            if frac >= 1.0:
                setattr(self, f"_{eye}_state", "holding")
                setattr(self, f"_state_t_{eye}", 0.0)
            return prog

        elif state == "holding":
            if t >= BLINK_HOLD_DURATION:
                setattr(self, f"_{eye}_state", "opening")
                setattr(self, f"_state_t_{eye}", 0.0)
            return 1.0

        elif state == "opening":
            frac = min(1.0, t / BLINK_OPEN_DURATION)
            # Ease-out: cubic deceleration
            prog = 1.0 - (1.0 - (1.0 - frac)**3)
            if frac >= 1.0:
                setattr(self, f"_{eye}_state", "idle")
                setattr(self, f"_state_t_{eye}", 0.0)
                # Next random interval with double blink check
                if self.rng.random() < DOUBLE_BLINK_CHANCE:
                    interval = self.rng.uniform(0.12, 0.28)
                else:
                    interval = self.rng.uniform(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX)
                setattr(self, f"{eye}_timer", interval)
            return prog

        return 0.0


class GazeController:
    """Critically damped spring tracking mouse cursor with parallax and micro-saccades."""
    def __init__(self):
        self.gaze_x = 0.0
        self.gaze_y = 0.0
        self.vel_x = 0.0
        self.vel_y = 0.0
        self.idle_timer = 0.0
        self.saccade_target_x = 0.0
        self.saccade_target_y = 0.0
        self.saccade_timer = 0.0
        self.rng = random.Random(42)

    def update(self, dt: float, target_norm_x: float, target_norm_y: float, mouse_moved: bool, enabled: bool = True):
        if not enabled:
            target_norm_x = 0.0
            target_norm_y = 0.0

        if mouse_moved:
            self.idle_timer = 0.0
        else:
            self.idle_timer += dt

        # Micro-saccades and natural wandering if idle > 4.0s
        if self.idle_timer > MOUSE_IDLE_TIMEOUT:
            self.saccade_timer -= dt
            if self.saccade_timer <= 0.0:
                self.saccade_target_x = self.rng.uniform(-0.5, 0.5)
                self.saccade_target_y = self.rng.uniform(-0.35, 0.35)
                self.saccade_timer = self.rng.uniform(0.8, 2.5)
            # Blend idle drift into target
            target_norm_x = self.saccade_target_x
            target_norm_y = self.saccade_target_y

        # Critically damped spring simulation: F = -K*x - D*v
        dx = target_norm_x - self.gaze_x
        dy = target_norm_y - self.gaze_y
        ax = GAZE_SPRING_K * dx - GAZE_SPRING_DAMP * self.vel_x
        ay = GAZE_SPRING_K * dy - GAZE_SPRING_DAMP * self.vel_y

        self.vel_x += ax * dt
        self.vel_y += ay * dt
        self.gaze_x += self.vel_x * dt
        self.gaze_y += self.vel_y * dt

        # Clamp travel
        dist = math.hypot(self.gaze_x, self.gaze_y)
        if dist > 1.0:
            self.gaze_x /= dist
            self.gaze_y /= dist


class PupilController:
    """Controls dynamic pupil dilation responding to gaze distance, light, and focus."""
    def __init__(self):
        self.dilation: Dict[str, float] = {"left": 0.5, "right": 0.5} # 0.0 (constricted) to 1.0 (dilated)
        self.target_dilation: float = 0.5

    def update(self, dt: float, mouse_dist_norm: float, is_idle: bool):
        """
        Dilates pupil when cursor is close to the eyes (near focus/low light),
        constricts when cursor is far away or during fast shifts.
        """
        if is_idle:
            self.target_dilation = 0.45 + 0.15 * math.sin(time.time() * 1.5)
        else:
            self.target_dilation = float(np.clip(1.0 - mouse_dist_norm * 0.75, 0.15, 1.0))

        rate = min(1.0, dt * 4.5)
        for eye in ["left", "right"]:
            self.dilation[eye] += (self.target_dilation - self.dilation[eye]) * rate

    def get_scale(self, eye_key: str) -> float:
        """Returns relative radius scaling factor between min and max pupil radius."""
        min_factor = PUPIL_RADIUS_MIN_RATIO / PUPIL_RADIUS_MAX_RATIO
        d = self.dilation.get(eye_key, 0.5)
        return min_factor + (1.0 - min_factor) * d


class CameraController:
    """Cinematic auto-zoom timeline with Lissajous pan drift and manual zoom overrides."""
    def __init__(self):
        self.auto_zoom_enabled = True
        self.timeline_time = 0.0
        self.zoom = 1.0
        self.target_zoom = 1.0
        self.pan_x = 0.0
        self.pan_y = 0.0

    def toggle_auto_zoom(self) -> bool:
        self.auto_zoom_enabled = not self.auto_zoom_enabled
        if not self.auto_zoom_enabled:
            self.target_zoom = self.zoom
        return self.auto_zoom_enabled

    def manual_zoom_delta(self, delta: float):
        self.auto_zoom_enabled = False
        self.target_zoom = max(0.85, min(3.5, self.target_zoom + delta))

    def reset_zoom(self):
        self.target_zoom = 1.0

    def update(self, dt: float, mouse_norm_x: float, mouse_norm_y: float):
        if self.auto_zoom_enabled:
            self.timeline_time = (self.timeline_time + dt) % ZOOM_TIMELINE_CYCLE
            t = self.timeline_time

            # Keyframed cinematic narrative timeline
            # 0-5s: Wide shot | 5-12s: Push Left Eye | 12-15s: Hold | 15-20s: Pull Back | 20-27s: Push Right Eye | 27-32s: Pull Back
            if t < 5.0:
                target_z = 1.0
                target_px = 0.0
            elif t < 12.0:
                s = (t - 5.0) / 7.0
                eased = s * s * (3.0 - 2.0 * s) # smootherstep
                target_z = 1.0 + eased * (MAX_AUTO_ZOOM - 1.0)
                target_px = -EYE_SPACING_U * eased * 0.95
            elif t < 15.0:
                target_z = MAX_AUTO_ZOOM
                target_px = -EYE_SPACING_U * 0.95
            elif t < 20.0:
                s = (t - 15.0) / 5.0
                eased = s * s * (3.0 - 2.0 * s)
                target_z = MAX_AUTO_ZOOM - eased * (MAX_AUTO_ZOOM - 1.0)
                target_px = -EYE_SPACING_U * 0.95 * (1.0 - eased)
            elif t < 27.0:
                s = (t - 20.0) / 7.0
                eased = s * s * (3.0 - 2.0 * s)
                target_z = 1.0 + eased * (MAX_AUTO_ZOOM - 1.0)
                target_px = EYE_SPACING_U * eased * 0.95
            elif t < 29.5:
                target_z = MAX_AUTO_ZOOM
                target_px = EYE_SPACING_U * 0.95
            else:
                s = (t - 29.5) / 2.5
                eased = s * s * (3.0 - 2.0 * s)
                target_z = MAX_AUTO_ZOOM - eased * (MAX_AUTO_ZOOM - 1.0)
                target_px = EYE_SPACING_U * 0.95 * (1.0 - eased)

            # Add breathing and Lissajous drift
            breathe = 1.0 + BREATHING_ZOOM_AMPLITUDE * math.sin(t * 0.8)
            self.target_zoom = target_z * breathe
            drift_x = LISSAJOUS_PAN_AMPLITUDE * math.cos(t * 0.35)
            drift_y = LISSAJOUS_PAN_AMPLITUDE * 0.7 * math.sin(t * 0.52)
            self.pan_x = target_px + drift_x + mouse_norm_x * 0.015
            self.pan_y = drift_y + mouse_norm_y * 0.015
        else:
            self.pan_x = mouse_norm_x * 0.02
            self.pan_y = mouse_norm_y * 0.02

        # Smooth camera inertia
        self.zoom += (self.target_zoom - self.zoom) * min(1.0, dt * 4.5)


# =============================================================================
# 9. POST-PROCESSING FX (VIGNETTE, CHEAP BLOOM, FILM GRAIN)
# =============================================================================
class PostFX:
    """Screen-space post-processing pipeline for cinematic mood."""
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.enabled = True
        self.vignette_surf = self._create_vignette(width, height)
        self.grain_tex = self._create_grain_tile(256, 256)
        self.grain_offset = 0

    def resize(self, width: int, height: int):
        self.width = width
        self.height = height
        self.vignette_surf = self._create_vignette(width, height)

    def _create_vignette(self, w: int, h: int) -> pygame.Surface:
        """Precomputes a smooth radial vignette mask."""
        surf = pygame.Surface((w, h), pygame.SRCALPHA)
        # Compute radial distance grid
        y, x = np.ogrid[:h, :w]
        cx, cy = w * 0.5, h * 0.5
        max_dist = math.hypot(cx, cy)
        dist = np.hypot(x - cx, y - cy) / max_dist
        # Smoothstep edge darkening
        alpha = np.clip((dist - 0.45) / 0.55, 0.0, 1.0)
        alpha = (alpha * alpha * (3.0 - 2.0 * alpha) * 175.0).astype(np.uint8)

        vignette_arr = np.zeros((h, w, 4), dtype=np.uint8)
        vignette_arr[..., 3] = alpha
        return pygame.image.frombuffer(vignette_arr.tobytes(), (w, h), "RGBA")

    def _create_grain_tile(self, w: int, h: int) -> pygame.Surface:
        """Generates a tileable subtle luminance grain texture without washing out dark tones."""
        rng = np.random.RandomState(1337)
        noise = rng.randint(0, 8, size=(h, w, 3), dtype=np.uint8)
        grain_arr = np.zeros((h, w, 4), dtype=np.uint8)
        grain_arr[..., :3] = noise
        grain_arr[..., 3] = 255
        return pygame.image.frombuffer(grain_arr.tobytes(), (w, h), "RGBA")

    def apply(self, screen: pygame.Surface, quality: str = "medium"):
        if not self.enabled:
            return

        w, h = screen.get_size()
        blur_div = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["medium"])["blur_div"]

        # 1. Cheap Bloom (Extract high luminance highlights -> Downscale -> Upscale -> Additive Blend)
        bright = screen.copy()
        bright.fill((165, 165, 165), special_flags=pygame.BLEND_RGB_SUB)
        small_w = max(32, w // blur_div)
        small_h = max(32, h // blur_div)
        small = pygame.transform.smoothscale(bright, (small_w, small_h))
        bloom = pygame.transform.smoothscale(small, (w, h))
        bloom.set_alpha(120)
        screen.blit(bloom, (0, 0), special_flags=pygame.BLEND_RGB_ADD)

        # 2. Vignette (edge darkening)
        if self.vignette_surf.get_size() == (w, h):
            screen.blit(self.vignette_surf, (0, 0))

        # 3. Animated Film Grain
        gw, gh = self.grain_tex.get_size()
        self.grain_offset = (self.grain_offset + 37) % gw
        for y in range(0, h, gh):
            for x in range(0, w, gw):
                screen.blit(self.grain_tex, (x - self.grain_offset, y - self.grain_offset), special_flags=pygame.BLEND_RGB_ADD)


# =============================================================================
# 10. COMPOSITING RENDERER
# =============================================================================
class EyeRenderer:
    """Assembles layers, renders dynamic lids and lashes, and clips with aperture masks."""
    def __init__(self, sprite_cache: SpriteCache, baker: Baker):
        self.sprite_cache = sprite_cache
        self.baker = baker
        # Baked static colorized surfaces
        self.baked_world: Optional[pygame.Surface] = None
        self.baked_eyeball_left: Optional[pygame.Surface] = None
        self.baked_eyeball_right: Optional[pygame.Surface] = None
        self.mask_surf_left: Optional[pygame.Surface] = None
        self.mask_surf_right: Optional[pygame.Surface] = None

    def bake_static_composition(self, layout: Dict[str, Any], theme: Theme, world_w: int, world_h: int):
        """Bakes all static text layers into colorized surfaces for instantaneous 60 FPS drawing."""
        u_px = layout["u_px"]
        bake_scale = self.baker.bake_scale
        bake_w = int(round(world_w * bake_scale))
        bake_h = int(round(world_h * bake_scale))
        cx = world_w * 0.5
        cy = world_h * 0.5

        # 1. World Canvas (Background + Halo + Brows)
        world = pygame.Surface((bake_w, bake_h))
        self._draw_vertical_gradient(world, theme.bg_top, theme.bg_bottom)

        for layer_name, role in [("background", "whispers"), ("halo", "halo"), ("brows", "brows")]:
            elems = layout["static_layers"][layer_name]
            gray, alpha = self.baker.bake_layer_grayscale(elems, world_w, world_h, cx, cy)
            colored = self.baker.colorize_layer(gray, alpha, theme.luts[role])
            world.blit(colored, (0, 0))
        self.baked_world = world

        # 2. Per-Eye Sub-layers (Sclera, Iris, Pupil, Glints, Caruncle)
        self.baked_sclera = {}
        self.baked_iris = {}
        self.baked_pupil = {}
        self.baked_glints = {}
        self.baked_caruncle = {}
        self.mask_surfs = {}

        for eye_key in ("left", "right"):
            eye: EyeModel = layout["eyes"][eye_key]
            ew = int(round(eye.half_width * u_px * 2.4))
            eh = int(round(eye.upper_height * u_px * 2.6))
            ew_scaled = int(round(ew * bake_scale))
            eh_scaled = int(round(eh * bake_scale))
            ecx, ecy = ew * 0.5, eh * 0.5

            self.mask_surfs[eye_key] = pygame.Surface((ew_scaled, eh_scaled), pygame.SRCALPHA)

            # Sclera
            sclera_elems = layout["static_layers"][f"{eye_key}_sclera"]
            g, a = self.baker.bake_layer_grayscale(sclera_elems, ew, eh, ecx, ecy)
            self.baked_sclera[eye_key] = self.baker.colorize_layer(g, a, theme.luts["sclera"])

            # Iris
            iris_elems = layout["static_layers"][f"{eye_key}_iris"]
            g, a = self.baker.bake_layer_grayscale(iris_elems, ew, eh, ecx, ecy)
            self.baked_iris[eye_key] = self.baker.colorize_layer(g, a, theme.luts["iris"])

            # Pupil (Deep abyss text disc over dark obsidian circle)
            pupil_elems = layout["static_layers"][f"{eye_key}_pupil"]
            g, a = self.baker.bake_layer_grayscale(pupil_elems, ew, eh, ecx, ecy)
            pupil_surf = pygame.Surface((ew_scaled, eh_scaled), pygame.SRCALPHA)
            # Solid dark circle underneath abyss words
            r_pupil_max = int(round(eye.pupil_radius_max * u_px * bake_scale))
            dark_c = theme.stops["pupil"][-1][1]
            pygame.draw.circle(pupil_surf, (dark_c[0], dark_c[1], dark_c[2], 255), (int(round(ecx * bake_scale)), int(round(ecy * bake_scale))), r_pupil_max)
            colored_pupil = self.baker.colorize_layer(g, a, theme.luts["pupil"])
            pupil_surf.blit(colored_pupil, (0, 0))
            self.baked_pupil[eye_key] = pupil_surf

            # Glints
            glint_elems = layout["static_layers"][f"{eye_key}_glints"]
            g, a = self.baker.bake_layer_grayscale(glint_elems, ew, eh, ecx, ecy)
            self.baked_glints[eye_key] = self.baker.colorize_layer(g, a, theme.luts["glint"])

            # Caruncle
            car_elems = layout["static_layers"][f"{eye_key}_caruncle"]
            g, a = self.baker.bake_layer_grayscale(car_elems, ew, eh, ecx, ecy)
            self.baked_caruncle[eye_key] = self.baker.colorize_layer(g, a, theme.luts["accent"])

    def _draw_vertical_gradient(self, surf: pygame.Surface, top_c: Tuple[int, int, int], bot_c: Tuple[int, int, int]):
        w, h = surf.get_size()
        gradient = np.zeros((h, w, 3), dtype=np.uint8)
        for c in range(3):
            gradient[:, :, c] = np.linspace(top_c[c], bot_c[c], h)[:, None]
        pygame.surfarray.blit_array(surf, np.transpose(gradient, (1, 0, 2)))

    def render_frame(
        self,
        dest_surf: pygame.Surface,
        layout: Dict[str, Any],
        theme: Theme,
        gaze: GazeController,
        blink: BlinkController,
        camera: CameraController,
        mouse_pos: Tuple[int, int],
        dt: float,
        pupil: Optional['PupilController'] = None
    ):
        """Draws the complete composition with aperture clipping, gaze shift, and dynamic lids."""
        if self.baked_world is None:
            return

        w, h = dest_surf.get_size()
        world_w, world_h = self.baked_world.get_size()
        bake_scale = self.baker.bake_scale
        u_px_scaled = layout["u_px"] * bake_scale

        # Composite everything into a temporary frame canvas
        frame_canvas = self.baked_world.copy()

        # Render each eye with its current blink aperture mask & gaze offset
        for eye_key, blink_prog in [("left", blink.left_progress), ("right", blink.right_progress)]:
            mask_surf = self.mask_surfs.get(eye_key)
            if mask_surf is None:
                continue

            eye: EyeModel = layout["eyes"][eye_key]
            cx = world_w * 0.5 + eye.center_x * u_px_scaled
            cy = world_h * 0.5 + eye.center_y * u_px_scaled

            # Gaze travel with Bell's phenomenon roll during blink
            max_travel = eye.iris_radius * u_px_scaled * GAZE_MAX_TRAVEL_RATIO
            conv_sign = 1.0 if eye.is_left else -1.0
            gx = (gaze.gaze_x + conv_sign * GAZE_CONVERGENCE_FACTOR) * max_travel
            gy = gaze.gaze_y * max_travel - blink_prog * eye.iris_radius * u_px_scaled * BELLS_PHENOMENON_RATIO

            # 1. Create Aperture Mask (polygon between upper and lower lid curves)
            mask_w, mask_h = mask_surf.get_size()
            mask_cx, mask_cy = mask_w * 0.5, mask_h * 0.5
            mask_surf.fill((0, 0, 0, 0))

            up_curve, dn_curve = eye.get_eyelid_curves(blink_prog)
            poly_pts = []
            for p in up_curve:
                poly_pts.append((int(round(mask_cx + p[0] * u_px_scaled)), int(round(mask_cy - p[1] * u_px_scaled))))
            for p in reversed(dn_curve):
                poly_pts.append((int(round(mask_cx + p[0] * u_px_scaled)), int(round(mask_cy - p[1] * u_px_scaled))))

            if len(poly_pts) >= 3:
                pygame.draw.polygon(mask_surf, (255, 255, 255, 255), poly_pts)

            # 2. Assemble Eyeball Instance with Parallax Shifts
            eyeball_instance = pygame.Surface((mask_w, mask_h), pygame.SRCALPHA)
            # Sclera stays stationary
            eyeball_instance.blit(self.baked_sclera[eye_key], (0, 0))
            # Iris moves with gaze
            eyeball_instance.blit(self.baked_iris[eye_key], (int(round(gx * PARALLAX_IRIS)), int(round(gy * PARALLAX_IRIS))))
            # Pupil moves with slight parallax (1.05) and dynamically dilates
            pupil_surf = self.baked_pupil[eye_key]
            pupil_scale = pupil.get_scale(eye_key) if pupil else 1.0
            if abs(pupil_scale - 1.0) > 0.02:
                pw, ph = pupil_surf.get_size()
                pcx, pcy = pw * 0.5, ph * 0.5
                r_box = int(eye.pupil_radius_max * u_px_scaled * 1.15)
                x0 = max(0, int(pcx - r_box))
                y0 = max(0, int(pcy - r_box))
                x1 = min(pw, int(pcx + r_box))
                y1 = min(ph, int(pcy + r_box))
                box_w = x1 - x0
                box_h = y1 - y0
                if box_w > 4 and box_h > 4:
                    sub = pupil_surf.subsurface((x0, y0, box_w, box_h))
                    scaled_w = max(2, int(round(box_w * pupil_scale)))
                    scaled_h = max(2, int(round(box_h * pupil_scale)))
                    scaled_sub = pygame.transform.smoothscale(sub, (scaled_w, scaled_h))
                    dst_x = int(round(gx * PARALLAX_PUPIL + pcx - scaled_w * 0.5))
                    dst_y = int(round(gy * PARALLAX_PUPIL + pcy - scaled_h * 0.5))
                    eyeball_instance.blit(scaled_sub, (dst_x, dst_y))
                else:
                    eyeball_instance.blit(pupil_surf, (int(round(gx * PARALLAX_PUPIL)), int(round(gy * PARALLAX_PUPIL))))
            else:
                eyeball_instance.blit(pupil_surf, (int(round(gx * PARALLAX_PUPIL)), int(round(gy * PARALLAX_PUPIL))))

            # Glints stay roughly fixed on cornea (parallax 0.30)
            eyeball_instance.blit(self.baked_glints[eye_key], (int(round(gx * PARALLAX_GLINTS)), int(round(gy * PARALLAX_GLINTS))))
            # Caruncle (inner canthus) stays stationary
            eyeball_instance.blit(self.baked_caruncle[eye_key], (0, 0))

            # Apply aperture mask
            eyeball_instance.blit(mask_surf, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)

            # Blit onto world canvas (stationary almond center)
            frame_canvas.blit(eyeball_instance, (int(round(cx - mask_cx)), int(round(cy - mask_cy))))

            # 3. Dynamic Eyelids & Lashes
            self._render_dynamic_lids_and_lashes(frame_canvas, eye, up_curve, dn_curve, cx, cy, u_px_scaled, theme, blink_prog, mouse_pos)

        # Apply Camera Zoom & Pan via Subsurface Crop and Smoothscale
        zoom = max(0.85, camera.zoom)
        crop_w = int(world_w / zoom)
        crop_h = int(world_h / zoom)
        center_crop_x = int(world_w * 0.5 + camera.pan_x * world_w)
        center_crop_y = int(world_h * 0.5 + camera.pan_y * world_h)

        x0 = max(0, min(world_w - crop_w, center_crop_x - crop_w // 2))
        y0 = max(0, min(world_h - crop_h, center_crop_y - crop_h // 2))

        sub = frame_canvas.subsurface(pygame.Rect(x0, y0, crop_w, crop_h))
        scaled_view = pygame.transform.smoothscale(sub, (w, h))
        dest_surf.blit(scaled_view, (0, 0))

    def _render_dynamic_lids_and_lashes(
        self,
        canvas: pygame.Surface,
        eye: EyeModel,
        up_curve: np.ndarray,
        dn_curve: np.ndarray,
        cx: float,
        cy: float,
        u_px: float,
        theme: Theme,
        blink_prog: float,
        mouse_pos: Tuple[int, int]
    ):
        """Draws dynamic eyelid rows and radiating lashes that compress and animate as the eye blinks."""
        pts_up, cum_d_up, len_up = sample_cubic_bezier(up_curve[0], up_curve[len(up_curve)//3], up_curve[2*len(up_curve)//3], up_curve[-1], n=70)
        pts_dn, cum_d_dn, len_dn = sample_cubic_bezier(dn_curve[0], dn_curve[len(dn_curve)//3], dn_curve[2*len(dn_curve)//3], dn_curve[-1], n=70)

        lut_lids = theme.luts["lids"]
        lut_lashes = theme.luts["lashes"]

        # Upper lid rows (3 rows compressing on blink)
        compress = 1.0 - blink_prog * 0.45
        for row in range(3):
            offset_y = (row * 9 + 4) * (u_px / 1080.0) * compress
            words = ["eyelid", "slumber", "twilight", "shadow", "fold", "veil", "tender"]
            curr_s = len_up * 0.08
            for word in words:
                if curr_s >= len_up * 0.92:
                    break
                pt, angle = sample_curve_at_distance(pts_up, cum_d_up, len_up, curr_s)
                font_size = max(8, int(round(10 * (u_px / 1080.0))))
                adv = len(word) * font_size * 0.62 + 6
                # Color from theme LUT
                rgb = lut_lids[min(255, 60 + row * 45)]
                sprite = self.sprite_cache.get_rotated_sprite(word, "regular", font_size, angle)
                tinted = sprite.copy()
                tinted.fill((rgb[0], rgb[1], rgb[2], 255), special_flags=pygame.BLEND_RGB_MULT)
                canvas.blit(tinted, (int(round(cx + pt[0] * u_px - tinted.get_width()*0.5)), int(round(cy - (pt[1] * u_px + offset_y) - tinted.get_height()*0.5))))
                curr_s += adv

        # Upper Lashes: radiating short words angling downward on blink
        n_lashes = 18
        lash_words = ["lash", "sweep", "fringe", "dark", "shade", "plume", "quill", "comb"]
        for i in range(n_lashes):
            s = (i + 1) / float(n_lashes + 1) * len_up
            pt, angle = sample_curve_at_distance(pts_up, cum_d_up, len_up, s)
            word = lash_words[i % len(lash_words)]
            font_size = max(8, int(round(9 * (u_px / 1080.0))))
            # Lashes curve downward as the lid closes
            lash_angle = angle + (75.0 if eye.is_left else -75.0) + blink_prog * 35.0
            rgb = lut_lashes[120]
            sprite = self.sprite_cache.get_rotated_sprite(word, "regular", font_size, lash_angle)
            tinted = sprite.copy()
            tinted.fill((rgb[0], rgb[1], rgb[2], 255), special_flags=pygame.BLEND_RGB_MULT)
            canvas.blit(tinted, (int(round(cx + pt[0] * u_px - tinted.get_width()*0.5)), int(round(cy - pt[1] * u_px - tinted.get_height()*0.5))))


# =============================================================================
# 11. USER INTERFACE: TOASTS AND HELP OVERLAY
# =============================================================================
class UIOverlay:
    """Renders sleek translucent notifications and a complete shortcut reference panel."""
    def __init__(self, font_bank: FontBank):
        self.font_bank = font_bank
        self.toasts: List[Dict[str, Any]] = []
        self.show_help: bool = False
        self.help_alpha: float = 0.0

    def add_toast(self, text: str, duration: float = 2.4):
        self.toasts.append({"text": text, "remaining": duration, "duration": duration})

    def toggle_help(self):
        self.show_help = not self.show_help

    def update(self, dt: float):
        for t in self.toasts:
            t["remaining"] -= dt
        self.toasts = [t for t in self.toasts if t["remaining"] > 0]

        target_alpha = 1.0 if self.show_help else 0.0
        self.help_alpha += (target_alpha - self.help_alpha) * min(1.0, dt * 8.0)

    def draw(self, screen: pygame.Surface, current_seed: int, theme_name: str, auto_zoom: bool, zoom_val: float, fps: float):
        w, h = screen.get_size()

        # 1. Draw Toasts (Top-Center)
        y_toast = 28
        for t in self.toasts:
            progress = t["remaining"] / t["duration"]
            alpha = int(min(1.0, progress * 3.5, (1.0 - progress) * 6.0) * 235)
            if alpha <= 0:
                continue

            font = self.font_bank.get_font("regular", 16)
            bbox = font.getbbox(t["text"])
            tw, th = bbox[2] - bbox[0] + 32, bbox[3] - bbox[1] + 18

            pill = pygame.Surface((tw, th), pygame.SRCALPHA)
            pygame.draw.rect(pill, (18, 14, 22, alpha), (0, 0, tw, th), border_radius=8)
            pygame.draw.rect(pill, (120, 100, 140, int(alpha * 0.7)), (0, 0, tw, th), width=1, border_radius=8)

            img = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            draw.text((16, 9), t["text"], fill=(240, 235, 245, alpha), font=font)
            text_surf = pygame.image.frombytes(img.tobytes(), (tw, th), "RGBA")
            pill.blit(text_surf, (0, 0))

            screen.blit(pill, ((w - tw) // 2, y_toast))
            y_toast += th + 10

        # 2. Draw Help Overlay (Center Card)
        if self.help_alpha > 0.02:
            card_w = min(680, w - 40)
            card_h = min(560, h - 40)
            overlay = pygame.Surface((card_w, card_h), pygame.SRCALPHA)
            alpha_int = int(self.help_alpha * 240)

            # Translucent frosted card
            pygame.draw.rect(overlay, (12, 10, 16, alpha_int), (0, 0, card_w, card_h), border_radius=14)
            pygame.draw.rect(overlay, (95, 80, 120, int(alpha_int * 0.65)), (0, 0, card_w, card_h), width=1, border_radius=14)

            # Pillow rendered crisp typography inside overlay
            img = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
            d = ImageDraw.Draw(img)

            title_font = self.font_bank.get_font("bold", 22)
            header_font = self.font_bank.get_font("regular", 14)
            body_font = self.font_bank.get_font("mono", 13)

            d.text((28, 24), "LEXICAL EYES — CONTROLS & STATUS", fill=(255, 230, 245, alpha_int), font=title_font)
            d.line([(28, 56), (card_w - 28, 56)], fill=(80, 65, 95, int(alpha_int * 0.8)), width=1)

            # Status bar
            status_txt = f"Theme: {theme_name.title()}  |  Seed: {current_seed}  |  Zoom: {'Auto' if auto_zoom else f'Manual ({zoom_val:.2f}x)'}  |  FPS: {fps:.1f}"
            d.text((28, 66), status_txt, fill=(185, 170, 205, alpha_int), font=header_font)
            d.line([(28, 92), (card_w - 28, 92)], fill=(60, 50, 75, int(alpha_int * 0.5)), width=1)

            shortcuts = [
                ("B / Space", "Trigger a natural blink now"),
                ("Z", "Toggle cinematic auto-zoom timeline"),
                ("Up / Down or + / -", "Manual zoom in / out (0 resets)"),
                ("P / Right Arrow", "Next color theme (Left: previous)"),
                ("1 to 6", "Jump directly to theme (Ember, Glacier, Verdant...)"),
                ("R", "Regenerate layout with a new random seed"),
                ("S", "Save high-resolution screenshot (PNG)"),
                ("G", "Toggle Post-FX (bloom, grain, vignette)"),
                ("M", "Toggle mouse reactivity and spring tracking"),
                ("F or F11", "Toggle Fullscreen / Windowed mode"),
                ("H or F1", "Show / hide this control overlay"),
                ("Esc or Q", "Quit application"),
            ]

            y_pos = 110
            for key_str, desc_str in shortcuts:
                d.text((36, y_pos), key_str.ljust(22), fill=(245, 195, 140, alpha_int), font=body_font)
                d.text((230, y_pos), desc_str, fill=(225, 220, 235, alpha_int), font=header_font)
                y_pos += 32

            card_surf = pygame.image.frombytes(img.tobytes(), (card_w, card_h), "RGBA")
            overlay.blit(card_surf, (0, 0))
            screen.blit(overlay, ((w - card_w) // 2, (h - card_h) // 2))


# =============================================================================
# 12. MAIN APPLICATION PIPELINE
# =============================================================================
class LexicalEyesApp:
    """Main application loop managing events, resizing, worker baking, and state."""
    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.fps = args.fps
        self.quality = args.quality
        self.theme_idx = self._parse_theme_arg(args.theme)
        self.current_theme = THEMES[THEME_KEYS[self.theme_idx]]
        self.seed = args.seed if args.seed is not None else random.randint(100000, 999999)
        print(f"[Lexical Eyes] Starting with seed: {self.seed} | Theme: {self.current_theme.name} | Quality: {self.quality}")

        # Pygame Window Setup
        pygame.init()
        pygame.display.set_caption("Lexical Eyes — Typographic Vision")

        self.is_fullscreen = not args.windowed
        self.window_size = self._parse_size(args.size)
        self.screen = self._init_display()

        # Input & Mouse State
        self.mouse_enabled = True
        self.last_mouse_pos = pygame.mouse.get_pos()
        if self.is_fullscreen and not args.show_cursor:
            pygame.mouse.set_visible(False)

        # Lexicon & Extra Quotes
        self.lexicon = Lexicon(args.quotes)
        self.quotes = self.lexicon.quotes

        # Core Subsystems
        self.font_bank = FontBank(args.font)
        self.sprite_cache = SpriteCache(self.font_bank)
        self.baker = Baker(self.sprite_cache, self.quality)
        self.renderer = EyeRenderer(self.sprite_cache, self.baker)
        self.post_fx = PostFX(self.screen.get_width(), self.screen.get_height())
        self.post_fx.enabled = not args.no_fx
        self.ui = UIOverlay(self.font_bank)

        # Controllers
        self.blink = BlinkController(self.seed)
        self.gaze = GazeController()
        self.pupil = PupilController()
        self.camera = CameraController()

        # Layout and Baking State
        self.layout: Optional[Dict[str, Any]] = None
        self._rebuilding = False
        self._bake_queue: queue.Queue = queue.Queue()

        # Initial synchronous layout and bake
        self._build_and_bake(self.seed, sync=True)

        self.ui.add_toast(f"Theme: {self.current_theme.name}")
        self.clock = pygame.time.Clock()
        self.running = True

    def _parse_size(self, size_str: str) -> Tuple[int, int]:
        try:
            parts = size_str.lower().split("x")
            return (int(parts[0]), int(parts[1]))
        except Exception:
            return (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT)

    def _parse_theme_arg(self, theme_arg: str) -> int:
        theme_str = theme_arg.lower().strip()
        if theme_str.isdigit():
            val = int(theme_str) - 1
            return max(0, min(len(THEME_KEYS) - 1, val))
        for i, k in enumerate(THEME_KEYS):
            if k in theme_str or THEMES[k].name.lower() in theme_str:
                return i
        return 0

    def _load_all_quotes(self, quotes_path: Optional[str]) -> Dict[str, List[str]]:
        quotes = {k: list(v) for k, v in DEFAULT_QUOTES.items()}
        # Check explicit path, script-relative quotes.txt, or local quotes.txt
        candidate_paths = []
        if quotes_path and os.path.exists(quotes_path):
            candidate_paths.append(quotes_path)
        if os.path.exists(DEFAULT_QUOTES_PATH) and DEFAULT_QUOTES_PATH not in candidate_paths:
            candidate_paths.append(DEFAULT_QUOTES_PATH)
        elif os.path.exists("quotes.txt") and "quotes.txt" not in candidate_paths:
            candidate_paths.append("quotes.txt")

        for cp in candidate_paths:
            try:
                with open(cp, "r", encoding="utf-8", errors="ignore") as f:
                    lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]
                    if lines:
                        quotes["whispers"].extend(lines)
                        print(f"[Lexical Eyes] Loaded {len(lines)} custom quotes from {cp}")
            except Exception as e:
                print(f"[Lexical Eyes] Note: Could not read {cp}: {e}")
        return quotes

    def _init_display(self) -> pygame.Surface:
        flags = pygame.RESIZABLE
        if self.is_fullscreen:
            flags |= pygame.FULLSCREEN | pygame.SCALED
            size = (0, 0) # Native desktop resolution
        else:
            size = self.window_size

        vsync = 0 if self.args.no_vsync else 1
        try:
            screen = pygame.display.set_mode(size, flags=flags, vsync=vsync)
        except Exception:
            # Fallback without vsync flag
            screen = pygame.display.set_mode(size, flags=flags)
        return screen

    def toggle_fullscreen(self):
        self.is_fullscreen = not self.is_fullscreen
        self.screen = self._init_display()
        if self.is_fullscreen and not self.args.show_cursor:
            pygame.mouse.set_visible(False)
        else:
            pygame.mouse.set_visible(True)
        w, h = self.screen.get_size()
        self.post_fx.resize(w, h)
        self.ui.add_toast("Fullscreen" if self.is_fullscreen else "Windowed Mode")

    def _build_and_bake(self, new_seed: int, sync: bool = False):
        """Constructs layout and bakes static layers synchronously or in a background worker."""
        self.seed = new_seed
        self.blink = BlinkController(new_seed)

        def worker():
            u_px = max(600.0, float(self.screen.get_height()))
            builder = LayoutBuilder(self.quotes, new_seed, self.quality)
            layout = builder.build_layout(u_px)
            world_w = int(round(u_px * 2.8))
            world_h = int(round(u_px * 1.6))
            self.renderer.bake_static_composition(layout, self.current_theme, world_w, world_h)
            self._bake_queue.put((new_seed, layout))

        if sync:
            worker()
            _, self.layout = self._bake_queue.get()
        else:
            self._rebuilding = True
            threading.Thread(target=worker, daemon=True).start()

    def set_theme(self, new_idx: int):
        self.theme_idx = new_idx % len(THEME_KEYS)
        self.current_theme = THEMES[THEME_KEYS[self.theme_idx]]
        # Live colorize without re-rendering text
        if self.layout:
            u_px = self.layout["u_px"]
            world_w = int(round(u_px * 2.8))
            world_h = int(round(u_px * 1.6))
            self.renderer.bake_static_composition(self.layout, self.current_theme, world_w, world_h)
        self.ui.add_toast(f"Theme: {self.current_theme.name}")

    def save_screenshot(self):
        filename = f"lexical_eyes_{self.seed}_{self.current_theme.name.lower().replace(' ', '_')}.png"
        try:
            pygame.image.save(self.screen, filename)
            self.ui.add_toast(f"Saved: {filename}")
            print(f"[Lexical Eyes] Screenshot saved to: {os.path.abspath(filename)}")
        except Exception as e:
            self.ui.add_toast(f"Screenshot Error: {e}")

    def run(self):
        while self.running:
            dt = min(0.066, self.clock.tick(self.fps) / 1000.0)

            # Check async regeneration queue
            if not self._bake_queue.empty():
                seed_done, layout_done = self._bake_queue.get()
                self.layout = layout_done
                self._rebuilding = False
                self.ui.add_toast(f"Regenerated: Seed {seed_done}")

            # Process Events
            mouse_moved = False
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False

                elif event.type == pygame.KEYDOWN:
                    if event.key in (pygame.K_ESCAPE, pygame.K_q):
                        self.running = False
                    elif event.key in (pygame.K_b, pygame.K_SPACE):
                        self.blink.trigger_blink_now()
                    elif event.key == pygame.K_z:
                        is_auto = self.camera.toggle_auto_zoom()
                        self.ui.add_toast(f"Auto-Zoom: {'ON' if is_auto else 'OFF'}")
                    elif event.key in (pygame.K_UP, pygame.K_PLUS, pygame.K_EQUALS):
                        self.camera.manual_zoom_delta(0.15)
                    elif event.key in (pygame.K_DOWN, pygame.K_MINUS):
                        self.camera.manual_zoom_delta(-0.15)
                    elif event.key == pygame.K_0:
                        self.camera.reset_zoom()
                        self.ui.add_toast("Zoom Reset (1.0x)")
                    elif event.key in (pygame.K_p, pygame.K_RIGHT):
                        self.set_theme(self.theme_idx + 1)
                    elif event.key == pygame.K_LEFT:
                        self.set_theme(self.theme_idx - 1)
                    elif pygame.K_1 <= event.key <= pygame.K_6:
                        self.set_theme(event.key - pygame.K_1)
                    elif event.key == pygame.K_r:
                        if not self._rebuilding:
                            new_seed = random.randint(100000, 999999)
                            self._build_and_bake(new_seed, sync=False)
                    elif event.key == pygame.K_s:
                        self.save_screenshot()
                    elif event.key == pygame.K_g:
                        self.post_fx.enabled = not self.post_fx.enabled
                        self.ui.add_toast(f"Post-FX: {'ON' if self.post_fx.enabled else 'OFF'}")
                    elif event.key == pygame.K_m:
                        self.mouse_enabled = not self.mouse_enabled
                        self.ui.add_toast(f"Mouse Tracking: {'ON' if self.mouse_enabled else 'OFF'}")
                    elif event.key in (pygame.K_f, pygame.K_F11):
                        self.toggle_fullscreen()
                    elif event.key in (pygame.K_h, pygame.K_F1):
                        self.ui.toggle_help()

                elif event.type == pygame.MOUSEMOTION:
                    mouse_moved = True
                    self.last_mouse_pos = event.pos

                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1: # Left click blinks
                        self.blink.trigger_blink_now()
                    elif event.button == 4: # Mouse wheel zoom in
                        self.camera.manual_zoom_delta(0.12)
                    elif event.button == 5: # Mouse wheel zoom out
                        self.camera.manual_zoom_delta(-0.12)

                elif event.type == pygame.VIDEORESIZE:
                    if not self.is_fullscreen:
                        self.window_size = (event.w, event.h)
                        self.post_fx.resize(event.w, event.h)

            # Normalized mouse coordinates (-1.0 to 1.0 from center)
            sw, sh = self.screen.get_size()
            if sw > 0 and sh > 0:
                mx_norm = (self.last_mouse_pos[0] - sw * 0.5) / (sw * 0.5)
                my_norm = (self.last_mouse_pos[1] - sh * 0.5) / (sh * 0.5)
                m_dist_norm = math.hypot(mx_norm, my_norm)
            else:
                mx_norm, my_norm, m_dist_norm = 0.0, 0.0, 0.0

            # Update Simulation Dynamics
            self.blink.update(dt)
            self.gaze.update(dt, mx_norm, my_norm, mouse_moved, enabled=self.mouse_enabled)
            self.pupil.update(dt, m_dist_norm, is_idle=(self.gaze.idle_timer > MOUSE_IDLE_TIMEOUT))
            self.camera.update(dt, mx_norm, my_norm)
            self.ui.update(dt)

            # Render Scene
            if self.layout:
                self.renderer.render_frame(
                    self.screen, self.layout, self.current_theme,
                    self.gaze, self.blink, self.camera,
                    self.last_mouse_pos, dt, self.pupil
                )

            # Post FX Pass
            self.post_fx.apply(self.screen, quality=self.quality)

            # UI Pass
            fps_val = self.clock.get_fps()
            self.ui.draw(self.screen, self.seed, self.current_theme.name, self.camera.auto_zoom_enabled, self.camera.zoom, fps_val)

            # Debug Overlay (if requested)
            if self.args.debug:
                self._draw_debug_hud(fps_val)

            pygame.display.flip()

        pygame.quit()

    def _draw_debug_hud(self, fps: float):
        font = self.font_bank.get_font("mono", 12)
        txt = f"DEBUG | FPS: {fps:4.1f} | Sprites: {len(self.sprite_cache._base_cache)} | Rotated: {len(self.sprite_cache._rotated_cache)} | Gaze: ({self.gaze.gaze_x:+.2f}, {self.gaze.gaze_y:+.2f})"
        bbox = font.getbbox(txt)
        w, h = bbox[2] - bbox[0] + 16, bbox[3] - bbox[1] + 10
        hud = pygame.Surface((w, h), pygame.SRCALPHA)
        hud.fill((0, 0, 0, 185))
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        d.text((8, 5), txt, fill=(140, 255, 140, 240), font=font)
        hud.blit(pygame.image.frombytes(img.tobytes(), (w, h), "RGBA"), (0, 0))
        self.screen.blit(hud, (12, self.screen.get_height() - h - 12))


# =============================================================================
# 13. COMMAND LINE ENTRY POINT
# =============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Lexical Eyes — Procedural Typographic Vision Art Application."
    )
    parser.add_argument("--windowed", "-w", action="store_true",
                        help="Launch in a normal resizable window instead of fullscreen")
    parser.add_argument("--size", type=str, default="1280x720",
                        help="Window dimensions when windowed (default: 1280x720)")
    parser.add_argument("--fps", type=int, default=DEFAULT_FPS,
                        help="Frame rate cap (default: 60)")
    parser.add_argument("--seed", type=int, default=None,
                        help="Starting random seed for reproducible composition")
    parser.add_argument("--theme", type=str, default=DEFAULT_THEME,
                        help="Starting color theme name or index: ember, glacier, verdant, amethyst, ink, rose_gold")
    parser.add_argument("--quality", type=str, default=DEFAULT_QUALITY, choices=["low", "medium", "high"],
                        help="Quality preset: low, medium, high (default: medium)")
    parser.add_argument("--quotes", type=str, default=None,
                        help="Path to custom text file containing extra quotes/phrases (one per line)")
    parser.add_argument("--font", type=str, default=None,
                        help="Path to override TrueType font file (.ttf)")
    parser.add_argument("--display", type=int, default=0,
                        help="Target monitor display index for fullscreen")
    parser.add_argument("--no-vsync", action="store_true",
                        help="Disable VSync synchronization")
    parser.add_argument("--no-fx", action="store_true",
                        help="Disable post-processing FX (bloom, grain, vignette)")
    parser.add_argument("--show-cursor", action="store_true",
                        help="Keep mouse cursor visible in fullscreen mode")
    parser.add_argument("--debug", action="store_true",
                        help="Show debug telemetry overlay (FPS, sprite cache counts, gaze)")
    parser.add_argument("--smoke-test", action="store_true",
                        help="Run quick headless asset & lexicon verification and exit immediately")

    args = parser.parse_args()
    if args.smoke_test:
        lex = Lexicon(args.quotes)
        whisper_count = len(lex.quotes.get("whispers", []))
        iris_count = len(lex.quotes.get("iris", []))
        print(f"[Lexical Eyes Smoke Test] OK: Successfully initialized Lexicon with {whisper_count} whispers and {iris_count} iris quotes (Source: {DEFAULT_QUOTES_PATH})")
        sys.exit(0)

    app = LexicalEyesApp(args)
    app.run()


if __name__ == "__main__":
    main()
