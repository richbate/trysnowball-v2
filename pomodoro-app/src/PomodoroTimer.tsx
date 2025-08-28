import { useEffect, useRef, useState } from "react";

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const RADIUS = 110;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WORK_DURATION);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            const nextIsBreak = !isBreak;
            setIsBreak(nextIsBreak);
            setSecondsLeft(nextIsBreak ? BREAK_DURATION : WORK_DURATION);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative w-72 h-72">
      <svg className="w-full h-full rotate-[-90deg]">
        <circle
          cx="50%"
          cy="50%"
          r={RADIUS}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="50%"
          cy="50%"
          r={RADIUS}
          stroke="#ffffff"
          strokeWidth="12"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={
            CIRCUMFERENCE - (secondsLeft / (isBreak ? BREAK_DURATION : WORK_DURATION)) * CIRCUMFERENCE
          }
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-light text-white">{formatTime(secondsLeft)}</div>
        <div className="text-md text-white/80 mt-1">{isBreak ? "Break" : "Focus"}</div>
        <div className="flex space-x-4 mt-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded shadow"
            onClick={() => setIsRunning(true)}
          >
            Start
          </button>
          <button
            className="px-4 py-2 bg-yellow-400 text-white rounded shadow"
            onClick={() => setIsRunning(false)}
          >
            Pause
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded shadow"
            onClick={() => {
              setIsRunning(false);
              setIsBreak(false);
              setSecondsLeft(WORK_DURATION);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}