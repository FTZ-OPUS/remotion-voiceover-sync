#!/bin/bash
# build_voiceover.sh — 把分段配音精确拼接到对应场景，生成对齐音轨
#
# 用法：
#   1. 修改下方的 D（场景时长，帧）、TRANSITION（转场时长，帧）、FPS
#   2. 确保 voice_segments/trimmed/s01.wav ... sNN.wav 存在
#   3. bash build_voiceover.sh
#
# 输出：public/voiceover_track.wav
#
# 原理：
#   每段配音 adelay 到 starts[i] + 18帧（0.6秒）的位置，
#   然后 amix 全部混合。每段开头已统一保留 0.15s 静音。

set -e

# ===== 配置（按项目修改）=====
D=(99 262 176 327 476 211 233 285 276 225 133)  # 场景时长（帧）
TRANSITION=15       # 转场时长（帧）
FPS=30               # 帧率
VOICE_OFFSET=18      # 配音在场景开始后多少帧出现（0.6s = 18帧）
SEG_DIR="voice_segments/trimmed"
OUTPUT="public/voiceover_track.wav"
# ================================

N=${#D[@]}

# 计算场景全局起始帧（考虑转场重叠）
starts=(0)
for ((i=1; i<N; i++)); do
  starts[$i]=$(( starts[i-1] + D[i-1] - TRANSITION ))
done
total=$(( starts[N-1] + D[N-1] ))
total_sec=$(echo "scale=2; $total / $FPS" | bc)

echo "场景数: $N"
echo "总帧数: $total ($total_sec 秒)"
echo "场景起始帧: ${starts[*]}"
echo ""

# 构建 ffmpeg filter_complex
# 输入：每段 trimmed 配音
inputs=""
adelay_filters=""
amix_inputs=""

for ((i=0; i<N; i++)); do
  seg=$(printf "%s/s%02d.wav" "$SEG_DIR" $((i+1)))
  if [ ! -f "$seg" ]; then
    echo "错误：找不到 $seg"
    exit 1
  fi
  inputs="$inputs -i $seg"
  # adelay 单位是毫秒，全局起始帧 + 偏移
  delay_ms=$(( (starts[i] + VOICE_OFFSET) * 1000 / FPS ))
  adelay_filters="${adelay_filters}[${i}:a]adelay=${delay_ms}|${delay_ms}[a${i}];"
  amix_inputs="${amix_inputs}[a${i}]"
done

filter="${adelay_filters}${amix_inputs}amix=inputs=${N}:duration=longest:normalize=0[out]"

echo "开始拼接..."
echo "filter_complex: $filter"
echo ""

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg -y $inputs \
  -filter_complex "$filter" \
  -map "[out]" \
  -ar 44100 -ac 2 \
  "$OUTPUT"

echo ""
echo "完成：$OUTPUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUTPUT" | xargs -I{} echo "音轨时长：{} 秒"
