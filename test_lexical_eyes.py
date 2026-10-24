"""
Comprehensive unit & integration test suite for lexical_eyes.py
"""
import unittest
import numpy as np
import pygame
import os

from lexical_eyes import (
    THEMES, THEME_KEYS, FontBank, SpriteCache,
    LayoutBuilder, Baker, EyeRenderer, EyeModel,
    BlinkController, GazeController, PupilController, CameraController,
    PostFX, UIOverlay, Lexicon, DEFAULT_QUOTES
)

class TestLexicalEyes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        pygame.init()
        # Create an offscreen/hidden surface for testing
        cls.screen = pygame.Surface((640, 360))

    @classmethod
    def tearDownClass(cls):
        pygame.quit()

    def test_lexicon(self):
        lex = Lexicon("quotes.txt")
        self.assertGreater(len(lex.quotes["iris"]), 10)
        self.assertGreater(len(lex.quotes["whispers"]), 10)
        import random
        rng = random.Random(42)
        quote = lex.get_quote("iris", rng)
        self.assertIsInstance(quote, str)
        words = lex.get_words("pupil", 5, rng)
        self.assertEqual(len(words), 5)

    def test_themes_and_luts(self):
        self.assertEqual(len(THEME_KEYS), 6)
        for key in THEME_KEYS:
            theme = THEMES[key]
            self.assertIn("iris", theme.luts)
            self.assertIn("sclera", theme.luts)
            self.assertIn("pupil", theme.luts)
            self.assertIn("lids", theme.luts)
            self.assertIn("glint", theme.luts)
            self.assertEqual(theme.luts["iris"].shape, (256, 3))
            self.assertEqual(theme.luts["iris"].dtype, np.uint8)

    def test_font_bank(self):
        fb = FontBank()
        for voice in ["regular", "italic", "bold", "mono"]:
            font = fb.get_font(voice, 16)
            self.assertIsNotNone(font)

    def test_sprite_cache(self):
        fb = FontBank()
        sc = SpriteCache(fb)
        sprite = sc.get_base_sprite("Infinite", "italic", 18)
        self.assertIsInstance(sprite, pygame.Surface)
        self.assertGreater(sprite.get_width(), 0)
        self.assertGreater(sprite.get_height(), 0)

        rot_sprite = sc.get_rotated_sprite("Infinite", "italic", 18, 47.0)
        self.assertIsInstance(rot_sprite, pygame.Surface)

    def test_layout_builder(self):
        lex = Lexicon()
        builder = LayoutBuilder(lex.quotes, seed=42, quality="low")
        layout = builder.build_layout(u_px=400.0)
        self.assertIn("static_layers", layout)
        self.assertGreater(len(layout["static_layers"]["background"]), 10)
        self.assertGreater(len(layout["static_layers"]["left_iris"]), 20)
        self.assertGreater(len(layout["static_layers"]["right_iris"]), 20)
        self.assertGreater(len(layout["static_layers"]["brows"]), 10)

    def test_baker_and_renderer(self):
        fb = FontBank()
        sc = SpriteCache(fb)
        baker = Baker(sc, quality="low")
        renderer = EyeRenderer(sc, baker)
        lex = Lexicon()
        builder = LayoutBuilder(lex.quotes, seed=42, quality="low")
        layout = builder.build_layout(u_px=400.0)

        theme = THEMES["ember"]
        world_w = int(400.0 * 2.8)
        world_h = int(400.0 * 1.6)
        renderer.bake_static_composition(layout, theme, world_w, world_h)
        self.assertIsNotNone(renderer.baked_world)
        self.assertIn("left", renderer.baked_iris)
        self.assertIn("right", renderer.baked_iris)
        self.assertIn("left", renderer.baked_pupil)

        # Render a single test frame with pupil controller
        gaze = GazeController()
        blink = BlinkController(seed=42)
        pupil = PupilController()
        camera = CameraController()
        pupil.update(0.016, 0.2, False)
        renderer.render_frame(
            self.screen, layout, theme,
            gaze, blink, camera,
            (320, 180), dt=0.016, pupil=pupil
        )
        self.assertEqual(self.screen.get_size(), (640, 360))

    def test_controllers_and_fx(self):
        blink = BlinkController(seed=123)
        blink.trigger_blink_now()
        blink.update(0.05)
        self.assertGreater(blink.left_progress, 0.0)

        gaze = GazeController()
        gaze.update(0.016, 0.5, -0.2, mouse_moved=True)
        self.assertNotEqual(gaze.gaze_x, 0.0)

        pupil = PupilController()
        pupil.update(0.016, 0.8, is_idle=False)
        self.assertGreater(pupil.get_scale("left"), 0.0)

        camera = CameraController()
        camera.update(0.1, 0.2, 0.1)
        self.assertGreater(camera.zoom, 0.0)

        fx = PostFX(640, 360)
        fx.apply(self.screen, quality="low")

        ui = UIOverlay(FontBank())
        ui.add_toast("Test Toast")
        ui.update(0.016)
        ui.draw(self.screen, 42, "Ember", True, 1.0, 60.0)

if __name__ == "__main__":
    unittest.main()
