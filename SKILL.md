---
name: remotion-voiceover-sync
description: PPT/课件 → Remotion 动画 + AI 配音逐帧对齐 + 数字人口型同步的完整工作流。当用户要求把 PPT 转成带动画、配音、数字人的视频，或要求"配音和画面对齐/同步"时使用。
version: 1.0.0
---

# Remotion 配音逐帧对齐技能

把一份 PPT/课件变成一个**配音与画面逐句对齐**的 Remotion 动画视频，附带右下角数字人口型同步。

## 何时使用

- 用户上传 PPT 并要求"做成动画/视频"
- 用户要求"加配音"且强调"要和画面对齐"
- 用户反馈"配音不同步/偏了/只是时长对齐"
- 用户要求加"数字人/虚拟主播/口播"

## 核心原则（最高优先级）

1. **绝对不要用全局变速/拉长来"对齐"配音**。`Audio playbackRate`、ffmpeg `atempo` 只能对齐总时长，无法让每句话对应正确画面。用户会一眼看穿。
2. **配音必须按场景分段生成**，每段内容严格对应一个场景，再用 ffmpeg `adelay` 精确放到该场景的时间轴位置。
3. **文字动画必须按句内语音帧对齐**，不是凭感觉设 delay。先检测每段配音内部每句话的时间点，换算成场景本地帧，再设动画。
4. **数字人嘴型用 `useAudioData` + `visualizeAudio` 取低频音量逐帧驱动**，且 Audio 和 useAudioData 必须加载**同一个**音频文件、**无 playbackRate**，否则嘴型错位。

## 标准工作流

### 第 1 步：解析 PPT
- 解压 pptx（`unzip`），解析 `ppt/slides/slideN.xml` 提取文字
- 从 `ppt/media/` 提取可用图片（装饰图、logo）放入 `public/`
- 把 N 页内容重组为 M 个动画场景（M ≤ N，相邻内容合并）

### 第 2 步：搭建 Remotion 项目
- 用 `@remotion/transitions` 的 `TransitionSeries` + `fade` 串联场景
- 每个场景独立 composition 或独立组件
- 1920×1080、30fps
- 场景时长先按内容预估，**最终由配音真实时长决定**

### 第 3 步：按场景分段生成配音
- 为每个场景写独立配音稿（不要写一整篇连续稿）
- 用 `text_to_audio_plus` 逐段生成，统一音色（如"年轻亲切女教师、轻快自然像真人"）
- 每段立即下载（doubaocdn 链接可能较快失效）

### 第 4 步：裁剪每段开头静音
- 用 ffmpeg `silencedetect` 检测每段开头静音
- 裁掉开头不规则静音，**保留 0.15 秒**（避免太突兀）
- 这是关键：TTS 生成的音频开头静音长度不一（0.3~1.8 秒），不裁就无法精确对齐

### 第 5 步：精确拼接对齐音轨
- 计算每个场景的全局起始帧（考虑转场重叠：`starts[i] = starts[i-1] + D[i-1] - TRANSITION`）
- 每段配音放在 `starts[i] + 18帧（0.6秒）` 的位置
- 用 ffmpeg `filter_complex` 的 `adelay` + `amix` 拼接成完整 `voiceover_track.wav`
- 音轨总时长 = 视频总时长

### 第 6 步：检测句内时间，对齐文字动画
- 对每段裁剪后音频，用 ffmpeg `silencedetect` 提取内部句子边界
- 换算成场景本地帧（`local_frame = (sentence_time - 0.15) * 30`）
- 逐场景把文字/卡片/高亮的动画 delay 设到对应句子帧
- 这一步是"逐帧对齐"的核心

### 第 7 步：数字人口型同步
- 纯 SVG 画卡通人物（避免外部图片依赖）
- 右下角小画中画（300×340，半透明白底 + blur）
- `<Audio src={staticFile("voiceover_track.wav")} />` 播放配音
- `useAudioData(staticFile("voiceover_track.wav"))` + `visualizeAudio` 取前 8 样本平均 × 4.5 驱动嘴巴 ry
- Audio 和 useAudioData **必须同一文件、无 playbackRate**

### 第 8 步：渲染
```bash
npx remotion render Main out/final.mp4
```

### 第 9 步：逐帧验证（必须做）
- **音视频流时长核对**：`ffprobe` 确认 video/audio duration 一致
- **逐段互相关定位**：把每段 trimmed 配音在成片音频中做归一化互相关，确认实际起始位置 = 设计位置（偏差 < 8 帧）
- **静音检测交叉验证**：`ffmpeg silencedetect` 确认每个场景开始后约 0.6+0.15 秒开口
- **关键帧视觉检查**：抽 3~5 个时间点的帧，确认画面正常、数字人不遮挡、嘴型开合

## 关键公式

```
视频总帧数 = sum(SCENE_DURATIONS) - (场景数-1) × TRANSITION
场景 i 全局起始帧 starts[i] = starts[i-1] + D[i-1] - TRANSITION
配音 i 设计起始秒 = starts[i] / 30 + 0.6
句内本地帧 = (句内时间秒 - 0.15) × 30
```

## 环境注意

- ffmpeg/ffprobe 可能不在 PATH，macOS Homebrew 路径：`/opt/homebrew/Cellar/ffmpeg/<version>/bin`
- 渲染前 `export PATH=该目录:$PATH`（Remotion 自带 ffmpeg 不需要，但验证脚本需要）
- doubaocdn 音频链接生成后可能较快失效，需立即下载
- Python 可能没有 numpy，`pip3 install numpy`

## 引用文档

- [踩坑与修复详解](docs/pitfalls-and-fixes.md) — 每个坑的现象、根因、解决方案
- [参考案例：定语从句课件](reference/case-study.md) — 完整项目复盘
- [关键代码片段](reference/code-snippets/) — 可直接复用的组件和脚本
