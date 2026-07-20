import { useEffect, useRef, useState } from "react";
import { Modal, Slider } from "antd";

import { canvasThemes } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";

type CanvasVideoFrameExtractDialogProps = {
    videoUrl: string;
    open: boolean;
    onClose: () => void;
    onConfirm: (dataUrl: string, timeMs: number) => void;
};

export function CanvasVideoFrameExtractDialog({ videoUrl, open, onClose, onConfirm }: CanvasVideoFrameExtractDialogProps) {
    const theme = canvasThemes[useThemeStore((state) => state.theme)];
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [seeking, setSeeking] = useState(false);

    useEffect(() => {
        if (!open) {
            setDuration(0);
            setCurrentTime(0);
        }
    }, [open]);

    const seekTo = (time: number) => {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(time);
        setSeeking(true);
        video.currentTime = time;
    };

    const extractFrame = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        onConfirm(dataUrl, Math.round(currentTime * 1000));
    };

    return (
        <Modal title="视频抽帧" open={open && Boolean(videoUrl)} onCancel={onClose} footer={null} width={780} centered destroyOnHidden>
            <div className="space-y-4">
                <div className="flex justify-center">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="max-h-[50vh] w-auto max-w-full rounded-lg bg-black"
                        controls={false}
                        playsInline
                        onLoadedMetadata={(event) => {
                            const video = event.currentTarget;
                            setDuration(video.duration || 0);
                            setCurrentTime(0);
                        }}
                        onSeeked={() => setSeeking(false)}
                        crossOrigin="anonymous"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs" style={{ color: theme.node.muted }}>
                        <span>选择抽帧时间点</span>
                        <span>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <Slider
                        min={0}
                        max={duration || 0}
                        step={0.01}
                        value={currentTime}
                        tooltip={{ formatter: (value) => formatTime(value || 0) }}
                        onChange={seekTo}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="rounded-full px-4 py-2 text-sm transition hover:opacity-80"
                        style={{ background: theme.node.fill, color: theme.node.text }}
                        onClick={onClose}
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        className="rounded-full px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: seeking ? "#999" : "#1677ff" }}
                        disabled={seeking || !duration}
                        onClick={extractFrame}
                    >
                        提取该帧
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function formatTime(seconds: number) {
    if (!seconds || !Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
