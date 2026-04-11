import { useEffect, useState } from "react";
import { Timer, AlertTriangle, Clock } from "lucide-react";

export interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  size?: "sm" | "md" | "lg";
}

export function CountdownTimer({ expiresAt, onExpire, size = "md" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expiration = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiration - now);
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getUrgencyStyles = (timeLeft: number) => {
    if (timeLeft === 0) {
      return "text-red-600 font-bold";
    } else if (timeLeft < 30000) { // < 30 seconds
      return "text-orange-600 font-bold animate-pulse";
    } else if (timeLeft < 60000) { // < 1 minute
      return "text-yellow-600 font-semibold";
    }
    return "text-green-600 font-semibold";
  };

  const getSizeStyles = (size: string) => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-xl md:text-2xl";
      default:
        return "text-base";
    }
  };

  const StatusIcon = ({ timeLeft }: { timeLeft: number }) => {
    if (timeLeft === 0) return <Clock className="w-4 h-4" />;
    if (timeLeft < 30000) return <AlertTriangle className="w-4 h-4" />;
    return <Timer className="w-4 h-4" />;
  };

  if (timeLeft === 0) {
    return (
      <div className={`flex items-center gap-1 ${getSizeStyles(size)} text-red-400 font-bold`}>
        <Clock className="w-4 h-4" />
        <span>TIEMPO AGOTADO</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${getSizeStyles(size)} ${getUrgencyStyles(timeLeft)}`}>
      <StatusIcon timeLeft={timeLeft} />
      <span className="font-mono tracking-wider">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}

// Hook for using countdown functionality
export function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const expiration = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiration - now);
      
      setTimeLeft(remaining);
      setIsExpired(remaining === 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    isExpired,
    formattedTime: formatTime(timeLeft),
    isUrgent: timeLeft > 0 && timeLeft < 30000,
    isWarning: timeLeft > 0 && timeLeft < 60000
  };
}
