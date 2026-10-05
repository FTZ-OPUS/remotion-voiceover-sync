#!/bin/bash
# trim_silence.sh — 裁掉每段配音开头的不规则静音，保留固定 0.15 秒
#
# 用法：
#   1. 原始分段配音放在 voice_segments/s01.wav ... sNN.wav
#   2. bash trim_silence.sh
#   3. 裁剪后输出到 voice_segments/trimmed/s01.wav ...
#
# 原理：
#   用 ffmpeg silencedetect 检测开头静音，
#   从静音结束前 0.15 秒处开始裁剪，保证每段开头静音统一。

set -e

SEG_DIR="voice_segments"
OUT_DIR="voice_segments/trimmed"
KEEP_SILENCE=0.15   # 保留的开头静音（秒）
NOISE="-35dB"        # 静音判定阈值
MIN_DUR=0.2          # 最短静音时长（秒）

mkdir -p "$OUT_DIR"

for f in "$SEG_DIR"/s*.wav; do
  name=$(basename "$f")
  echo "处理 $name ..."

  # 检测第一段静音的结束时间
  silence_end=$(ffmpeg -i "$f" -af "silencedetect=noise=${NOISE}:d=${MIN_DUR}" -f null - 2>&1 \
    | grep "silence_end" \
    | head -1 \
    | sed 's/.*silence_end: \([0-9.]*\).*/\1/')

  if [ -z "$silence_end" ]; then
    echo "  未检测到开头静音，直接复制"
    cp "$f" "$OUT_DIR/$name"
    continue
  fi

  # 裁剪起点 = 静音结束 - 保留静音
  start=$(echo "scale=3; $silence_end - $KEEP_SILENCE" | bc)
  if (( $(echo "$start < 0" | bc -l) )); then
    start=0
  fi

  echo "  开头静音 ${silence_end}s，裁剪起点 ${start}s"

  ffmpeg -y -ss "$start" -i "$f" -c copy "$OUT_DIR/$name" 2>/dev/null
done

echo ""
echo "裁剪完成，输出目录：$OUT_DIR"
echo "各段时长："
for f in "$OUT_DIR"/s*.wav; do
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  echo "  $(basename $f): ${dur}s"
done
