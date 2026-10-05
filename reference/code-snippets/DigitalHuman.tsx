import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { visualizeAudio, useAudioData } from "@remotion/media-utils";
import { COLORS } from "../theme";

// 卡通女教师数字人：SVG 绘制，嘴巴随音频音量开合
const Avatar: React.FC<{ mouthOpen: number; blink: number }> = ({
  mouthOpen,
  blink,
}) => {
  // mouthOpen: 0~1，嘴巴开合度
  const mouthH = 6 + mouthOpen * 26; // 嘴巴高度
  const headBob = mouthOpen * 3; // 说话时头部轻微上下

  return (
    <svg
      width="300"
      height="340"
      viewBox="0 0 300 340"
      style={{ display: "block" }}
    >
      {/* 背景圆 */}
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </radialGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d4037" />
          <stop offset="100%" stopColor="#3e2723" />
        </linearGradient>
        <linearGradient id="clothGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      <circle cx="150" cy="160" r="140" fill="url(#bgGrad)" />

      {/* 身体/衣服 */}
      <g transform={`translate(0, ${headBob})`}>
        <path
          d="M80 340 Q80 260 150 250 Q220 260 220 340 Z"
          fill="url(#clothGrad)"
        />
        {/* 衣领 */}
        <path
          d="M120 258 L150 290 L180 258"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* 脖子 */}
        <rect x="135" y="220" width="30" height="40" rx="8" fill="#f5c9a8" />

        {/* 头 */}
        <ellipse cx="150" cy="155" rx="62" ry="68" fill="#f5c9a8" />

        {/* 头发 - 后层 */}
        <path
          d="M88 150 Q80 80 150 72 Q220 80 212 150 Q215 120 200 105 Q190 85 150 82 Q110 85 100 105 Q85 120 88 150 Z"
          fill="url(#hairGrad)"
        />
        {/* 刘海 */}
        <path
          d="M95 120 Q110 85 150 82 Q190 85 205 120 Q190 100 170 105 Q160 92 150 95 Q140 92 130 105 Q110 100 95 120 Z"
          fill="url(#hairGrad)"
        />
        {/* 两侧头发 */}
        <ellipse cx="92" cy="165" rx="14" ry="40" fill="url(#hairGrad)" />
        <ellipse cx="208" cy="165" rx="14" ry="40" fill="url(#hairGrad)" />

        {/* 眉毛 */}
        <path
          d="M112 132 Q124 124 138 130"
          fill="none"
          stroke="#4e342e"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M162 130 Q176 124 188 132"
          fill="none"
          stroke="#4e342e"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 眼睛 */}
        <g>
          {/* 左眼 */}
          <ellipse
            cx="125"
            cy="152"
            rx="9"
            ry={blink > 0.5 ? 1.5 : 10}
            fill="#2d1b0e"
          />
          {blink < 0.5 && (
            <circle cx="127" cy="149" r="3" fill="#fff" />
          )}
          {/* 右眼 */}
          <ellipse
            cx="175"
            cy="152"
            rx="9"
            ry={blink > 0.5 ? 1.5 : 10}
            fill="#2d1b0e"
          />
          {blink < 0.5 && (
            <circle cx="177" cy="149" r="3" fill="#fff" />
          )}
        </g>

        {/* 腮红 */}
        <ellipse cx="108" cy="175" rx="12" ry="7" fill="#f8a5a5" opacity="0.6" />
        <ellipse cx="192" cy="175" rx="12" ry="7" fill="#f8a5a5" opacity="0.6" />

        {/* 鼻子 */}
        <path
          d="M148 165 Q146 175 150 178 Q154 175 152 165"
          fill="none"
          stroke="#e0a882"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 嘴巴 - 随音量开合 */}
        <ellipse
          cx="150"
          cy="196"
          rx={10 + mouthOpen * 4}
          ry={mouthH / 2}
          fill="#c0392b"
        />
        {mouthOpen > 0.15 && (
          <ellipse
            cx="150"
            cy={196 + mouthH / 6}
            rx={7 + mouthOpen * 3}
            ry={mouthH / 5}
            fill="#e74c3c"
            opacity="0.7"
          />
        )}
      </g>
    </svg>
  );
};

export const DigitalHuman: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile("voiceover_track.wav"));

  // 音量驱动嘴巴
  let mouthOpen = 0;
  if (audioData) {
    const v = visualizeAudio({
      frame,
      fps,
      audioData,
      numberOfSamples: 32,
    });
    // 取低频段（人声主要能量）平均
    const low = v.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
    mouthOpen = Math.min(1, low * 4.5);
    // 平滑
    mouthOpen = mouthOpen * 0.7 + (mouthOpen > 0.05 ? 0.3 : 0);
  }

  // 眨眼：每 4 秒眨一次
  const blinkCycle = frame % (4 * fps);
  const blink = interpolate(
    blinkCycle,
    [0, 4, 8, 12],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <>
      {/* 配音音轨：按场景分段后精确对齐的完整音轨 */}
      <Audio src={staticFile("voiceover_track.wav")} />

      {/* 右下角数字人画中画 */}
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 90,
          width: 300,
          height: 340,
          borderRadius: 28,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 20px 50px -18px rgba(3,105,161,0.5)",
          border: "2px solid rgba(255,255,255,0.9)",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          opacity: interpolate(frame, [10, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: String(
            interpolate(frame, [10, 30], [0.8, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })
          ),
        }}
      >
        <Avatar mouthOpen={mouthOpen} blink={blink} />
        {/* 说话指示条 */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 4,
            alignItems: "flex-end",
            height: 18,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4 + mouthOpen * 14 * (1 - Math.abs(i - 2) * 0.15),
                borderRadius: 2,
                background: COLORS.sky,
                opacity: mouthOpen > 0.05 ? 0.9 : 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
