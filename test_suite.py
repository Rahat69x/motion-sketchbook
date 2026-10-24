"""
Test suite to verify procedural lily animation generation components.
"""
import unittest
import numpy as np
import os
import cv2

from generate_lily_animation import Bouquet, Renderer, Petal, Stamen, Pistil, Stem, Leaf

class TestLilyGenerator(unittest.TestCase):
    def test_bouquet_palettes(self):
        expected_names = {"pink": "stargazer", "white": "casablanca", "magenta": "magenta"}
        for pal, exp_name in expected_names.items():
            b = Bouquet(flower_count=5, palette_name=pal, duration=6.0, seed=123, coarse=True)
            self.assertEqual(b.flower_count, 5)
            self.assertGreater(len(b.elements), 0)
            self.assertEqual(b.palette["name"], exp_name)

    def test_single_frame_render(self):
        bouquet = Bouquet(flower_count=5, palette_name="pink", duration=6.0, seed=42, coarse=True)
        renderer = Renderer(width=270, height=480, fps=15, duration=6.0, coarse=True)
        frame = renderer.render_frame(frame_idx=15, bouquet=bouquet)
        self.assertIsInstance(frame, np.ndarray)
        self.assertEqual(frame.shape, (480, 270, 3))
        self.assertEqual(frame.dtype, np.uint8)
        # Check non-black frame
        self.assertGreater(np.mean(frame), 5.0)

    def test_output_file_exists(self):
        self.assertTrue(os.path.exists("lily_reel.mp4"))
        cap = cv2.VideoCapture("lily_reel.mp4")
        self.assertEqual(int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), 1080)
        self.assertEqual(int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)), 1920)
        self.assertEqual(int(cap.get(cv2.CAP_PROP_FPS)), 30)
        cap.release()

    def test_encoder_pipeline(self):
        temp_out = "temp_test.mp4"
        if os.path.exists(temp_out):
            os.remove(temp_out)
        bouquet = Bouquet(flower_count=5, palette_name="pink", duration=0.1, seed=42, coarse=True)
        renderer = Renderer(width=270, height=480, fps=15, duration=0.1, output_path=temp_out, coarse=True)
        renderer.render_video(bouquet)
        self.assertTrue(os.path.exists(temp_out))
        self.assertGreater(os.path.getsize(temp_out), 1000)
        if os.path.exists(temp_out):
            os.remove(temp_out)

if __name__ == "__main__":
    unittest.main()
