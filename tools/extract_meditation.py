#!/usr/bin/env python3
"""
Extract the meditation segment from a Spanish-language class/video.

Pipeline:
1. ffmpeg → 16kHz mono WAV (whisper input)
2. faster-whisper small model, Spanish, word timestamps
3. Cue-phrase search to find meditation start/end
4. ffmpeg → trim original to MP3 (64kbps mono)

Usage:
    python3 extract_meditation.py <input.mp4> [--out OUT.mp3]
    python3 extract_meditation.py <input.mp4> --analyze-only   # don't trim, just print candidates
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from faster_whisper import WhisperModel

# Cue phrases (Spanish). Lowercase, accent-stripped match.
START_CUES = [
    "vamos a meditar",
    "vamos a la meditacion",
    "vamos a hacer la meditacion",
    "iniciamos la meditacion",
    "empezamos la meditacion",
    "vamos a entrar en la meditacion",
    "vamos a visualizar",
    "vamos a visualizarnos",
    "cierra los ojos",
    "cierren los ojos",
    "cierra tus ojos",
    "respira profundo",
    "respira hondo",
    "respiren profundo",
    "inhalacion profunda",
    "inhalaciones profundas",
    "una inhalacion",
    "tomamos una inhalacion",
    "toma una inhalacion",
    "tomar una inhalacion",
    "ponte en una posicion",
    "ponganse en una posicion",
    "sientate comodo",
    "vamos a respirar",
]

END_CUES = [
    "abre los ojos",
    "abre tus ojos",
    "abran los ojos",
    "abren los ojos",
    "abrimos los ojos",
    "abrimos nuestros ojos",
    "abrimos nuestro ojos",
    "regresa a tu cuerpo",
    "regresen a su cuerpo",
    "regresa a este momento",
    "regresar energia a tu cuerpo",
    "vuelve a este momento",
    "namaste",
    "gracias por meditar",
    "terminamos la meditacion",
    "cerramos la meditacion",
    "salimos de la meditacion",
    "mueve los dedos",
    "mueve tus dedos",
    "estira tu cuerpo",
    "estira las piernas",
    "estira a las piernas",
    "puedes abrir los ojos",
    "cuando estes listo abre",
    "cuando estes lista abre",
    "regresa al aqui y ahora",
    "tercera exhalacion abrimos",
]

def strip_accents(s: str) -> str:
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()

def resolve_path(p: Path) -> Path:
    """Resolve a path even if the on-disk filename uses a different Unicode normalization form."""
    if p.exists():
        return p
    import unicodedata
    parent = p.parent
    target_nfc = unicodedata.normalize("NFC", p.name)
    target_nfd = unicodedata.normalize("NFD", p.name)
    for cand in parent.iterdir():
        cn = cand.name
        if unicodedata.normalize("NFC", cn) == target_nfc or unicodedata.normalize("NFD", cn) == target_nfd:
            return cand
    raise FileNotFoundError(f"No file found matching {p} under any Unicode normalization")

def extract_wav(src: Path, dst: Path):
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-vn", "-ac", "1", "-ar", "16000",
        "-c:a", "pcm_s16le",
        str(dst),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def transcribe(wav_path: Path, model_size: str = "small"):
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(wav_path),
        language="es",
        beam_size=1,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )
    return list(segments), info

def find_cues(segments, cues):
    """Return list of (timestamp_seconds, matched_cue, segment_text) for matches."""
    hits = []
    for seg in segments:
        norm = strip_accents(seg.text)
        for cue in cues:
            if cue in norm:
                hits.append((seg.start, cue, seg.text.strip()))
                break
    return hits

def choose_segment(starts, ends, total_duration):
    """Pick a (start, end) pair. Prefer last START before mid-late video, first END after that."""
    if not starts and not ends:
        return None
    # Heuristic: meditation usually in second half of class. Pick latest start in first 70%, then earliest end after it.
    starts = sorted(starts, key=lambda x: x[0])
    ends = sorted(ends, key=lambda x: x[0])

    # Filter starts to those before 90% of duration
    candidate_starts = [s for s in starts if s[0] < total_duration * 0.9]
    if not candidate_starts:
        candidate_starts = starts

    # Pick the LAST start cue (typically the actual meditation start, not earlier references)
    if candidate_starts:
        start_time = candidate_starts[-1][0]
    else:
        start_time = total_duration * 0.6  # fallback

    # Find first end cue after start
    end_after_start = [e for e in ends if e[0] > start_time + 60]  # at least 1min after
    if end_after_start:
        end_time = end_after_start[0][0]
    else:
        end_time = total_duration

    return (start_time, end_time)

def trim(src: Path, dst: Path, start: float, end: float):
    """Trim using ffmpeg, mono 64kbps mp3."""
    duration = end - start
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start),
        "-i", str(src),
        "-t", str(duration),
        "-vn", "-ac", "1", "-b:a", "64k",
        "-c:a", "libmp3lame",
        str(dst),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def fmt(s):
    m = int(s // 60); sec = int(s % 60)
    return f"{m}:{sec:02d}"

def process(input_path: Path, out_path: Path = None, analyze_only: bool = False, model_size: str = "small"):
    t0 = time.time()
    input_path = resolve_path(input_path)
    print(f"[*] {input_path.name}", flush=True)

    # Extract audio
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "audio.wav"
        print(f"  → extract audio…", flush=True)
        extract_wav(input_path, wav)

        # Transcribe
        print(f"  → transcribe (whisper {model_size})…", flush=True)
        segments, info = transcribe(wav, model_size)
        total_dur = info.duration
        print(f"  duration: {fmt(total_dur)}  segments: {len(segments)}", flush=True)

        # Find cues
        start_hits = find_cues(segments, [strip_accents(c) for c in START_CUES])
        end_hits = find_cues(segments, [strip_accents(c) for c in END_CUES])
        print(f"  start cues: {len(start_hits)}  end cues: {len(end_hits)}", flush=True)
        for h in start_hits[:5]:
            print(f"    START @ {fmt(h[0])}: \"{h[1]}\" → \"{h[2][:80]}\"")
        for h in end_hits[:5]:
            print(f"    END   @ {fmt(h[0])}: \"{h[1]}\" → \"{h[2][:80]}\"")

        # Always save transcript for inspection
        transcript_path = (out_path.with_suffix(".transcript.json") if out_path
                           else input_path.with_suffix(".transcript.json"))
        with open(transcript_path, "w") as f:
            json.dump([{"start": s.start, "end": s.end, "text": s.text} for s in segments],
                      f, ensure_ascii=False, indent=2)
        print(f"  transcript → {transcript_path.name}", flush=True)

        chosen = choose_segment(start_hits, end_hits, total_dur)
        if chosen is None:
            print("  ⚠ no cues found; consider manual review")
            return None
        start_time, end_time = chosen
        # Sanity: cap at 60 minutes
        if end_time - start_time > 60 * 60:
            end_time = start_time + 60 * 60
        print(f"  ✓ chosen segment: {fmt(start_time)} → {fmt(end_time)}  ({fmt(end_time-start_time)})", flush=True)

        result = {
            "input": str(input_path),
            "duration": total_dur,
            "start": start_time,
            "end": end_time,
            "start_cues": [(s[0], s[1]) for s in start_hits],
            "end_cues": [(s[0], s[1]) for s in end_hits],
        }

        if not analyze_only and out_path:
            print(f"  → trim → {out_path.name}", flush=True)
            trim(input_path, out_path, start_time, end_time)
            result["out"] = str(out_path)
            result["out_size"] = out_path.stat().st_size

        print(f"  done in {int(time.time()-t0)}s", flush=True)
        return result

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--analyze-only", action="store_true")
    ap.add_argument("--model", default="small")
    args = ap.parse_args()

    result = process(args.input, args.out, args.analyze_only, args.model)
    if result:
        print(json.dumps({k: v for k, v in result.items() if k not in ("start_cues", "end_cues")}, indent=2))

if __name__ == "__main__":
    main()
