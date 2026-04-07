"""
smoother.py
===========
Temporal smoother — prevents single-frame hallucinations.
A prediction is only "confirmed" if the same sign appears
in at least threshold out of the last window frames.
"""

from collections import deque, Counter


class TemporalSmoother:
    def __init__(self, window: int = 8, threshold: int = 5):
        """
        window    : how many recent frames to look at
        threshold : how many of those must agree to confirm
        """
        self.window    = window
        self.threshold = threshold
        self.buffer    = deque(maxlen=window)

    def update(self, prediction: str | None) -> tuple[str | None, bool]:
        """
        Call once per frame with the current best prediction.

        Returns:
            (most_common_prediction, is_confirmed)
            is_confirmed = True only when threshold is met
        """
        self.buffer.append(prediction)

        if not self.buffer:
            return None, False

        # Count non-None predictions only
        valid = [p for p in self.buffer if p is not None]
        if not valid:
            return None, False

        most_common, count = Counter(valid).most_common(1)[0]
        is_confirmed = count >= self.threshold

        return most_common, is_confirmed

    def reset(self):
        self.buffer.clear()

    @property
    def fill(self) -> float:
        """Returns 0.0-1.0 showing how full the confirmation buffer is."""
        if not self.buffer:
            return 0.0
        valid = [p for p in self.buffer if p is not None]
        if not valid:
            return 0.0
        _, count = Counter(valid).most_common(1)[0]
        return min(count / self.threshold, 1.0)
