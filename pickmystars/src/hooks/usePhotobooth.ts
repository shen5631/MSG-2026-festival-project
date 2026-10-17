import { useCallback, useEffect, useRef, useState } from "react";
import { captureSequence } from "../photo/capture";
import { capturePair, createPhotoStrip, loadImage } from "../photo/canvas";

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

export function usePhotobooth(
  active: boolean,
  idolImage: string,
  winnerName: string,
) {
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
  const [saving, setSaving] = useState(false);
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
    setSaving(false);
    return stop;
  }, [active, idolImage, stop]);

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
      const idol = await loadImage(idolImage);
      controller.signal.throwIfAborted();
      await captureSequence({
        seconds,
        signal: controller.signal,
        onCountdown: setCountdown,
        capture: () => {
          if (!videoRef.current)
            throw new Error("카메라 화면을 찾을 수 없습니다.");
          return capturePair(videoRef.current, idol);
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

  const savePhotos = async (color: string) => {
    if (saving || shots.length !== 4) return;
    const version = requestVersion.current;
    setSaving(true);
    setError("");
    try {
      const blob = await createPhotoStrip(shots, color, winnerName);
      if (version !== requestVersion.current || !activeRef.current) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pick-my-star-${Date.now()}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      if (version === requestVersion.current && activeRef.current)
        setError(cameraError(cause));
    } finally {
      if (version === requestVersion.current) setSaving(false);
    }
  };

  return {
    videoRef,
    status,
    error,
    shots,
    countdown,
    shooting,
    saving,
    seconds,
    setSeconds,
    startCamera,
    takePhotos,
    retake,
    savePhotos,
  };
}
