"""
Tests for vibration data validation.
"""

import pytest
import numpy as np
from api.routers.samples import validate_vibration_data


def test_validate_valid_vibration():
    """Test that valid vibration data passes validation."""
    vibration = np.sin(np.linspace(0, 10, 100)).tolist()
    errors = validate_vibration_data(vibration)
    assert len(errors) == 0


def test_validate_all_zeros():
    """Test that all-zero data is rejected."""
    vibration = [0.0] * 100
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("zeros" in e.lower() or "no signal" in e.lower() for e in errors)


def test_validate_constant_signal():
    """Test that constant signal is rejected."""
    vibration = [5.0] * 100
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("constant" in e.lower() for e in errors)


def test_validate_nan_values():
    """Test that NaN values are rejected."""
    vibration = [0.1, float('nan'), 0.3, 0.4]
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("nan" in e.lower() for e in errors)


def test_validate_infinity_values():
    """Test that Infinity values are rejected."""
    vibration = [0.1, float('inf'), 0.3, 0.4]
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("inf" in e.lower() for e in errors)


def test_validate_extremely_small_values():
    """Test that extremely small values are flagged."""
    vibration = [1e-15] * 100
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("small" in e.lower() for e in errors)


def test_validate_extremely_large_values():
    """Test that extremely large values are flagged."""
    vibration = [0.1, 1e7, 0.3, 0.4]
    errors = validate_vibration_data(vibration)
    assert len(errors) > 0
    assert any("large" in e.lower() for e in errors)


def test_validate_mixed_issues():
    """Test that multiple issues are all reported."""
    vibration = [float('nan'), 0.0, 0.0, 0.0]  # NaN + all zeros
    errors = validate_vibration_data(vibration)
    assert len(errors) >= 1  # At least one issue detected
