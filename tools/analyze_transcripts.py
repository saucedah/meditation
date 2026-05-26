#!/usr/bin/env python3
"""
Re-analyze transcript JSON files with current cue list — no whisper needed.
Prints candidate meditation segments per file.

Usage: analyze_transcripts.py [transcript.json ...]
       analyze_transcripts.py audio/   # all transcripts in folder
"""
import json
import sys
import unicodedata
from pathlib import Path

# Import cues from the main script
sys.path.insert(0, str(Path(__file__).parent))
from extract_meditation import START_CUES, END_CUES, strip_accents, fmt, choose_segment

def find_cues_in_segments(segs, cue_list):
    hits = []
    for s in segs:
        norm = strip_accents(s['text'])
        for cue in cue_list:
            if cue in norm:
                hits.append((s['start'], cue, s['text'].strip()))
                break
    return hits

def show(transcript_path: Path):
    with open(transcript_path) as f:
        segs = json.load(f)
    total = segs[-1]['end'] if segs else 0

    cues_norm_start = [strip_accents(c) for c in START_CUES]
    cues_norm_end   = [strip_accents(c) for c in END_CUES]

    start_hits = find_cues_in_segments(segs, cues_norm_start)
    end_hits   = find_cues_in_segments(segs, cues_norm_end)

    name = transcript_path.name.replace('.transcript.json', '')
    print(f"\n=== {name}  ({fmt(total)}) ===")
    print(f"  starts: {len(start_hits)}   ends: {len(end_hits)}")
    for h in start_hits:
        print(f"    START {fmt(h[0])}  [{h[1]}]  {h[2][:90]}")
    for h in end_hits:
        print(f"    END   {fmt(h[0])}  [{h[1]}]  {h[2][:90]}")

    chosen = choose_segment(start_hits, end_hits, total)
    if chosen:
        s, e = chosen
        if e - s > 60 * 60:
            e = s + 60 * 60
        print(f"  ▶ candidate: {fmt(s)} → {fmt(e)}  ({fmt(e-s)})")

def main():
    args = sys.argv[1:] or ['audio']
    paths = []
    for a in args:
        p = Path(a)
        if p.is_dir():
            paths.extend(sorted(p.glob('*.transcript.json')))
        else:
            paths.append(p)
    for p in paths:
        try:
            show(p)
        except Exception as exc:
            print(f"!! {p.name}: {exc}")

if __name__ == "__main__":
    main()
