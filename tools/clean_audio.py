#!/usr/bin/env python3
"""
Clean & normalize meditation MP3s.

Per-file tier:
  A (solfeggio tones)  → loudnorm only
  B (mantras/chants)   → highpass 60 + loudnorm
  C (spoken/class)     → highpass 80 + afftdn light + loudnorm

Two-pass loudnorm (EBU R128, target -16 LUFS, true peak -1.5 dB, range 11).
Output: audio_clean/<file>.mp3 (mono, 64 kbps).
"""
import json
import re
import subprocess
import sys
from pathlib import Path

AUDIO_DIR = Path(__file__).resolve().parent.parent / "audio"
OUT_DIR   = Path(__file__).resolve().parent.parent / "audio_clean"
OUT_DIR.mkdir(exist_ok=True)

TIER_A = {"third-eye.mp3", "oneness.mp3", "positive-energy.mp3", "angels.mp3"}
TIER_B = {"limpieza-energetica.mp3"}
# Everything else is Tier C

TARGET_I  = -16.0
TARGET_TP = -1.5
TARGET_LRA = 11.0

def pass1_measure(src: Path):
    """Returns dict with measured values (input_i, input_tp, input_lra, input_thresh, target_offset)."""
    cmd = [
        "ffmpeg", "-nostats", "-hide_banner", "-i", str(src),
        "-af", f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
        "-f", "null", "-",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    stderr = proc.stderr
    # Find the JSON block (ffmpeg prints it at the end of stderr)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", stderr, re.DOTALL)
    if not m:
        raise RuntimeError(f"Could not parse loudnorm output for {src.name}")
    return json.loads(m.group(0))

def filter_chain(tier: str, measured: dict) -> str:
    chain = []
    if tier == "C":
        chain.append("highpass=f=80")
        chain.append("afftdn=nr=8:nf=-30")  # mild denoise
    elif tier == "B":
        chain.append("highpass=f=60")
    # else (tier A): no pre-filter

    # 2nd-pass loudnorm uses measured_* values
    chain.append(
        "loudnorm="
        f"I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:"
        f"measured_I={measured['input_i']}:"
        f"measured_LRA={measured['input_lra']}:"
        f"measured_TP={measured['input_tp']}:"
        f"measured_thresh={measured['input_thresh']}:"
        f"offset={measured.get('target_offset', 0.0)}:"
        "linear=true:print_format=summary"
    )
    return ",".join(chain)

def tier_for(name: str) -> str:
    if name in TIER_A: return "A"
    if name in TIER_B: return "B"
    return "C"

def process(src: Path):
    name = src.name
    tier = tier_for(name)
    dst = OUT_DIR / name
    print(f"\n=== {name}  [Tier {tier}] ===", flush=True)

    print("  → pass 1 (measure)…", flush=True)
    m = pass1_measure(src)
    print(f"     input_i={m['input_i']}  input_tp={m['input_tp']}  input_lra={m['input_lra']}  thresh={m['input_thresh']}")

    af = filter_chain(tier, m)
    print(f"  → pass 2 (filter+encode)…", flush=True)
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "warning",
        "-i", str(src),
        "-af", af,
        "-ar", "44100", "-ac", "1", "-b:a", "64k", "-c:a", "libmp3lame",
        str(dst),
    ]
    subprocess.run(cmd, check=True)

    in_sz  = src.stat().st_size // 1024
    out_sz = dst.stat().st_size // 1024
    print(f"  ✓ {in_sz} KB → {out_sz} KB", flush=True)
    return dst

def main():
    targets = sys.argv[1:] or sorted(p.name for p in AUDIO_DIR.glob("*.mp3"))
    failed = []
    for name in targets:
        src = AUDIO_DIR / name
        if not src.exists():
            print(f"!! missing: {name}")
            continue
        try:
            process(src)
        except Exception as e:
            print(f"!! {name}: {e}")
            failed.append(name)
    if failed:
        print(f"\nFailed: {failed}")
        sys.exit(1)
    print(f"\nAll cleaned → {OUT_DIR}")

if __name__ == "__main__":
    main()
