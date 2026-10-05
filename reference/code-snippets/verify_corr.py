import subprocess, os, numpy as np

FFDIR = "/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin"
ROOT = "/Users/fengtianzhu/Desktop/attributive-clauses"
FPS = 30
starts = [0, 84, 331, 492, 804, 1265, 1461, 1679, 1949, 2210, 2420]
# 设计起始（秒）：场景开始 + 0.6s（18帧）
design = [s / FPS + 0.6 for s in starts]

def load(path, sr=16000):
    out = subprocess.run(
        [os.path.join(FFDIR, "ffmpeg"), "-y", "-i", path, "-vn", "-ac", "1",
         "-ar", str(sr), "-f", "s16le", "-"],
        capture_output=True).stdout
    return np.frombuffer(out, np.int16).astype(np.float32) / 32768.0

full = load(os.path.join(ROOT, "out/_extracted.wav"))
# 用 _extracted 已是16k，直接读
raw = open(os.path.join(ROOT, "out/_extracted.wav"), "rb").read()
# 简单起见重新转
full = load(os.path.join(ROOT, "out/attributive-clauses-final.mp4"))

print(f"{'场景':<5}{'设计起始s':>10}{'实际起始s':>10}{'偏差帧':>8}{'相关系数':>9}")
worst = 0
for i in range(11):
    seg = load(os.path.join(ROOT, f"voice_segments/trimmed/s{i+1:02d}.wav"))
    # 只取前 2.0s 做模板，降低句中停顿影响
    tpl = seg[: int(2.0 * 16000)]
    n = len(tpl)
    # 滑窗互相关（归一化），搜索范围 设计±3s
    c0 = int((design[i] - 3) * 16000)
    c1 = int((design[i] + 3) * 16000) + n
    c0 = max(0, c0); c1 = min(len(full), c1)
    window = full[c0:c1]
    # 自相关能量
    tpl_n = tpl - tpl.mean()
    tpl_e = np.sqrt((tpl_n ** 2).sum())
    best_off, best_c = 0, -1
    step = 200  # 12.5ms 步进
    for off in range(0, len(window) - n, step):
        w = window[off:off + n]
        wn = w - w.mean()
        we = np.sqrt((wn ** 2).sum())
        if we == 0: continue
        c = (tpl_n * wn).sum() / (tpl_e * we)
        if c > best_c:
            best_c = c; best_off = off
    actual = (c0 + best_off) / 16000
    dframe = (actual - design[i]) * FPS
    worst = max(worst, abs(dframe))
    print(f"s{i+1:02d}  {design[i]:>10.2f}{actual:>10.2f}{dframe:>8.1f}{best_c:>9.3f}")

print(f"\n最大偏差: {worst:.1f} 帧 ({worst/FPS*1000:.0f}ms)")
print("结论:", "通过 ✓" if worst < 8 else "存在明显错位 ✗")
