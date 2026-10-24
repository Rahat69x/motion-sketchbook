"""
Procedural 3D Botanical Lily Bouquet Animation (Instagram Reel 9:16)
===================================================================

A complete, self-contained Python script that procedurally models, animates,
and renders a cinematic 9:16 vertical video of an Oriental Lily bouquet (Lilium orientalis).
Features progressive sprouting stems, unfurling lanceolate foliage, staged blooming
petals with recurved tips and raised botanical freckles (papillae), versatile stamens,
a trilobed pistil, Subsurface Scattering (SSS) lighting, floating golden pollen particles,
subtle camera drift, idle breeze sway, and cinematic film grain.

REFERENCE & ATTRIBUTION:
Inspired by procedural 3D botanical construction techniques demonstrated in
https://github.com/mishratanya2311/lily-animation-python (notably parametric Bezier curves,
Bishop parallel transport frames, and OpenCV subpixel anti-aliased polyfill rasterization).
This implementation provides a clean object-oriented architecture (Petal, Stamen, Pistil,
Stem, Leaf, Lily, Bouquet, Renderer), full Instagram Reel 9:16 layout, multi-palette support,
bloom stage transitions, idle breeze physics, film grain, and self-contained video streaming.

SETUP INSTRUCTIONS:
1. Recommended: create and activate a Python virtual environment:
     python -m venv .venv
     # Windows (PowerShell):
     .\\.venv\\Scripts\\Activate.ps1
     # macOS / Linux:
     source .venv/bin/activate

2. Install required dependencies:
     pip install numpy opencv-python imageio-ffmpeg

   * Note on FFmpeg: `imageio-ffmpeg` automatically provides a high-performance,
     bundled static FFmpeg binary for Windows, macOS, and Linux without requiring
     any system-level package installations. If you prefer using system FFmpeg:
     - Windows: winget install Gyan.FFmpeg   (or choco install ffmpeg)
     - macOS:   brew install ffmpeg
     - Linux:   sudo apt update && sudo apt install -y ffmpeg

COMMAND LINE USAGE EXAMPLES:
1. Fast low-resolution preview test (540x960, renders in seconds):
     python generate_lily_animation.py --preview

2. Full HD 1080x1920 Instagram Reel with default pink Stargazer palette:
     python generate_lily_animation.py --output lily_reel.mp4 --duration 13 --title

3. White Casablanca lilies with 7 blooms and custom seed:
     python generate_lily_animation.py --palette white --flowers 7 --seed 123 --title
"""

import os
import sys
import math
import time
import shutil
import argparse
import subprocess
import numpy as np
import cv2

try:
    import imageio_ffmpeg
    HAS_IMAGEIO_FFMPEG = True
except ImportError:
    HAS_IMAGEIO_FFMPEG = False


# ============================================================================
# 1. MATHEMATICAL UTILITIES & EASING CURVES
# ============================================================================

def clamp(x, lo=0.0, hi=1.0):
    """Clamp scalar or array x between lo and hi."""
    return np.clip(x, lo, hi)


def smoothstep(e0, e1, x):
    """Standard Hermite cubic smoothstep interpolation."""
    t = np.clip((x - e0) / max(1e-7, (e1 - e0)), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def smootherstep(e0, e1, x):
    """Perlin's quintic smootherstep interpolation with zero 1st & 2nd derivatives."""
    t = np.clip((x - e0) / max(1e-7, (e1 - e0)), 0.0, 1.0)
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


def ease_out_back(t, s=1.30):
    """Organic overshoot easing curve for petals peeling back."""
    t = np.clip(t, 0.0, 1.0)
    t = t - 1.0
    return t * t * ((s + 1.0) * t + s) + 1.0


def normalize_v3(v):
    """Normalize 3D vectors along the last axis."""
    norm = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(norm, 1e-8)


def rot_x(ang):
    """3x3 Rotation matrix around X axis."""
    c, s = math.cos(ang), math.sin(ang)
    return np.array([[1.0, 0.0, 0.0],
                     [0.0,   c,  -s],
                     [0.0,   s,   c]], dtype=np.float32)


def rot_y(ang):
    """3x3 Rotation matrix around Y axis."""
    c, s = math.cos(ang), math.sin(ang)
    return np.array([[  c, 0.0,   s],
                     [0.0, 1.0, 0.0],
                     [ -s, 0.0,   c]], dtype=np.float32)


def rot_z(ang):
    """3x3 Rotation matrix around Z axis."""
    c, s = math.cos(ang), math.sin(ang)
    return np.array([[  c,  -s, 0.0],
                     [  s,   c, 0.0],
                     [0.0, 0.0, 1.0]], dtype=np.float32)


def build_basis_from_dir(direction, up_hint=np.array([0.0, 1.0, 0.0], dtype=np.float32)):
    """
    Construct an orthonormal 3x3 basis matrix whose local Y-axis aligns with `direction`.
    Borrowed from botanical orientation principles in mishratanya2311/lily-animation-python.
    """
    y_axis = direction / max(1e-8, np.linalg.norm(direction))
    if abs(float(np.dot(y_axis, up_hint))) > 0.92:
        up_hint = np.array([0.0, 0.0, 1.0], dtype=np.float32)
    x_axis = np.cross(up_hint, y_axis)
    x_axis /= max(1e-8, np.linalg.norm(x_axis))
    z_axis = np.cross(x_axis, y_axis)
    z_axis /= max(1e-8, np.linalg.norm(z_axis))
    return np.stack([x_axis, y_axis, z_axis], axis=-1).astype(np.float32)


def eval_cubic_bezier(p0, p1, p2, p3, u):
    """Evaluate 3D cubic Bezier position and tangent vector along parameter array u in [0, 1]."""
    u_arr = np.asarray(u, dtype=np.float32)[..., None]
    om = 1.0 - u_arr
    pos = (om ** 3) * p0 + 3.0 * (om ** 2) * u_arr * p1 + 3.0 * om * (u_arr ** 2) * p2 + (u_arr ** 3) * p3
    tan = 3.0 * (om ** 2) * (p1 - p0) + 6.0 * om * u_arr * (p2 - p1) + 3.0 * (u_arr ** 2) * (p3 - p2)
    return pos, tan


def compute_bishop_frame(tangents):
    """
    Computes a rotation-minimizing, twist-free Bishop parallel transport frame (N1, N2)
    along an array of 3D tangent vectors. Essential for natural stem and petal curves.
    """
    Nu = len(tangents)
    N1 = np.zeros_like(tangents)
    N2 = np.zeros_like(tangents)

    t0 = tangents[0]
    ref = np.array([0.0, 0.0, 1.0], dtype=np.float32)
    if abs(float(np.dot(t0, ref))) > 0.9:
        ref = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    n1 = np.cross(t0, ref)
    n1 /= max(1e-8, np.linalg.norm(n1))
    n2 = np.cross(t0, n1)
    N1[0], N2[0] = n1, n2

    for i in range(1, Nu):
        ti = tangents[i]
        n1_proj = n1 - np.dot(n1, ti) * ti
        norm_n1 = np.linalg.norm(n1_proj)
        if norm_n1 < 1e-6:
            n1_proj = np.cross(ti, n2)
            norm_n1 = np.linalg.norm(n1_proj)
        n1 = n1_proj / max(1e-8, norm_n1)
        n2 = np.cross(ti, n1)
        N1[i], N2[i] = n1, n2
    return N1, N2


# ============================================================================
# 2. COLOR PALETTES FOR ORIENTAL LILIES
# ============================================================================

def get_color_palette(palette_name):
    """
    Returns botanical color dictionaries for the requested flower palette:
    - 'pink' / 'stargazer': Iconic crimson-magenta heart, blush mid-petal, snowy white ruffles.
    - 'white' / 'casablanca': Pure ivory cream, chartreuse throat star, honey-cinnamon freckles.
    - 'magenta' / 'oriental': Deep royal velvet crimson-magenta, fiery fuchsia, golden anthers.
    """
    p = palette_name.lower().strip()
    if p in ("white", "casablanca", "cream"):
        return {
            "name": "casablanca",
            "c_throat": np.array([0.48, 0.74, 0.22], dtype=np.float32),  # Chartreuse star
            "c_deep":   np.array([0.90, 0.94, 0.88], dtype=np.float32),  # Soft lime-ivory flush
            "c_blush":  np.array([0.97, 0.97, 0.95], dtype=np.float32),  # Warm ivory
            "c_tip":    np.array([0.99, 0.99, 0.98], dtype=np.float32),  # Pure pearl white
            "pap_core": (35, 75, 120),                                   # Warm honey-cinnamon freckles (BGR)
            "pap_rim":  (80, 130, 175),                                  # Soft golden halo (BGR)
            "anther1":  np.array([0.55, 0.28, 0.08], dtype=np.float32),  # Warm chocolate amber
            "anther2":  np.array([0.80, 0.48, 0.12], dtype=np.float32),
        }
    elif p in ("magenta", "crimson", "ruby"):
        return {
            "name": "magenta",
            "c_throat": np.array([0.34, 0.60, 0.15], dtype=np.float32),
            "c_deep":   np.array([0.68, 0.03, 0.26], dtype=np.float32),  # Deep royal crimson
            "c_blush":  np.array([0.88, 0.16, 0.46], dtype=np.float32),  # Velvet fuchsia
            "c_tip":    np.array([0.98, 0.90, 0.94], dtype=np.float32),  # White-pink ruffled tip
            "pap_core": (20, 4, 70),                                     # Deep blackberry core (BGR)
            "pap_rim":  (55, 15, 125),                                   # Ruby halo (BGR)
            "anther1":  np.array([0.72, 0.26, 0.06], dtype=np.float32),
            "anther2":  np.array([0.92, 0.52, 0.12], dtype=np.float32),
        }
    else:  # Default: 'pink' / 'stargazer'
        return {
            "name": "stargazer",
            "c_throat": np.array([0.38, 0.68, 0.18], dtype=np.float32),  # Emerald throat star
            "c_deep":   np.array([0.76, 0.08, 0.32], dtype=np.float32),  # Rich crimson-magenta heart
            "c_blush":  np.array([0.94, 0.40, 0.60], dtype=np.float32),  # Luminous rose pink
            "c_tip":    np.array([0.99, 0.97, 0.96], dtype=np.float32),  # Snow-ivory margin
            "pap_core": (32, 8, 96),                                     # Dark ruby papilla core (BGR)
            "pap_rim":  (75, 24, 160),                                   # Soft rose halo (BGR)
            "anther1":  np.array([0.78, 0.32, 0.08], dtype=np.float32),  # Golden-orange pollen
            "anther2":  np.array([0.95, 0.60, 0.15], dtype=np.float32),
        }


# ============================================================================
# 3. PROCEDURAL BOTANICAL COMPONENTS
# ============================================================================

class Petal:
    """
    Represents an Oriental Lily tepal (inner petal or outer sepal).
    Generates realistic broad elliptic blades with recurved reflexed tips,
    longitudinal midrib furrow, delicate margin ruffling, botanical pigmentation,
    and 3D raised glandular papillae (freckles).
    """
    def __init__(self, center, basis, azimuth, is_inner, scale, openness,
                 palette, t_start, t_end, seed=42, coarse=False):
        self.center = np.array(center, dtype=np.float32)
        self.basis = np.array(basis, dtype=np.float32)
        self.azimuth = float(azimuth)
        self.is_inner = bool(is_inner)
        self.scale = float(scale)
        self.openness = float(openness)
        self.palette = palette
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.seed = int(seed)
        self.coarse = coarse

        self.Nu = 26 if self.coarse else 44
        self.Nv = 13 if self.coarse else 21
        self._build_static_properties()

    def _build_static_properties(self):
        rng = np.random.RandomState(self.seed)
        u = np.linspace(0.0, 1.0, self.Nu, dtype=np.float32)
        v = np.linspace(-1.0, 1.0, self.Nv, dtype=np.float32)
        self.U, self.V = np.meshgrid(u, v, indexing='ij')

        self.w_max = (0.44 if self.is_inner else 0.36) * self.scale
        self.length = (1.24 if self.is_inner else 1.20) * self.scale

        envelope = np.maximum(0.0, np.sin(math.pi * (self.U ** 0.58))) ** 0.72
        self.w_profile = self.w_max * envelope * (1.0 - 0.12 * (self.U ** 3)) + 0.05 * self.scale * ((1.0 - self.U) ** 2.5)

        # Precompute Base Color Pigmentation
        c_th = self.palette["c_throat"]
        c_dp = self.palette["c_deep"]
        c_bl = self.palette["c_blush"]
        c_tp = self.palette["c_tip"]

        C = np.broadcast_to(c_tp, (self.Nu, self.Nv, 3)).copy()

        # Radiating blush flush
        u_flush = smoothstep(0.05, 0.22, self.U) * (1.0 - smoothstep(0.48, 0.88, self.U))
        v_margin = 1.0 - smoothstep(0.30, 0.82, np.abs(self.V))
        flush_mask = (u_flush * v_margin)[..., None]

        core_mask = (
            smoothstep(0.06, 0.18, self.U)
            * (1.0 - smoothstep(0.36, 0.72, self.U))
            * np.exp(-((self.V / 0.40) ** 2))
        )[..., None]

        C = C * (1.0 - flush_mask) + c_bl * flush_mask
        C = C * (1.0 - core_mask) + c_dp * core_mask

        # Emerald / lime throat star
        nectar_mask = (
            (1.0 - smoothstep(0.03, 0.22, self.U))
            * np.exp(-((self.V / (0.35 - 0.16 * self.U)) ** 2))
        )[..., None]
        C = C * (1.0 - 0.88 * nectar_mask) + c_th * (0.88 * nectar_mask)

        # Midrib longitudinal vein
        midrib_vein = (
            smoothstep(0.12, 0.26, self.U)
            * (1.0 - smoothstep(0.55, 0.90, self.U))
            * np.exp(-((self.V / 0.055) ** 2))
        )[..., None]
        c_midrib = 0.75 * c_dp + 0.25 * c_tp
        self.C = C * (1.0 - 0.65 * midrib_vein) + c_midrib * (0.65 * midrib_vein)

        # Discrete botanical raised papillae / freckles
        self.papillae = []
        n_pap = 45 if self.is_inner else 25
        if self.coarse:
            n_pap = n_pap // 2
        for _ in range(n_pap):
            pu = float(rng.uniform(0.14, 0.62))
            pv = float(rng.choice([-1.0, 1.0]) * rng.uniform(0.06, 0.60))
            u_i = int(np.clip(round(pu * (self.Nu - 1)), 1, self.Nu - 2))
            v_i = int(np.clip(round(((pv + 1.0) * 0.5) * (self.Nv - 1)), 1, self.Nv - 2))
            rad = float(rng.uniform(1.8, 3.0) * self.scale)
            self.papillae.append((u_i, v_i, rad, self.palette["pap_core"], self.palette["pap_rim"]))

    def get_mesh_at_time(self, t):
        """Returns the animated 3D vertices, face normals, colors, and papillae at time t."""
        if t < self.t_start:
            return None

        # Bloom progress with spring elasticity
        raw_b = smootherstep(self.t_start, self.t_end, t)
        bloom_factor = self.openness * ease_out_back(raw_b, s=1.2)

        # Recurved petal spine angles
        theta_base = 0.18 if self.is_inner else 0.28
        theta_flare = (0.72 if self.is_inner else 0.85) * bloom_factor + 0.12
        theta_recurve = (1.52 if self.is_inner else 1.68) * (bloom_factor ** 1.15)

        u_1d = np.linspace(0.0, 1.0, self.Nu, dtype=np.float32)
        angles = (
            theta_base
            + theta_flare * smoothstep(0.04, 0.55, u_1d)
            + (theta_recurve - theta_flare) * (smoothstep(0.40, 1.0, u_1d) ** 1.25)
        )
        ds = self.length / (self.Nu - 1)
        r_mid = np.zeros(self.Nu, dtype=np.float32)
        y_mid = np.zeros(self.Nu, dtype=np.float32)
        r_mid[0] = (0.035 if self.is_inner else 0.075) * self.scale
        y_mid[0] = (0.030 if self.is_inner else 0.000) * self.scale
        for i in range(1, self.Nu):
            ang = 0.5 * (angles[i - 1] + angles[i])
            r_mid[i] = r_mid[i - 1] + ds * math.sin(ang)
            y_mid[i] = y_mid[i - 1] + ds * math.cos(ang)

        R_mid = r_mid[:, None]
        Y_mid = y_mid[:, None]
        Ang = angles[:, None]
        out_r = np.cos(Ang)
        out_y = -np.sin(Ang)

        # Transverse furrow + tip reflex + wavy margin ruffling
        furrow = 0.026 * self.scale * np.exp(-((self.V / 0.18) ** 2)) * (1.0 - 0.60 * self.U)
        reflex = 0.042 * self.scale * (self.V ** 2) * smoothstep(0.35, 0.90, self.U)
        ruffle_amp = (0.042 if self.is_inner else 0.026) * self.scale * bloom_factor
        ruffle_env = np.maximum(0.0, np.sin(math.pi * self.U)) * smoothstep(0.18, 0.88, self.U) * (np.abs(self.V) ** 2.2)
        phase = 0.85 if self.is_inner else -0.75
        ruffle = ruffle_amp * ruffle_env * np.sin(6.0 * math.pi * self.U + phase * np.sign(self.V))
        disp_out = furrow + reflex + ruffle

        wrap_r = R_mid + 0.15 * self.scale
        phi_local = (self.w_profile * self.V) / wrap_r
        cyl_blend = 1.0 - 0.55 * smoothstep(0.35, 0.85, self.U)
        phi_eff = phi_local * cyl_blend
        x_planar = (self.w_profile * self.V) * (1.0 - cyl_blend)

        r_surf = wrap_r * np.cos(phi_eff) - 0.15 * self.scale + disp_out * out_r
        x_surf = wrap_r * np.sin(phi_eff) + x_planar
        y_surf = Y_mid + disp_out * out_y

        ca, sa = math.cos(self.azimuth), math.sin(self.azimuth)
        px = x_surf * ca + r_surf * sa
        pz = -x_surf * sa + r_surf * ca
        py = y_surf

        P_loc = np.stack([px, py, pz], axis=-1)
        P_world = self.center + P_loc @ self.basis.T

        # Face normals
        p00 = P_world[:-1, :-1]
        p10 = P_world[1:, :-1]
        p11 = P_world[1:, 1:]
        p01 = P_world[:-1, 1:]
        normals = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))

        # Face colors
        C_face = 0.25 * (self.C[:-1, :-1] + self.C[1:, :-1] + self.C[1:, 1:] + self.C[:-1, 1:])

        # Active papillae (fade in with bloom)
        active_pap = self.papillae if raw_b > 0.40 else []

        return {
            "kind": "petal",
            "P": P_world,
            "normals": normals,
            "C_face": C_face,
            "papillae": active_pap,
            "sss": 0.45,
            "spec": 0.28,
            "shininess": 22.0
        }


class Stamen:
    """
    Represents one of the 6 stamens: a slender curving filament terminating
    in a prominent, versatile T-shaped pollen anther.
    """
    def __init__(self, center, basis, azimuth, scale, palette, t_start, t_end, coarse=False):
        self.center = np.array(center, dtype=np.float32)
        self.basis = np.array(basis, dtype=np.float32)
        self.azimuth = float(azimuth)
        self.scale = float(scale)
        self.palette = palette
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.coarse = coarse

        self.ca = math.cos(self.azimuth)
        self.sa = math.sin(self.azimuth)
        self.flare = 0.28 * self.scale
        self.h_tip = 0.88 * self.scale

        self.Nu_f = 12 if self.coarse else 16
        self.Nv_f = 6 if self.coarse else 6
        self.Nu_a = 6 if self.coarse else 8
        self.Nv_a = 6 if self.coarse else 8

    def get_mesh_at_time(self, t):
        if t < self.t_start:
            return None

        # Extension progress
        ext = smootherstep(self.t_start, self.t_end, t)
        if ext < 0.01:
            return None

        # 1. Filament
        uf = np.linspace(0.0, 1.0, self.Nu_f, dtype=np.float32)
        vf = np.linspace(-1.0, 1.0, self.Nv_f, dtype=np.float32)
        Uf, Vf = np.meshgrid(uf, vf, indexing='ij')
        th_f = (Vf + 1.0) * math.pi

        fp0 = np.array([0.025 * self.scale * self.ca, 0.02 * self.scale, 0.025 * self.scale * self.sa], dtype=np.float32)
        fp1 = np.array([0.070 * self.scale * self.ca, 0.32 * self.scale * ext, 0.070 * self.scale * self.sa], dtype=np.float32)
        fp2 = np.array([0.185 * self.scale * self.ca * ext, 0.65 * self.scale * ext, 0.185 * self.scale * self.sa * ext], dtype=np.float32)
        fp3 = np.array([self.flare * self.ca * ext, self.h_tip * ext, self.flare * self.sa * ext], dtype=np.float32)

        fpos, ftan = eval_cubic_bezier(fp0, fp1, fp2, fp3, uf)
        Tf = normalize_v3(ftan)
        N1f, N2f = compute_bishop_frame(Tf)

        P_fil = np.zeros((self.Nu_f, self.Nv_f, 3), dtype=np.float32)
        C_fil = np.zeros((self.Nu_f, self.Nv_f, 3), dtype=np.float32)
        c_base = np.array([0.55, 0.78, 0.35], dtype=np.float32)
        c_tip = np.array([0.96, 0.94, 0.92], dtype=np.float32)

        for i in range(self.Nu_f):
            rf = self.scale * (0.012 * (1.0 - 0.40 * uf[i])) * min(1.0, ext * 1.5)
            P_fil[i] = fpos[i] + rf * (np.cos(th_f[i])[:, None] * N1f[i] + np.sin(th_f[i])[:, None] * N2f[i])
            mix = smoothstep(0.15, 0.75, uf[i])
            C_fil[i] = (1.0 - mix) * c_base + mix * c_tip

        P_fil_world = self.center + P_fil @ self.basis.T
        p00 = P_fil_world[:-1, :-1]
        p10 = P_fil_world[1:, :-1]
        p11 = P_fil_world[1:, 1:]
        p01 = P_fil_world[:-1, 1:]
        normals_fil = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))
        C_face_fil = 0.25 * (C_fil[:-1, :-1] + C_fil[1:, :-1] + C_fil[1:, 1:] + C_fil[:-1, 1:])

        result = [{
            "kind": "filament",
            "P": P_fil_world,
            "normals": normals_fil,
            "C_face": C_face_fil,
            "papillae": [],
            "sss": 0.30,
            "spec": 0.25,
            "shininess": 18.0
        }]

        # 2. Versatile Pollen Anther (expands as filament reaches maturity)
        if ext > 0.45:
            a_scale = smootherstep(0.45, 0.90, ext)
            ua = np.linspace(0.0, 1.0, self.Nu_a, dtype=np.float32)
            va = np.linspace(-1.0, 1.0, self.Nv_a, dtype=np.float32)
            Ua, Va = np.meshgrid(ua, va, indexing='ij')
            th_a = (Va + 1.0) * math.pi

            anther_len = 0.14 * self.scale * a_scale
            rad_dir = np.array([self.ca, 0.0, self.sa], dtype=np.float32)
            tan_dir = np.array([-self.sa, 0.0, self.ca], dtype=np.float32)
            a_axis = normalize_v3(0.70 * tan_dir + 0.35 * np.array([0.0, 1.0, 0.0], dtype=np.float32) + 0.25 * rad_dir)
            a_n1 = normalize_v3(np.cross(a_axis, rad_dir))
            a_n2 = normalize_v3(np.cross(a_axis, a_n1))

            P_anth = np.zeros((self.Nu_a, self.Nv_a, 3), dtype=np.float32)
            C_anth = np.zeros((self.Nu_a, self.Nv_a, 3), dtype=np.float32)
            c_p1 = self.palette["anther1"]
            c_p2 = self.palette["anther2"]

            for i in range(self.Nu_a):
                s_along = (ua[i] - 0.5) * anther_len
                env = max(0.0, math.sin(math.pi * float(ua[i]))) ** 0.60
                bilobe = 1.0 + 0.28 * np.cos(2.0 * th_a[i])
                ra = 0.022 * self.scale * env * bilobe * a_scale
                P_anth[i] = fp3 + s_along * a_axis + ra[:, None] * (
                    np.cos(th_a[i])[:, None] * a_n1 + np.sin(th_a[i])[:, None] * a_n2
                )
                grain = 0.5 + 0.5 * np.sin(18.0 * ua[i] + 6.0 * th_a[i])[:, None]
                C_anth[i] = (1.0 - 0.40 * grain) * c_p1 + (0.40 * grain) * c_p2

            P_anth_world = self.center + P_anth @ self.basis.T
            ap00 = P_anth_world[:-1, :-1]
            ap10 = P_anth_world[1:, :-1]
            ap11 = P_anth_world[1:, 1:]
            ap01 = P_anth_world[:-1, 1:]
            normals_anth = normalize_v3(np.cross(0.5 * ((ap01 - ap00) + (ap11 - ap10)), 0.5 * ((ap10 - ap00) + (ap11 - ap01))))
            C_face_anth = 0.25 * (C_anth[:-1, :-1] + C_anth[1:, :-1] + C_anth[1:, 1:] + C_anth[:-1, 1:])

            result.append({
                "kind": "anther",
                "P": P_anth_world,
                "normals": normals_anth,
                "C_face": C_face_anth,
                "papillae": [],
                "sss": 0.22,
                "spec": 0.15,
                "shininess": 10.0
            })

        return result


class Pistil:
    """
    Represents the central pistil (style + 3-lobed velvety stigma).
    Gracefully stands taller than the stamens at the exact flower center.
    """
    def __init__(self, center, basis, scale, t_start, t_end, coarse=False):
        self.center = np.array(center, dtype=np.float32)
        self.basis = np.array(basis, dtype=np.float32)
        self.scale = float(scale)
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.coarse = coarse

        self.Nu = 14 if self.coarse else 20
        self.Nv = 6 if self.coarse else 8

    def get_mesh_at_time(self, t):
        if t < self.t_start:
            return None

        ext = smootherstep(self.t_start, self.t_end, t)
        if ext < 0.01:
            return None

        u = np.linspace(0.0, 1.0, self.Nu, dtype=np.float32)
        v = np.linspace(-1.0, 1.0, self.Nv, dtype=np.float32)
        U, V = np.meshgrid(u, v, indexing='ij')
        theta = (V + 1.0) * math.pi

        p0 = np.array([0.00, 0.00, 0.00], dtype=np.float32)
        p1 = np.array([0.02, 0.35 * ext, 0.03], dtype=np.float32) * self.scale
        p2 = np.array([0.03, 0.72 * ext, 0.06], dtype=np.float32) * self.scale
        p3 = np.array([0.02, 1.02 * ext, 0.12], dtype=np.float32) * self.scale
        pos, tan = eval_cubic_bezier(p0, p1, p2, p3, u)
        T = normalize_v3(tan)
        N1, N2 = compute_bishop_frame(T)

        P = np.zeros((self.Nu, self.Nv, 3), dtype=np.float32)
        C = np.zeros((self.Nu, self.Nv, 3), dtype=np.float32)
        c_green = np.array([0.50, 0.74, 0.28], dtype=np.float32)
        c_stigma = np.array([0.60, 0.18, 0.32], dtype=np.float32)

        for i in range(self.Nu):
            base_r = self.scale * 0.020 * (1.0 - 0.22 * u[i]) * min(1.0, ext * 1.4)
            if u[i] > 0.84:
                sw = math.sin(math.pi * (float(u[i]) - 0.84) / 0.16)
                lobe = 1.0 + 0.45 * np.cos(3.0 * theta[i])
                r = base_r + self.scale * 0.022 * sw * lobe * smootherstep(0.5, 1.0, ext)
            else:
                r = np.full_like(theta[i], base_r)
            P[i] = pos[i] + r[:, None] * (np.cos(theta[i])[:, None] * N1[i] + np.sin(theta[i])[:, None] * N2[i])
            mix = smoothstep(0.82, 0.92, u[i])
            C[i] = (1.0 - mix) * c_green + mix * c_stigma

        P_world = self.center + P @ self.basis.T
        p00 = P_world[:-1, :-1]
        p10 = P_world[1:, :-1]
        p11 = P_world[1:, 1:]
        p01 = P_world[:-1, 1:]
        normals = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))
        C_face = 0.25 * (C[:-1, :-1] + C[1:, :-1] + C[1:, 1:] + C[:-1, 1:])

        return {
            "kind": "pistil",
            "P": P_world,
            "normals": normals,
            "C_face": C_face,
            "papillae": [],
            "sss": 0.32,
            "spec": 0.35,
            "shininess": 26.0
        }


class Stem:
    """
    3D tubular stem or branching pedicel swept along a cubic Bezier spline
    with progressive, drawing-on sprouting growth.
    """
    def __init__(self, p0, p1, p2, p3, r_base, r_tip, t_start, t_end, coarse=False):
        self.p0 = np.array(p0, dtype=np.float32)
        self.p1 = np.array(p1, dtype=np.float32)
        self.p2 = np.array(p2, dtype=np.float32)
        self.p3 = np.array(p3, dtype=np.float32)
        self.r_base = float(r_base)
        self.r_tip = float(r_tip)
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.coarse = coarse

        self.Nu = 16 if self.coarse else 24
        self.Nv = 6 if self.coarse else 8

    def get_mesh_at_time(self, t):
        if t < self.t_start:
            return None

        # Growth fraction along the spline
        grow = smootherstep(self.t_start, self.t_end, t)
        if grow < 0.015:
            return None

        u_eval = np.linspace(0.0, grow, self.Nu, dtype=np.float32)
        v = np.linspace(-1.0, 1.0, self.Nv, dtype=np.float32)
        U, V = np.meshgrid(u_eval, v, indexing='ij')
        theta = (V + 1.0) * math.pi

        pos, tan = eval_cubic_bezier(self.p0, self.p1, self.p2, self.p3, u_eval)
        T = normalize_v3(tan)
        N1, N2 = compute_bishop_frame(T)

        P = np.zeros((self.Nu, self.Nv, 3), dtype=np.float32)
        C = np.zeros((self.Nu, self.Nv, 3), dtype=np.float32)
        c_base = np.array([0.14, 0.34, 0.14], dtype=np.float32)
        c_tip = np.array([0.34, 0.58, 0.22], dtype=np.float32)

        for i in range(self.Nu):
            u_norm = u_eval[i]
            r = self.r_base * (1.0 - u_norm) + self.r_tip * u_norm
            # Rounded tip dome during sprouting
            if i == self.Nu - 1 and grow < 0.99:
                r *= 0.6
            P[i] = pos[i] + r * (np.cos(theta[i])[:, None] * N1[i] + np.sin(theta[i])[:, None] * N2[i])
            C[i] = (1.0 - u_norm) * c_base + u_norm * c_tip

        p00 = P[:-1, :-1]
        p10 = P[1:, :-1]
        p11 = P[1:, 1:]
        p01 = P[:-1, 1:]
        normals = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))
        C_face = 0.25 * (C[:-1, :-1] + C[1:, :-1] + C[1:, 1:] + C[:-1, 1:])

        return {
            "kind": "stem",
            "P": P,
            "normals": normals,
            "C_face": C_face,
            "papillae": [],
            "sss": 0.22,
            "spec": 0.24,
            "shininess": 18.0
        }


class Leaf:
    """
    Lanceolate (lance-shaped) lily leaf that unfurls, rotates, and arches outward
    from the stem node as the stem sprouts past it.
    """
    def __init__(self, origin, azimuth, length, width, arch, twist, t_start, t_end, coarse=False):
        self.origin = np.array(origin, dtype=np.float32)
        self.azimuth = float(azimuth)
        self.length = float(length)
        self.width = float(width)
        self.arch = float(arch)
        self.twist = float(twist)
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.coarse = coarse

        self.Nu = 16 if self.coarse else 22
        self.Nv = 9 if self.coarse else 11
        u = np.linspace(0.0, 1.0, self.Nu, dtype=np.float32)
        v = np.linspace(-1.0, 1.0, self.Nv, dtype=np.float32)
        self.U, self.V = np.meshgrid(u, v, indexing='ij')

        # Coloration
        c_dark = np.array([0.08, 0.26, 0.12], dtype=np.float32)
        c_mid = np.array([0.16, 0.44, 0.18], dtype=np.float32)
        c_vein = np.array([0.34, 0.64, 0.28], dtype=np.float32)

        midrib_mask = np.exp(-((self.V / 0.10) ** 2))[..., None]
        edge_grad = (np.abs(self.V) ** 1.4)[..., None]
        C = (1.0 - edge_grad) * c_mid + edge_grad * c_dark
        self.C = C * (1.0 - 0.45 * midrib_mask) + c_vein * (0.45 * midrib_mask)

    def get_mesh_at_time(self, t):
        if t < self.t_start:
            return None

        p = smootherstep(self.t_start, self.t_end, t)
        if p < 0.02:
            return None

        # Leaf unfurl: expands in length and width, while relaxing into natural drooping arch
        cur_len = self.length * p
        cur_wid = self.width * (0.15 + 0.85 * p)
        cur_arch = self.arch * (p ** 1.2)

        w_prof = (
            cur_wid * (np.maximum(0.0, np.sin(math.pi * (self.U ** 0.66))) ** 0.90) * (1.0 - 0.12 * self.U)
            + 0.10 * cur_wid * ((1.0 - self.U) ** 3)
        )
        reach = cur_len * (0.90 * self.U + 0.10 * np.sin(0.5 * math.pi * self.U))
        elev = cur_len * (0.45 * self.U - cur_arch * (self.U ** 2.1))
        fold = 0.050 * cur_wid * (np.abs(self.V) ** 1.35) * (1.0 - 0.45 * self.U)
        tw = self.twist * (self.U ** 1.35)

        x_loc = w_prof * self.V * np.cos(tw) - fold * np.sin(tw)
        z_loc = elev + w_prof * self.V * np.sin(tw) + fold * np.cos(tw)
        y_loc = reach

        P_local = np.stack([x_loc, z_loc, y_loc], axis=-1)
        rot = rot_y(self.azimuth)
        P_world = self.origin + P_local @ rot.T

        p00 = P_world[:-1, :-1]
        p10 = P_world[1:, :-1]
        p11 = P_world[1:, 1:]
        p01 = P_world[:-1, 1:]
        normals = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))
        C_face = 0.25 * (self.C[:-1, :-1] + self.C[1:, :-1] + self.C[1:, 1:] + self.C[:-1, 1:])

        return {
            "kind": "leaf",
            "P": P_world,
            "normals": normals,
            "C_face": C_face,
            "papillae": [],
            "sss": 0.28,
            "spec": 0.32,
            "shininess": 22.0
        }


class LilyBud:
    """
    Sculpted 3D botanical unopened or cracking lily bud with 3 ribbed sepals.
    """
    def __init__(self, center, direction, scale, palette, t_start, t_end, coarse=False):
        self.center = np.array(center, dtype=np.float32)
        self.direction = normalize_v3(np.array(direction, dtype=np.float32))
        self.scale = float(scale)
        self.palette = palette
        self.t_start = float(t_start)
        self.t_end = float(t_end)
        self.coarse = coarse

        self.basis = build_basis_from_dir(self.direction)
        self.Nu = 16 if self.coarse else 22
        self.Nv = 8 if self.coarse else 12

        u = np.linspace(0.0, 1.0, self.Nu, dtype=np.float32)
        v = np.linspace(-1.0, 1.0, self.Nv, dtype=np.float32)
        self.U, self.V = np.meshgrid(u, v, indexing='ij')
        theta = (self.V + 1.0) * math.pi

        length = 0.90 * self.scale
        r_prof = (
            0.20 * self.scale * (np.maximum(0.0, np.sin(math.pi * (self.U ** 0.66))) ** 1.10) * (1.0 - 0.12 * self.U)
            + 0.026 * self.scale * ((1.0 - self.U) ** 2)
        )
        rib = 1.0 + 0.08 * np.cos(3.0 * theta) * np.maximum(0.0, np.sin(math.pi * self.U))
        R = r_prof * rib
        Y = length * self.U

        px = R * np.cos(theta)
        pz = R * np.sin(theta)
        py = Y
        self.P_local = np.stack([px, py, pz], axis=-1)

        c_green = np.array([0.32, 0.60, 0.20], dtype=np.float32)
        c_rose = self.palette["c_blush"]
        c_tip = self.palette["c_tip"]

        rose_mix = smoothstep(0.25, 0.70, self.U)[..., None]
        tip_mix = smoothstep(0.78, 0.98, self.U)[..., None]
        C = (1.0 - rose_mix) * c_green + rose_mix * c_rose
        self.C = (1.0 - tip_mix) * C + tip_mix * c_tip

    def get_mesh_at_time(self, t):
        if t < self.t_start:
            return None

        # Bud swells into view
        grow = smootherstep(self.t_start, self.t_end, t)
        if grow < 0.02:
            return None

        P_world = self.center + (self.P_local * grow) @ self.basis.T
        p00 = P_world[:-1, :-1]
        p10 = P_world[1:, :-1]
        p11 = P_world[1:, 1:]
        p01 = P_world[:-1, 1:]
        normals = normalize_v3(np.cross(0.5 * ((p01 - p00) + (p11 - p10)), 0.5 * ((p10 - p00) + (p11 - p01))))
        C_face = 0.25 * (self.C[:-1, :-1] + self.C[1:, :-1] + self.C[1:, 1:] + self.C[:-1, 1:])

        return {
            "kind": "bud",
            "P": P_world,
            "normals": normals,
            "C_face": C_face,
            "papillae": [],
            "sss": 0.32,
            "spec": 0.28,
            "shininess": 20.0
        }


class Lily:
    """
    Composite flower entity representing either a full bloom, half-open trumpet,
    or unopened/cracking botanical bud, complete with pedicel and floral organs.
    """
    def __init__(self, center, direction, scale, openness, stage, palette,
                 t_sprout, t_bloom, seed=42, coarse=False):
        self.center = np.array(center, dtype=np.float32)
        self.direction = normalize_v3(np.array(direction, dtype=np.float32))
        self.scale = float(scale)
        self.openness = float(openness)
        self.stage = stage  # 'full', 'half', 'bud'
        self.palette = palette
        self.t_sprout = float(t_sprout)
        self.t_bloom = float(t_bloom)
        self.seed = int(seed)
        self.coarse = coarse

        self.basis = build_basis_from_dir(self.direction)
        self.components = []
        self._assemble()

    def _assemble(self):
        if self.stage == "bud":
            bud = LilyBud(
                center=self.center, direction=self.direction, scale=self.scale,
                palette=self.palette, t_start=self.t_sprout, t_end=self.t_bloom, coarse=self.coarse
            )
            self.components.append(bud)
        else:
            rot_offset = (self.seed % 100) * 0.03
            # 1. Outer Whorl: 3 Outer Sepals
            for k in range(3):
                az = rot_offset + k * (2.0 * math.pi / 3.0)
                stagger = 0.14 * k
                p = Petal(
                    center=self.center, basis=self.basis, azimuth=az, is_inner=False,
                    scale=self.scale, openness=self.openness, palette=self.palette,
                    t_start=self.t_bloom + stagger, t_end=self.t_bloom + 2.8 + stagger,
                    seed=self.seed + k, coarse=self.coarse
                )
                self.components.append(p)

            # 2. Inner Whorl: 3 Inner Petals
            for k in range(3):
                az = rot_offset + (k + 0.5) * (2.0 * math.pi / 3.0)
                stagger = 0.24 + 0.14 * k
                p = Petal(
                    center=self.center, basis=self.basis, azimuth=az, is_inner=True,
                    scale=self.scale, openness=self.openness, palette=self.palette,
                    t_start=self.t_bloom + stagger, t_end=self.t_bloom + 3.0 + stagger,
                    seed=self.seed + 10 + k, coarse=self.coarse
                )
                self.components.append(p)

            # 3. Androecium: 6 Stamens
            for k in range(6):
                az = rot_offset + k * (math.pi / 3.0) + 0.25
                st_delay = 0.08 * k
                s = Stamen(
                    center=self.center, basis=self.basis, azimuth=az, scale=self.scale,
                    palette=self.palette, t_start=self.t_bloom + 1.8 + st_delay,
                    t_end=self.t_bloom + 3.4 + st_delay, coarse=self.coarse
                )
                self.components.append(s)

            # 4. Gynoecium: 1 Central Pistil
            pistil = Pistil(
                center=self.center, basis=self.basis, scale=self.scale,
                t_start=self.t_bloom + 1.6, t_end=self.t_bloom + 3.2, coarse=self.coarse
            )
            self.components.append(pistil)

    def get_meshes_at_time(self, t):
        result = []
        for c in self.components:
            m = c.get_mesh_at_time(t)
            if m is not None:
                if isinstance(m, list):
                    result.extend(m)
                else:
                    result.append(m)
        return result


class Bouquet:
    """
    Orchestrates the entire bouquet of 5 to 7 Oriental lilies,
    stems, branching pedicels, and rich foliage with proportional timeline scaling.
    """
    def __init__(self, flower_count=6, palette_name="pink", duration=13.0, seed=42, coarse=False):
        self.flower_count = max(5, min(7, flower_count))
        self.palette = get_color_palette(palette_name)
        self.duration = float(duration)
        self.seed = int(seed)
        self.coarse = coarse

        # Timeline scaling factor relative to baseline 13.0s
        self.t_scale = self.duration / 13.0
        self.elements = []
        self._assemble()

    def _assemble(self):
        s = self.t_scale

        # 1. Main Vascular Stems
        stem_specs = [
            (np.array([0.02, -2.60, 0.02]), np.array([0.08, -1.30, 0.05]),
             np.array([0.12, -0.30, 0.04]), np.array([0.08, 0.40, 0.10]), 0.048, 0.034, 0.0 * s, 2.0 * s),
            (np.array([-0.05, -2.60, -0.04]), np.array([-0.14, -1.20, -0.05]),
             np.array([-0.18, -0.10, -0.02]), np.array([-0.15, 0.85, -0.04]), 0.046, 0.032, 0.2 * s, 2.2 * s),
            (np.array([0.00, -2.60, -0.08]), np.array([-0.04, -1.35, -0.10]),
             np.array([0.02, -0.20, -0.08]), np.array([0.03, 1.30, -0.10]), 0.042, 0.028, 0.4 * s, 2.4 * s),
        ]

        stem_splines = []
        for p0, p1, p2, p3, rb, rt, t0, t1 in stem_specs:
            st = Stem(p0, p1, p2, p3, rb, rt, t0, t1, coarse=self.coarse)
            self.elements.append(st)
            u_eval = np.linspace(0.0, 1.0, 30)
            pos_arr, _ = eval_cubic_bezier(p0, p1, p2, p3, u_eval)
            stem_splines.append(pos_arr)

        # 2. Branching Pedicels
        pedicel_specs = [
            (np.array([0.10, 0.12, 0.06]), np.array([0.18, 0.24, 0.14]),
             np.array([0.22, 0.32, 0.22]), np.array([0.26, 0.38, 0.28]), 0.030, 0.025, 1.2 * s, 2.6 * s),
            (np.array([-0.16, 0.55, -0.03]), np.array([-0.24, 0.70, 0.04]),
             np.array([-0.30, 0.82, 0.10]), np.array([-0.35, 0.92, 0.14]), 0.028, 0.024, 1.4 * s, 2.8 * s),
            (np.array([-0.14, -0.42, -0.04]), np.array([-0.24, -0.32, 0.05]),
             np.array([-0.32, -0.22, 0.12]), np.array([-0.38, -0.15, 0.16]), 0.027, 0.023, 1.5 * s, 2.9 * s),
            (np.array([0.02, 1.15, -0.09]), np.array([0.05, 1.32, -0.06]),
             np.array([0.07, 1.48, -0.04]), np.array([0.08, 1.62, -0.02]), 0.025, 0.021, 1.6 * s, 3.0 * s),
            (np.array([0.08, 0.38, 0.10]), np.array([0.26, 0.70, 0.02]),
             np.array([0.40, 0.98, -0.04]), np.array([0.48, 1.18, -0.08]), 0.025, 0.021, 1.7 * s, 3.1 * s),
            (np.array([0.05, -0.80, -0.02]), np.array([0.18, -0.65, 0.06]),
             np.array([0.28, -0.52, 0.12]), np.array([0.34, -0.42, 0.16]), 0.026, 0.022, 1.6 * s, 3.0 * s),
            (np.array([-0.08, 0.10, -0.06]), np.array([-0.18, 0.25, -0.02]),
             np.array([-0.25, 0.38, 0.04]), np.array([-0.30, 0.48, 0.08]), 0.026, 0.022, 1.8 * s, 3.2 * s),
        ]
        for p0, p1, p2, p3, rb, rt, t0, t1 in pedicel_specs[:self.flower_count]:
            ped = Stem(p0, p1, p2, p3, rb, rt, t0, t1, coarse=self.coarse)
            self.elements.append(ped)

        # 3. Lanceolate Leaves (unfurl progressively)
        leaf_specs = [
            (0, 4,   0.45, 0.92, 0.17, 0.35,  0.20, 0.9 * s),
            (0, 9,   2.35, 1.00, 0.18, 0.36, -0.16, 1.3 * s),
            (0, 14, -1.15, 1.04, 0.19, 0.33,  0.22, 1.6 * s),
            (0, 19,  0.85, 0.94, 0.17, 0.30, -0.18, 1.9 * s),
            (0, 24, -0.55, 0.84, 0.16, 0.27,  0.14, 2.2 * s),
            (1, 6,  -2.25, 0.94, 0.17, 0.35, -0.20, 1.2 * s),
            (1, 12,  3.05, 1.02, 0.18, 0.34,  0.16, 1.5 * s),
            (1, 18, -1.65, 0.98, 0.18, 0.32, -0.22, 1.8 * s),
            (1, 24,  2.25, 0.88, 0.16, 0.29,  0.18, 2.1 * s),
            (2, 8,  -0.25, 0.88, 0.16, 0.34,  0.15, 1.4 * s),
            (2, 15,  1.25, 0.92, 0.17, 0.31, -0.18, 1.7 * s),
            (2, 22, -2.85, 0.82, 0.15, 0.28,  0.16, 2.0 * s),
        ]
        for s_idx, u_idx, az, l_len, l_wid, arch, tw, t0 in leaf_specs:
            origin = stem_splines[s_idx][u_idx]
            leaf = Leaf(origin, az, l_len, l_wid, arch, tw, t_start=t0, t_end=t0 + 2.0 * s, coarse=self.coarse)
            self.elements.append(leaf)

        # 4. Flower Configurations (Full Blooms, Trumpets, Buds)
        flower_configs = [
            # 1. Hero Center-Right (Full open bloom)
            {
                "center": np.array([0.26, 0.38, 0.28]),
                "dir": np.array([0.20, 0.48, 0.85]),
                "scale": 0.92, "openness": 1.00, "stage": "full",
                "t_sprout": 2.0 * s, "t_bloom": 3.4 * s, "seed": 101
            },
            # 2. Hero Upper-Left (Full open bloom)
            {
                "center": np.array([-0.35, 0.92, 0.14]),
                "dir": np.array([-0.25, 0.55, 0.79]),
                "scale": 0.86, "openness": 0.95, "stage": "full",
                "t_sprout": 2.4 * s, "t_bloom": 4.0 * s, "seed": 202
            },
            # 3. Lower-Left Accent (Half-open trumpet bloom)
            {
                "center": np.array([-0.38, -0.15, 0.16]),
                "dir": np.array([-0.32, 0.44, 0.84]),
                "scale": 0.78, "openness": 0.80, "stage": "half",
                "t_sprout": 2.8 * s, "t_bloom": 4.6 * s, "seed": 303
            },
            # 4. Top Crown Bud (Cracking tip with petal color peeking)
            {
                "center": np.array([0.08, 1.62, -0.02]),
                "dir": np.array([0.06, 0.95, 0.16]),
                "scale": 0.80, "openness": 0.20, "stage": "bud",
                "t_sprout": 2.8 * s, "t_bloom": 5.0 * s, "seed": 404
            },
            # 5. Right Flank Bud (Gracefully tilted)
            {
                "center": np.array([0.48, 1.18, -0.08]),
                "dir": np.array([0.38, 0.88, 0.14]),
                "scale": 0.75, "openness": 0.15, "stage": "bud",
                "t_sprout": 3.0 * s, "t_bloom": 5.2 * s, "seed": 505
            },
            # 6. Lower Right Bloom (for 6+ bouquet)
            {
                "center": np.array([0.34, -0.42, 0.16]),
                "dir": np.array([0.30, 0.45, 0.84]),
                "scale": 0.74, "openness": 0.85, "stage": "half",
                "t_sprout": 2.9 * s, "t_bloom": 4.8 * s, "seed": 606
            },
            # 7. Mid-Center Trumpet (for 7 bouquet)
            {
                "center": np.array([-0.30, 0.48, 0.08]),
                "dir": np.array([-0.18, 0.60, 0.78]),
                "scale": 0.72, "openness": 0.78, "stage": "half",
                "t_sprout": 3.2 * s, "t_bloom": 5.4 * s, "seed": 707
            },
        ]

        active_flowers = flower_configs[:self.flower_count]
        for f in active_flowers:
            lily = Lily(
                center=f["center"], direction=f["dir"], scale=f["scale"],
                openness=f["openness"], stage=f["stage"], palette=self.palette,
                t_sprout=f["t_sprout"], t_bloom=f["t_bloom"], seed=f["seed"],
                coarse=self.coarse
            )
            self.elements.append(lily)

    def get_all_meshes_at_time(self, t):
        all_meshes = []
        for el in self.elements:
            if isinstance(el, Lily):
                all_meshes.extend(el.get_meshes_at_time(t))
            else:
                m = el.get_mesh_at_time(t)
                if m is not None:
                    all_meshes.append(m)
        return all_meshes


# ============================================================================
# 4. RENDERER ENGINE: SHADING, PARTICLES, CAMERA DRIFT, POST-PROCESSING
# ============================================================================

class Renderer:
    """
    Cinematic 3D Video Renderer for Instagram Reel 9:16 format.
    Handles physical lighting, Subsurface Scattering, anti-aliased subpixel
    quad rasterization, camera drift, breeze sway, floating pollen, and video encoding.
    """
    SUBPIX_SHIFT = 3
    SUBPIX_SCALE = 1 << SUBPIX_SHIFT

    def __init__(self, width=1080, height=1920, fps=30, duration=13.0,
                 output_path="lily_reel.mp4", show_title=False, coarse=False):
        self.width = width
        self.height = height
        self.fps = fps
        self.duration = duration
        self.total_frames = int(round(fps * duration))
        self.output_path = output_path
        self.show_title = show_title
        self.coarse = coarse

        self.backdrop = self._precompute_backdrop()
        self.ffmpeg_exe = self._resolve_ffmpeg()

    def _resolve_ffmpeg(self):
        """Finds FFmpeg via imageio-ffmpeg or system PATH."""
        if HAS_IMAGEIO_FFMPEG:
            try:
                exe = imageio_ffmpeg.get_ffmpeg_exe()
                if os.path.exists(exe):
                    return exe
            except Exception:
                pass
        exe = shutil.which("ffmpeg")
        return exe

    def _precompute_backdrop(self):
        """Precompute luxury deep studio background with subtle warm radial gradient."""
        y = np.linspace(-1.0, 1.0, self.height, dtype=np.float32)[:, None]
        x = np.linspace(-1.0, 1.0, self.width, dtype=np.float32)[None, :]
        r2 = (x * 0.95) ** 2 + ((y + 0.08) * 0.75) ** 2
        glow = np.exp(-1.60 * r2)
        upper_warmth = np.exp(-2.2 * ((x - 0.15) ** 2 + (y + 0.32) ** 2))

        b = 14.0 + 24.0 * glow + 12.0 * upper_warmth
        g = 12.0 + 22.0 * glow + 10.0 * upper_warmth
        r = 16.0 + 26.0 * glow + 22.0 * upper_warmth

        bg = np.stack([b, g, r], axis=-1)
        return np.clip(bg, 0, 255).astype(np.uint8)

    def _compute_lighting(self, normals_cam, base_rgb, sss_strength, spec_strength, shininess):
        """
        Botanical multi-light studio shader:
        - Key light (warm high sunlight)
        - Fill light (cool botanical ambient)
        - Translucent Subsurface Scattering (SSS) through petals
        - Cuticle Blinn-Phong specular sheen
        """
        L_key = normalize_v3(np.array([-0.42, 0.62, 0.66], dtype=np.float32))
        L_fill = normalize_v3(np.array([0.65, -0.20, 0.73], dtype=np.float32))
        V_dir = np.array([0.0, 0.0, 1.0], dtype=np.float32)

        nz = normals_cam[..., 2:3]
        N = np.where(nz < 0.0, -normals_cam, normals_cam)

        ndotl_key = np.sum(N * L_key, axis=-1, keepdims=True)
        diff_key = np.clip((ndotl_key + 0.25) / 1.25, 0.0, 1.0)

        ndotl_fill = np.sum(N * L_fill, axis=-1, keepdims=True)
        diff_fill = np.clip((ndotl_fill + 0.40) / 1.40, 0.0, 1.0)

        ndotv = np.clip(np.sum(N * V_dir, axis=-1, keepdims=True), 0.0, 1.0)
        fresnel_rim = (1.0 - ndotv) ** 2.2
        back_trans = np.clip(-ndotl_key * 0.6 + 0.45, 0.0, 1.0)
        sss = sss_strength * (0.55 * fresnel_rim + 0.45 * back_trans)

        H_key = normalize_v3(L_key + V_dir)
        ndoth = np.clip(np.sum(N * H_key, axis=-1, keepdims=True), 0.0, 1.0)
        spec = spec_strength * (ndoth ** shininess)

        key_col = np.array([1.04, 1.01, 0.98], dtype=np.float32)
        fill_col = np.array([0.78, 0.86, 0.95], dtype=np.float32)
        sss_col = np.array([1.05, 0.82, 0.88], dtype=np.float32)

        lit_rgb = (
            base_rgb * (0.24 + 0.72 * diff_key * key_col + 0.22 * diff_fill * fill_col)
            + base_rgb * sss * sss_col
            + spec * np.array([1.0, 0.98, 0.95], dtype=np.float32)
        )
        lit_rgb = np.clip(lit_rgb, 0.0, 1.35)
        lit_rgb = lit_rgb / (1.0 + 0.18 * lit_rgb) * 1.14
        return np.clip(lit_rgb, 0.0, 1.0)

    def _project(self, P_world, cam_rot, cam_target, cam_dist, fov_scale):
        """Perspective 3D to 2D projection into vertical 9:16 frame coordinates."""
        P_rel = (P_world - cam_target) @ cam_rot.T
        z_depth = cam_dist - P_rel[..., 2]
        z_safe = np.maximum(z_depth, 0.2)
        sx = (self.width * 0.5) + (P_rel[..., 0] / z_safe) * fov_scale
        sy = (self.height * 0.53) - (P_rel[..., 1] / z_safe) * fov_scale
        return sx, sy, z_depth

    def render_frame(self, frame_idx, bouquet):
        """Render a single frame at frame_idx (0 to total_frames - 1)."""
        t = (frame_idx / max(1, self.total_frames - 1)) * self.duration
        canvas = self.backdrop.copy()

        # 1. Camera Drift & Orbit Trajectory
        p_all = frame_idx / max(1, self.total_frames - 1)
        azimuth = -0.26 + 0.50 * smootherstep(0.0, 0.80, p_all) + 0.15 * math.sin(
            max(0.0, (p_all - 0.70) / 0.30) * math.pi
        )
        elevation = 0.06 + 0.08 * smootherstep(0.10, 0.65, p_all) - 0.03 * smootherstep(0.75, 1.0, p_all)
        cam_rot = rot_x(elevation) @ rot_y(azimuth)

        y_target = -0.45 * (1.0 - smootherstep(0.0, 0.35, p_all)) + 0.22 * smootherstep(0.15, 0.55, p_all)
        cam_target = np.array([-0.02, y_target, 0.08], dtype=np.float32)
        cam_dist = 5.00 - 0.22 * smootherstep(0.20, 0.85, p_all)
        fov_scale = 1650.0 * (self.width / 1080.0)

        # 2. Gentle Idle Breeze Physics
        breeze_x = 0.022 * math.sin(t * 1.45) + 0.012 * math.sin(t * 2.8)
        breeze_z = 0.018 * math.cos(t * 1.25)

        # 3. Retrieve Active Meshes at Time t
        active_meshes = bouquet.get_all_meshes_at_time(t)

        quad_pts_list = []
        quad_z_list = []
        quad_bgr_list = []
        papilla_draw_list = []

        for mesh in active_meshes:
            P = mesh["P"]
            # Apply idle wind sway on top parts
            if t > (5.0 * bouquet.t_scale):
                h_factor = np.clip((P[..., 1:2] + 1.0) / 2.5, 0.0, 1.0) ** 1.5
                P = P + h_factor * np.array([breeze_x, 0.0, breeze_z], dtype=np.float32)

            normals_cam = mesh["normals"] @ cam_rot.T
            sx, sy, z_depth = self._project(P, cam_rot, cam_target, cam_dist, fov_scale)

            lit_rgb = self._compute_lighting(
                normals_cam, mesh["C_face"], mesh["sss"], mesh["spec"], mesh["shininess"]
            )

            q_x = np.stack([sx[:-1, :-1], sx[1:, :-1], sx[1:, 1:], sx[:-1, 1:]], axis=-1)
            q_y = np.stack([sy[:-1, :-1], sy[1:, :-1], sy[1:, 1:], sy[:-1, 1:]], axis=-1)

            # Slight seam-expansion to prevent subpixel cracking between quads
            cx_q = np.mean(q_x, axis=-1, keepdims=True)
            cy_q = np.mean(q_y, axis=-1, keepdims=True)
            dx_q = q_x - cx_q
            dy_q = q_y - cy_q
            d_len = np.maximum(np.hypot(dx_q, dy_q), 1e-4)
            q_x_exp = q_x + (dx_q / d_len) * 0.55
            q_y_exp = q_y + (dy_q / d_len) * 0.55

            pts_sub = np.stack([q_x_exp, q_y_exp], axis=-1).reshape(-1, 4, 2)
            pts_int = np.rint(pts_sub * self.SUBPIX_SCALE).astype(np.int32)
            z_q = 0.25 * (z_depth[:-1, :-1] + z_depth[1:, :-1] + z_depth[1:, 1:] + z_depth[:-1, 1:]).flatten()
            bgr_q = np.rint(lit_rgb.reshape(-1, 3)[..., ::-1] * 255.0).astype(np.uint8)

            quad_pts_list.append(pts_int)
            quad_z_list.append(z_q)
            quad_bgr_list.append(bgr_q)

            # Papillae (freckles)
            for u_i, v_i, rad, core_bgr, rim_bgr in mesh["papillae"]:
                nz_val = float(normals_cam[min(u_i, normals_cam.shape[0] - 1),
                                           min(v_i, normals_cam.shape[1] - 1), 2])
                if abs(nz_val) > 0.12:
                    px_i = int(round(float(sx[u_i, v_i])))
                    py_i = int(round(float(sy[u_i, v_i])))
                    dx_u = float(sx[min(u_i + 1, sx.shape[0] - 1), v_i] - sx[max(u_i - 1, 0), v_i])
                    dy_u = float(sy[min(u_i + 1, sy.shape[0] - 1), v_i] - sy[max(u_i - 1, 0), v_i])
                    ang_deg = math.degrees(math.atan2(dy_u, dx_u))
                    rad_scale = self.width / 1080.0
                    r_maj = max(2, int(round(rad * rad_scale * 1.15)))
                    r_min = max(1, int(round(rad * rad_scale * 0.75)))
                    pz_d = float(z_depth[u_i, v_i]) - 0.03
                    papilla_draw_list.append((pz_d, px_i, py_i, r_maj, r_min, ang_deg, core_bgr, rim_bgr))

        # 4. Painter's Depth-Sorting & Anti-Aliased Subpixel Rasterization
        if quad_pts_list:
            all_pts = np.concatenate(quad_pts_list, axis=0)
            all_z = np.concatenate(quad_z_list, axis=0)
            all_bgr = np.concatenate(quad_bgr_list, axis=0).tolist()

            order = np.argsort(all_z)[::-1]
            papilla_draw_list.sort(key=lambda x: x[0], reverse=True)
            n_pap = len(papilla_draw_list)
            p_ptr = 0

            for idx in order:
                qz = float(all_z[idx])
                while p_ptr < n_pap and papilla_draw_list[p_ptr][0] >= qz:
                    _, px_i, py_i, r_maj, r_min, ang_deg, core_bgr, rim_bgr = papilla_draw_list[p_ptr]
                    cv2.ellipse(canvas, (px_i, py_i), (r_maj + 1, r_min + 1), ang_deg, 0, 360, rim_bgr, -1, lineType=cv2.LINE_AA)
                    cv2.ellipse(canvas, (px_i, py_i), (r_maj, r_min), ang_deg, 0, 360, core_bgr, -1, lineType=cv2.LINE_AA)
                    p_ptr += 1

                cv2.fillConvexPoly(
                    canvas, all_pts[idx], all_bgr[idx],
                    lineType=cv2.LINE_AA, shift=self.SUBPIX_SHIFT
                )

            while p_ptr < n_pap:
                _, px_i, py_i, r_maj, r_min, ang_deg, core_bgr, rim_bgr = papilla_draw_list[p_ptr]
                cv2.ellipse(canvas, (px_i, py_i), (r_maj + 1, r_min + 1), ang_deg, 0, 360, rim_bgr, -1, lineType=cv2.LINE_AA)
                cv2.ellipse(canvas, (px_i, py_i), (r_maj, r_min), ang_deg, 0, 360, core_bgr, -1, lineType=cv2.LINE_AA)
                p_ptr += 1

        # 5. Floating Golden Pollen Particles (Cinematic Motes)
        particle_layer = np.zeros_like(canvas)
        rng_p = np.random.RandomState(88)
        n_pollen = 50
        p_pos = rng_p.uniform([-1.0, -1.6, -0.8], [1.0, 1.8, 0.8], size=(n_pollen, 3)).astype(np.float32)
        p_phase = rng_p.uniform(0.0, 2.0 * math.pi, size=n_pollen)
        p_pos[:, 1] += 0.16 * t + 0.08 * np.sin(t * 1.4 + p_phase)
        p_pos[:, 1] = ((p_pos[:, 1] + 1.6) % 3.4) - 1.6
        p_pos[:, 0] += 0.06 * np.cos(t * 1.1 + p_phase)

        psx, psy, pzd = self._project(p_pos, cam_rot, cam_target, cam_dist, fov_scale)
        for i in range(n_pollen):
            px, py = int(round(psx[i])), int(round(psy[i]))
            if 0 <= px < self.width and 0 <= py < self.height:
                twinkle = 0.4 + 0.6 * math.sin(t * 2.6 + p_phase[i])
                rad = max(1, int(round((1.5 + 2.0 * (i % 3)) * (4.5 / max(2.5, pzd[i])) * (self.width / 1080.0))))
                col = (int(90 * twinkle), int(170 * twinkle), int(235 * twinkle))
                cv2.circle(particle_layer, (px, py), rad, col, -1, lineType=cv2.LINE_AA)

        p_blur = cv2.GaussianBlur(particle_layer, (0, 0), sigmaX=3.0)
        canvas = cv2.addWeighted(canvas, 1.0, p_blur, 0.80, 0.0)
        canvas = cv2.addWeighted(canvas, 1.0, particle_layer, 0.50, 0.0)

        # 6. Soft Bloom on High Luminance Highlights
        bright = np.maximum(canvas.astype(np.float32) - 190.0, 0.0).astype(np.uint8)
        bloom = cv2.GaussianBlur(bright, (0, 0), sigmaX=16.0)
        canvas = cv2.addWeighted(canvas, 1.0, bloom, 0.45, 0.0)

        # 7. Subtle Film Grain & Vignette
        rng_grain = np.random.RandomState(frame_idx)
        grain = rng_grain.normal(0.0, 2.8, size=canvas.shape[:2]).astype(np.float32)
        canvas_f = canvas.astype(np.float32) + grain[..., None]
        canvas = np.clip(canvas_f, 0, 255).astype(np.uint8)

        # 8. Title Card (if enabled, reveals in final 25% of duration)
        if self.show_title:
            self._draw_title_card(canvas, t)

        # 9. Fade In (first 7% of duration) & Fade Out (final 8% of duration)
        fade_in_len = min(1.0, self.duration * 0.08)
        fade_out_len = min(1.2, self.duration * 0.09)
        fade_in = smoothstep(0.0, fade_in_len, t)
        fade_out = 1.0 - smoothstep(self.duration - fade_out_len, self.duration, t)
        fade_alpha = fade_in * fade_out
        if fade_alpha < 0.999:
            canvas = (canvas.astype(np.float32) * fade_alpha).astype(np.uint8)

        return canvas

    def _draw_title_card(self, canvas, t):
        """Draws an understated, high-fashion botanical title card with frosted glass pill banner."""
        reveal_start = max(0.0, self.duration - min(3.8, self.duration * 0.28))
        alpha = smoothstep(reveal_start, reveal_start + 0.8, t)
        if alpha < 0.02:
            return

        overlay = canvas.copy()
        scale_txt = self.width / 1080.0
        y_center = self.height - int(140 * scale_txt)
        x_center = self.width // 2

        # Translucent dark frosted pill background
        w_box = int(420 * scale_txt)
        h_box = int(84 * scale_txt)
        x0, y0 = x_center - w_box // 2, y_center - h_box // 2
        x1, y1 = x_center + w_box // 2, y_center + h_box // 2
        cv2.rectangle(overlay, (x0, y0), (x1, y1), (12, 10, 14), -1)

        # Main Title
        cv2.putText(
            overlay, "LILIUM ORIENTALIS",
            (x_center - int(195 * scale_txt), y_center - int(6 * scale_txt)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.82 * scale_txt, (230, 238, 245),
            max(1, int(round(2 * scale_txt))), cv2.LINE_AA
        )
        # Subtitle
        cv2.putText(
            overlay, "BOTANICAL INSTAGRAM REEL STUDY",
            (x_center - int(172 * scale_txt), y_center + int(24 * scale_txt)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.40 * scale_txt, (155, 170, 185), 1, cv2.LINE_AA
        )
        # Thin accent border around card
        cv2.rectangle(overlay, (x0, y0), (x1, y1), (65, 75, 88), 1, cv2.LINE_AA)

        cv2.addWeighted(overlay, alpha * 0.88, canvas, 1.0 - alpha * 0.88, 0.0, dst=canvas)

    def render_video(self, bouquet):
        """Streams rendered frames directly to the video encoder with zero RAM bloat."""
        t_start = time.time()
        print(f"\n==================================================================")
        print(f" Procedural 3D Botanical Lily Video Generator")
        print(f" Resolution: {self.width}x{self.height} (9:16) | FPS: {self.fps} | Frames: {self.total_frames}")
        print(f" Duration: {self.duration:.1f}s | Flowers: {bouquet.flower_count} | Palette: {bouquet.palette['name'].title()}")
        print(f" Output: {self.output_path}")
        print(f"==================================================================\n")

        proc = None
        writer = None

        if self.ffmpeg_exe:
            print(f"[Encoder] Using FFmpeg pipe: {self.ffmpeg_exe}")
            ffmpeg_cmd = [
                self.ffmpeg_exe,
                "-y",
                "-f", "rawvideo",
                "-vcodec", "rawvideo",
                "-s", f"{self.width}x{self.height}",
                "-pix_fmt", "bgr24",
                "-r", str(self.fps),
                "-i", "-",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "18",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                self.output_path
            ]
            proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            print("[Encoder] FFmpeg not found. Falling back to cv2.VideoWriter (mp4v)...")
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(self.output_path, fourcc, self.fps, (self.width, self.height))

        try:
            for idx in range(self.total_frames):
                frame = self.render_frame(idx, bouquet)

                if proc is not None:
                    proc.stdin.write(frame.tobytes())
                elif writer is not None:
                    writer.write(frame)

                # Progress Bar
                elapsed = time.time() - t_start
                pct = 100.0 * (idx + 1) / self.total_frames
                current_fps = (idx + 1) / max(1e-5, elapsed)
                remaining = (self.total_frames - (idx + 1)) / max(1e-5, current_fps)

                bar_len = 28
                filled = int(round(bar_len * (idx + 1) / self.total_frames))
                bar_str = "=" * filled + "-" * (bar_len - filled)

                sys.stdout.write(
                    f"\r[{bar_str}] {pct:5.1f}% | Frame {idx + 1:3d}/{self.total_frames} | "
                    f"{current_fps:4.1f} fps | Elapsed: {elapsed:4.1f}s | ETA: {remaining:4.1f}s"
                )
                sys.stdout.flush()

        finally:
            if proc is not None:
                proc.stdin.close()
                stderr_out = proc.stderr.read().decode("utf-8", errors="ignore")
                proc.stderr.close()
                ret = proc.wait()
                if ret != 0:
                    print(f"\n[Error] FFmpeg exited with code {ret}:\n{stderr_out}")
            elif writer is not None:
                writer.release()

        total_time = time.time() - t_start
        print(f"\n\n[Success] Video rendered in {total_time:.1f}s ({self.total_frames / total_time:.1f} fps avg)")
        print(f"[Saved] Output: {os.path.abspath(self.output_path)}\n")


# ============================================================================
# 5. COMMAND LINE ENTRY POINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Procedurally generate a cinematic 9:16 Instagram Reel video of a blooming Oriental Lily bouquet."
    )
    parser.add_argument("--output", type=str, default="lily_reel.mp4",
                        help="Output MP4 file path (default: lily_reel.mp4)")
    parser.add_argument("--duration", type=float, default=13.0,
                        help="Video duration in seconds (default: 13.0, typically 12-15s)")
    parser.add_argument("--fps", type=int, default=30,
                        help="Video frame rate (default: 30)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for deterministic bouquet procedural generation (default: 42)")
    parser.add_argument("--flowers", type=int, default=6,
                        help="Number of flowers in bouquet (default: 6, range: 5 to 7)")
    parser.add_argument("--palette", type=str, default="pink", choices=["pink", "white", "magenta"],
                        help="Floral color palette: 'pink' (Stargazer), 'white' (Casablanca), or 'magenta' (default: pink)")
    parser.add_argument("--preview", action="store_true",
                        help="Render a fast, low-resolution preview test (540x960, coarse mesh) in seconds")
    parser.add_argument("--title", action="store_true",
                        help="Display an elegant botanical specimen title card at the end")
    parser.add_argument("--open", action="store_true",
                        help="Automatically open the rendered video in default system media player when done")

    args = parser.parse_args()

    # Resolution settings
    if args.preview:
        width = 540
        height = 960
        coarse = True
        output_file = args.output if args.output != "lily_reel.mp4" else "lily_preview.mp4"
    else:
        width = 1080
        height = 1920
        coarse = False
        output_file = args.output

    # Assemble procedural 3D bouquet
    bouquet = Bouquet(
        flower_count=args.flowers,
        palette_name=args.palette,
        duration=args.duration,
        seed=args.seed,
        coarse=coarse
    )

    # Initialize renderer and run video stream
    renderer = Renderer(
        width=width,
        height=height,
        fps=args.fps,
        duration=args.duration,
        output_path=output_file,
        show_title=args.title,
        coarse=coarse
    )

    renderer.render_video(bouquet)

    if args.open:
        try:
            if sys.platform.startswith("win"):
                os.startfile(os.path.abspath(output_file))
            elif sys.platform.startswith("darwin"):
                subprocess.Popen(["open", os.path.abspath(output_file)])
            else:
                subprocess.Popen(["xdg-open", os.path.abspath(output_file)])
        except Exception as e:
            print(f"[Note] Could not automatically open video: {e}")


if __name__ == "__main__":
    main()
