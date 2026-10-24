"""
Terminal ANSI Truecolor Video Player for Lily Animation
Plays lily_reel.mp4 or lily_preview.mp4 directly inside the terminal console
using 24-bit ANSI truecolor and unicode half-block characters (▀).
"""

import sys
import os
import time
import shutil
import cv2
import numpy as np

# Enable ANSI escape sequences on Windows consoles
if sys.platform.startswith("win"):
    import ctypes
    kernel32 = ctypes.windll.kernel32
    hStdOut = kernel32.GetStdHandle(-11)
    mode = ctypes.c_ulong()
    kernel32.GetConsoleMode(hStdOut, ctypes.byref(mode))
    # ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004
    kernel32.SetConsoleMode(hStdOut, mode.value | 0x0004)


def play(video_path="lily_reel.mp4", max_cols=None, max_rows=None, loop=False):
    if not os.path.exists(video_path):
        if os.path.exists("lily_preview.mp4"):
            video_path = "lily_preview.mp4"
        else:
            print(f"Error: {video_path} not found.")
            return

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_delay = 1.0 / fps
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Hide cursor and clear screen
    sys.stdout.write("\x1b[?25l\x1b[2J")
    sys.stdout.flush()

    try:
        while True:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            t_start = time.perf_counter()
            frame_idx = 0

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                # Get current terminal dimensions
                term_size = shutil.get_terminal_size((80, 45))
                avail_cols = term_size.columns - 2
                avail_rows = term_size.lines - 3

                # Target portrait aspect ratio ~ 9:16
                # Since each character is ~2x taller than wide, and half-block gives 2 vertical pixels per char,
                # 1 char cell = 1x1 aspect ratio in pixel space!
                target_w = min(avail_cols, int(avail_rows * (9.0 / 16.0) * 1.8))
                target_w = max(24, min(target_w, 80))
                target_h_chars = int(target_w * (16.0 / 9.0) * 0.55)
                target_h_chars = max(16, min(target_h_chars, avail_rows))
                target_h_pixels = target_h_chars * 2

                # Resize frame to target dimensions (BGR)
                small = cv2.resize(frame, (target_w, target_h_pixels), interpolation=cv2.INTER_AREA)

                # Separate top and bottom pixel rows
                top = small[0::2, :, :]     # Shape: (target_h_chars, target_w, 3)
                bottom = small[1::2, :, :]  # Shape: (target_h_chars, target_w, 3)

                # Build ANSI string buffer for fast rendering
                # \x1b[H moves cursor to top-left without clearing (no flicker)
                lines = ["\x1b[H"]
                left_pad = " " * max(0, (term_size.columns - target_w) // 2)

                for r in range(target_h_chars):
                    row_top = top[r]
                    row_bot = bottom[r]
                    row_str = [left_pad]
                    for c in range(target_w):
                        # BGR to RGB
                        tb, tg, tr = int(row_top[c, 0]), int(row_top[c, 1]), int(row_top[c, 2])
                        bb, bg, br = int(row_bot[c, 0]), int(row_bot[c, 1]), int(row_bot[c, 2])
                        row_str.append(f"\x1b[38;2;{tr};{tg};{tb}m\x1b[48;2;{br};{bg};{bb}m\u2580")
                    row_str.append("\x1b[0m\n")
                    lines.append("".join(row_str))

                pct = 100.0 * (frame_idx + 1) / max(1, total_frames)
                elapsed_sec = (frame_idx + 1) / fps
                bar_pad = " " * max(0, (term_size.columns - 50) // 2)
                lines.append(f"{bar_pad}\x1b[90m[{frame_idx+1:3d}/{total_frames:3d}] {pct:4.1f}% | {elapsed_sec:4.1f}s | Press Ctrl+C to exit\x1b[0m")

                # Flush complete screen buffer in single write
                sys.stdout.write("".join(lines))
                sys.stdout.flush()

                frame_idx += 1
                # Sync playback speed
                target_time = t_start + frame_idx * frame_delay
                sleep_time = target_time - time.perf_counter()
                if sleep_time > 0.002:
                    time.sleep(sleep_time)

            if not loop:
                break
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        # Restore cursor and terminal color
        sys.stdout.write("\x1b[?25h\x1b[0m\n\n")
        sys.stdout.flush()


if __name__ == "__main__":
    vid = "lily_reel.mp4"
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        vid = sys.argv[1]
    elif "--preview" in sys.argv:
        vid = "lily_preview.mp4"
    is_loop = "--loop" in sys.argv
    play(video_path=vid, loop=is_loop)
