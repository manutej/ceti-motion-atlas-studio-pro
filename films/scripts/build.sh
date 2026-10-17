#!/usr/bin/env bash
# Build one film end to end: gates -> cue sheet -> cue-locked score -> 2 parallel render workers ->
# concat -> loudness to -16 LUFS (gain + limiter, never dynamic loudnorm) -> mux -> flash + frame-count checks.
#
#   scripts/build.sh line [story.json]     Whale Line format (default story: kh/lines/stories/brief-v2.json)
#   scripts/build.sh sea                   Sea of data
#   scripts/build.sh composition           Composition v1      (composition-v2 for v2)
#   scripts/build.sh signal                Signal
#   scripts/build.sh little-whale-v2       Little whale v2
#
# Output: renders/<name>.mp4 (override with OUT_DIR=...). Workers: WORKERS=2 (default).
# A gate failure stops the build before any frame is rendered.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
FILM=${1:?film name}; STORY=${2:-kh/lines/stories/brief-v2.json}
OUT_DIR=${OUT_DIR:-$ROOT/renders}; WORKERS=${WORKERS:-2}; mkdir -p "$OUT_DIR"
WK=$(mktemp -d "${TMPDIR:-/tmp}/kh-build.XXXXXX")

case "$FILM" in
  line)
    NAME="whale-line-$(basename "$STORY" .json)"
    GATE=(node kh/lines/tool.cjs "$STORY" gate)
    CUES=(node kh/lines/tool.cjs "$STORY" cues "$WK/cues.json")
    SCORE=(python3 kh/lines/score.py "$WK/cues.json" "$WK/score.wav")
    RENDER=(node kh/lines/tool.cjs "$STORY" render)
    DUR_JS="require('./kh/lines/engine.cjs').load('$STORY').FILM.DUR" ;;
  sea)
    NAME=sea-of-data
    GATE=(node kh/sea/tool.cjs gate); CUES=(node kh/sea/tool.cjs cues "$WK/cues.json")
    SCORE=(python3 kh/sea/score.py "$WK/cues.json" "$WK/score.wav"); RENDER=(node kh/sea/tool.cjs render)
    DUR_JS="require('./kh/host.cjs');require('./kh/whale-rig.js');require('./kh/sea/film.js');globalThis.SEA.DUR" ;;
  composition|composition-v2)
    NAME=$FILM; PY=kh/composition/score.py
    if [ "$FILM" = composition-v2 ]; then export FILM=film2.js; PY=kh/composition/score2.py; else export FILM=film.js; fi
    GATE=(node kh/composition/tool.cjs gate); CUES=(node kh/composition/tool.cjs cues "$WK/cues.json")
    SCORE=(python3 "$PY" "$WK/cues.json" "$WK/score.wav"); RENDER=(node kh/composition/tool.cjs render)
    DUR_JS="require('./kh/composition/engine.cjs').load().FILM.DUR" ;;
  signal)
    NAME=signal
    GATE=(node kh/signal/gate.cjs); CUES=(true)                       # Signal's cue sheet is committed: kh/signal/cues.json
    SCORE=(env OUT="$WK/score.wav" python3 kh/signal/score.py); RENDER=(node kh/signal/render.cjs)
    DUR_JS="require('./kh/signal/engine.cjs').FILM.DUR" ;;
  little-whale-v2)
    NAME=little-whale-v2
    GATE=(true); CUES=(true)                                          # v2 reuses whale/cues.json + score.json
    SCORE=(bash -c "cd whale && OUT='$WK/score.wav' python3 synth.py"); RENDER=(node whale/render2.cjs)
    DUR_JS="require('./whale/engine2.cjs').FILM.DUR || globalThis.SCORE.duration" ;;
  cap:*)                                                              # CETI Capabilities episode: kh/caps/<slug>/{film.js,score.py}
    SLUG=${FILM#cap:}; NAME="cap-$SLUG"; T=(node kh/caps/tool.cjs "$SLUG")
    GATE=("${T[@]}" gate); CUES=("${T[@]}" cues "$WK/cues.json")
    SCORE=(python3 "kh/caps/$SLUG/score.py" "$WK/cues.json" "$WK/score.wav"); RENDER=("${T[@]}" render)
    DUR_JS="$(node kh/caps/tool.cjs "$SLUG" dur)" ;;
  *) echo "unknown film: $FILM" >&2; exit 2 ;;
esac

echo "== gates"; "${GATE[@]}"
echo "== cues + score"; "${CUES[@]}"; "${SCORE[@]}"
DUR=$(node -e "process.stdout.write(String($DUR_JS))")
N=$(python3 -c "print(round($DUR*60))"); echo "== render $NAME  ${DUR}s = $N frames, $WORKERS workers"
: > "$WK/segs.txt"; PIDS=()
for ((k = 0; k < WORKERS; k++)); do
  A=$(( N * k / WORKERS )); B=$(( N * (k + 1) / WORKERS ))
  "${RENDER[@]}" "$WK/seg$k.mp4" "$A" "$B" & PIDS+=($!)
  echo "file '$WK/seg$k.mp4'" >> "$WK/segs.txt"
done
for p in "${PIDS[@]}"; do wait "$p"; done
# render workers finish encoding asynchronously after stdin closes; wait for each DONE marker
for ((k = 0; k < WORKERS; k++)); do until grep -q DONE "$WK/seg$k.mp4.log" 2>/dev/null; do sleep 1; done; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WK/segs.txt" -c copy "$WK/video.mp4"

echo "== loudness"
I=$(ffmpeg -hide_banner -nostats -i "$WK/score.wav" -af ebur128 -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{print $2; exit}')
G=$(python3 -c "print(round(-16-($I),2))"); echo "measured $I LUFS -> gain $G dB"
ffmpeg -y -loglevel error -i "$WK/score.wav" -af "volume=${G}dB,alimiter=limit=0.708:attack=0.5:release=40:level=false" -ar 48000 "$WK/norm.wav"
ffmpeg -y -loglevel error -i "$WK/video.mp4" -i "$WK/norm.wav" -c:v copy -af apad -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT_DIR/$NAME.mp4"

echo "== checks"
ffmpeg -hide_banner -nostats -i "$OUT_DIR/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
FR=$(ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$OUT_DIR/$NAME.mp4")
echo "frames $FR (expected $N) $([ "$FR" = "$N" ] && echo PASS || echo FAIL)"
ffmpeg -hide_banner -i "$OUT_DIR/$NAME.mp4" -vf "scale=320:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=$WK/yavg.txt" -f null - 2>/dev/null
python3 scripts/flash.py "$WK/yavg.txt"
echo "== done  $OUT_DIR/$NAME.mp4   (work dir $WK)"
