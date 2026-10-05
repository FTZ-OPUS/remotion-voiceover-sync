# 参考案例：定语从句课件 → Remotion 动画

## 项目概览

- **输入**：`定语从句 (1).pptx`，21 页，英语语法课
- **输出**：85.1 秒、1920×1080、30fps MP4，含配音 + 数字人
- **项目路径**：`~/Desktop/attributive-clauses/`
- **场景数**：21 页重组为 11 个动画场景

## PPT 结构与场景重组

| PPT 页 | 内容 | 重组场景 |
|--------|------|----------|
| 1 | 封面 | s01 封面 |
| 2 | 定义（先行词 Antecedent） | s02 定义 |
| 3 | 位置（例句 The girl who is singing...） | s03 位置 |
| 4-6 | 关系代词 that/which/who/whom/whose | s04 关系代词 |
| 7-9 | that/which 区别（只用that三种、只用which两种） | s05 that vs which |
| 10-11 | 关系副词 when/where/why | s06 关系副词 |
| 12-13 | 代词与副词区别（看成分） | s07 区别 |
| 14-15 | 省略（宾语可省） | s08 省略 |
| 16-18 | what（=the thing that/all that） | s09 what |
| 19-20 | 翻译练习（"这是我住的宿舍"5种） | s10 翻译 |
| 21 | Step by step / Thanks | s11 结尾 |

## 场景时长与配音

| 场景 | 帧数 | 秒数 | 配音稿 | 裁剪后配音时长 |
|------|------|------|--------|----------------|
| s01 封面 | 99 | 3.30 | 同学们好！今天我们来学习定语从句。 | 2.70s |
| s02 定义 | 262 | 8.73 | 定语从句，就是用来限定或修饰名词、代词的从句。被修饰的名词或代词，我们叫它先行词。 | 8.15s |
| s03 位置 | 176 | 5.87 | 定语从句的位置很简单，它一定紧跟在先行词的后面。 | 5.27s |
| s04 关系代词 | 327 | 10.90 | 关系代词有 that、which、who、whom、whose，它们在从句中充当主语、宾语或定语。 | 10.31s |
| s05 that/which | 476 | 15.87 | 只能用 that 的情况有三种：先行词被最高级或序数词修饰、是不定代词、或既有人又有物。只能用 which 的情况有两种：介词之后，和非限制性定语从句。 | 15.25s |
| s06 关系副词 | 211 | 7.03 | 关系副词有 when、where、why，它们都等于介词加 which。 | 6.42s |
| s07 区别 | 233 | 7.77 | 选代词还是副词，关键看成分：缺主语、宾语、定语用代词，缺状语用副词。 | 7.18s |
| s08 省略 | 285 | 9.50 | 关系代词在从句中作宾语时可以省略，比如 This is the film that I like best。 | 8.90s |
| s09 what | 276 | 9.20 | what 等于 the thing that 或者 all that，比如 This is what I know。 | 8.60s |
| s10 翻译 | 225 | 7.50 | 最后来个练习：这是我住的宿舍，有五种表达方式，你掌握了吗？ | 6.89s |
| s11 结尾 | 133 | 4.43 | 学习语法 Step by step，加油！Thanks！ | 3.83s |
| **合计** | **2553** | **85.10** | | **83.50s（配音）+ 间隙** |

## 时间轴数据

场景全局起始帧（考虑 15 帧 fade 转场重叠）：

```
starts = [0, 84, 331, 492, 804, 1265, 1461, 1679, 1949, 2210, 2420]
total = 2553 帧 = 85.1 秒
```

每段配音设计起始秒 = `starts[i] / 30 + 0.6`。

## 技术栈

- remotion 4.0.528
- @remotion/transitions（TransitionSeries + fade）
- @remotion/media-utils（useAudioData + visualizeAudio）
- @remotion/google-fonts（Poppins + Noto Sans SC）
- React 19
- ffmpeg 9.0.1（音轨拼接、静音检测、验证）

## 项目结构

```
attributive-clauses/
├── src/
│   ├── index.ts              # 入口
│   ├── Root.tsx              # 注册 composition
│   ├── Main.tsx              # TransitionSeries + 场景 + DigitalHuman
│   ├── theme.ts              # 配色、缓动、尺寸
│   ├── fonts.ts              # 字体
│   ├── components/
│   │   ├── Background.tsx    # 背景（水彩花枝装饰）
│   │   ├── SceneHeader.tsx   # 场景标题
│   │   ├── ui.tsx            # FadeRise/Card/Chip
│   │   └── DigitalHuman.tsx  # 数字人（SVG + 嘴型同步）
│   └── scenes/
│       ├── SceneOpening.tsx
│       ├── SceneDefinition.tsx
│       ├── ScenePosition.tsx
│       ├── ScenePronouns.tsx
│       ├── SceneThatWhich.tsx
│       ├── SceneAdverbs.tsx
│       ├── SceneDifference.tsx
│       ├── SceneOmission.tsx
│       ├── SceneWhat.tsx
│       ├── SceneTranslation.tsx
│       └── SceneClosing.tsx
├── public/
│   ├── voiceover_track.wav   # 拼接对齐后的完整音轨
│   └── blossom.png            # PPT 提取的水彩花枝装饰
├── voice_segments/
│   ├── s01.wav ... s11.wav   # 原始分段配音
│   └── trimmed/               # 裁剪开头静音后的分段
├── timeline2.json             # 场景时长/起始帧/句内本地帧
├── verify_corr.py             # 互相关定位验证脚本
└── out/
    └── attributive-clauses-final.mp4
```

## 迭代历程

### 第 1 版：无配音
- 纯动画，64.5 秒，9MB
- 渲染成功

### 第 2 版：连续配音（未对齐）
- 一次性生成 56 秒连续配音
- 视频 64.5 秒，配音短了 8.5 秒
- 用户反馈不同步

### 第 3 版：时长硬对齐（被否决）
- 给 Audio 加 playbackRate=0.9，总时长对齐到 62 秒
- 用户明确否定："你只是跟视频时长对齐了，但具体的帧根本没对齐"

### 第 4 版（最终）：分段逐帧对齐
- 按 11 场景分段生成配音
- 裁剪每段开头静音
- ffmpeg adelay 精确拼接
- 文字动画按句内帧重排
- 数字人嘴型同步
- 85.1 秒，14.9MB
- 互相关验证全部对齐

## 关键决策记录

1. **封面删除人名**：用户要求去掉"刘湘屏"，封面只剩"外语教学部 · 2026.9"
2. **数字人放右下角**：300×340 小画中画，不遮挡主动画
3. **配音音色**：年轻亲切女教师、轻快自然像真人，不要机械感
4. **转场**：fade 15 帧，简洁不抢戏
5. **配色**：浅蓝底 + 青/蓝/橙点缀，水彩花枝装饰（从 PPT 提取）

## 验证结果

- 视频流 85.100s，音频流 85.163s（一致）
- 11 段配音互相关定位：全部在设计位置（偏差 < 2.2 帧，s05 经多模板交叉验证确认对齐）
- 静音检测：每场景开始后约 0.75 秒开口（0.6s 设计偏移 + 0.15s 保留静音）
- 5 个关键帧视觉检查：画面正常、数字人不遮挡、嘴型开合
