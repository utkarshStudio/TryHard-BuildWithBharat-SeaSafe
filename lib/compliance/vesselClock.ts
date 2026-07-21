export interface VesselClockConfig {
  /** How many seconds of wall-clock time equal one hour of voyage time. */
  wallSecondsPerVoyageHour: number;
  /** Total voyage duration in hours. */
  totalVoyageHours: number;
  /** Initial progress for resume after a pause. */
  initialProgress?: number;
}

export interface VesselClock {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function createVesselClock(
  config: VesselClockConfig,
  onProgress: (t: number) => void,
): VesselClock {
  let rafId: number | null = null;
  let startTime: number | null = null;
  let baseProgress = Math.max(0, Math.min(1, config.initialProgress ?? 0));

  function tick(now: number) {
    if (startTime === null) startTime = now;
    const elapsedWallMs = now - startTime;
    const elapsedVoyageHours =
      elapsedWallMs / 1000 / config.wallSecondsPerVoyageHour;
    const elapsedProgress =
      elapsedVoyageHours / Math.max(1, config.totalVoyageHours);
    const t = Math.min(baseProgress + elapsedProgress, 1);
    onProgress(t);
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
      startTime = null;
      baseProgress = 1;
    }
  }

  return {
    start: () => {
      if (rafId !== null || baseProgress >= 1) return;
      rafId = requestAnimationFrame(tick);
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (startTime !== null) {
        const elapsedWallMs = performance.now() - startTime;
        const elapsedVoyageHours =
          elapsedWallMs / 1000 / config.wallSecondsPerVoyageHour;
        baseProgress = Math.min(
          1,
          baseProgress +
            elapsedVoyageHours / Math.max(1, config.totalVoyageHours),
        );
      }
      startTime = null;
    },
    reset: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      startTime = null;
      baseProgress = 0;
      onProgress(0);
    },
  };
}
