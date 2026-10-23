import { useCallback, useEffect, useRef, useState } from "react";
import { captureSequence } from "../photo/capture";
import { captureSolo, createPhotoStrip } from "../photo/canvas";

import type { PlacedSticker } from "../photo/stickers";

type CameraStatus = "idle" | "requesting" | "ready" | "error";

function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError")
      return "카메라 사용이 차단됐어요. 주소창의 카메라 권한과 기기 설정을 확인한 뒤 다시 켜주세요.";
    if (error.name === "NotFoundError")
      return "연결된 카메라가 없어요. 카메라를 연결한 뒤 다시 켜주세요.";
    if (error.name === "NotReadableError")
      return "카메라를 사용할 수 없어요. 다른 앱에서 사용 중인지 확인해주세요.";
  }
  return error instanceof Error
    ? error.message
    : "카메라 연결에 실패했어요. 다시 시도해주세요.";
}

export function usePhotobooth(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestVersion = useRef(0);
  const captureController = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shooting, setShooting] = useState(false);

  const [seconds, setSeconds] = useState(3);

  const stop = useCallback(() => {
    requestVersion.current++;
    captureController.current?.abort();
    captureController.current = null;
    busy.current = false;
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    stop();
    setStatus("idle");
    setError("");
    setShots([]);
    setCountdown(null);
    setShooting(false);
    return stop;
  }, [active, stop]);

  const startCamera = async () => {
    if (!activeRef.current || status === "requesting" || status === "ready")
      return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("카메라는 localhost 또는 HTTPS 주소에서 실행해주세요.");
      return;
    }
    const version = ++requestVersion.current;
    setStatus("requesting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      if (version !== requestVersion.current || !activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stop();
          setStatus("error");
          setShooting(false);
          setCountdown(null);
          setError("카메라 연결이 종료됐어요. 다시 켜주세요.");
        };
      });
      const video = videoRef.current;
      if (!video) throw new Error("카메라 미리보기를 준비할 수 없습니다.");
      video.srcObject = stream;
      await video.play();
      if (version !== requestVersion.current || !activeRef.current) return;
      setStatus("ready");
    } catch (cause) {
      if (version !== requestVersion.current || !activeRef.current) return;
      stop();
      setStatus("error");
      setError(cameraError(cause));
    }
  };

  const takePhotos = async () => {
    if (
      busy.current ||
      !activeRef.current ||
      status !== "ready" ||
      shots.length === 4
    )
      return;
    busy.current = true;
    const controller = new AbortController();
    captureController.current = controller;
    setShooting(true);
    setShots([]);
    setError("");
    try {
      controller.signal.throwIfAborted();
      await captureSequence({
        seconds,
        signal: controller.signal,
        onCountdown: setCountdown,
        capture: () => {
          if (!videoRef.current)
            throw new Error("카메라 화면을 찾을 수 없습니다.");
          return captureSolo(videoRef.current);
        },
        onShot: (shot) => setShots((previous) => [...previous, shot]),
      });
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cameraError(cause));
        setShots([]);
      }
    } finally {
      if (captureController.current === controller) {
        captureController.current = null;
        busy.current = false;
        setShooting(false);
        setCountdown(null);
      }
    }
  };

  const retake = () => {
    if (busy.current) return;
    setShots([]);
    setError("");
    setCountdown(null);
  };

  const makeEmailPhoto = async (
    color: string,
    stickers: PlacedSticker[] = [],
  ) => {
    if (shots.length !== 4) throw new Error("네 장의 촬영을 완료해주세요.");
    const blob = await createPhotoStrip(shots, color, stickers);
    const bitmap = await createImageBitmap(blob);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = Math.round((bitmap.height * 640) / bitmap.width);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("사진을 준비할 수 없어요.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    } finally {
      bitmap.close();
    }
  };

  return {
    videoRef,
    status,
    error,
    shots,
    countdown,
    shooting,
    seconds,
    setSeconds,
    startCamera,
    takePhotos,
    retake,
    makeEmailPhoto,
  };
}
