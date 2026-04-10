import React, { useState, useEffect } from 'react';

/**
 * ExpiryCountdown - Countdown timer for payment/signature expiry
 * Shows remaining time and turns red when close to expiry
 */
const ExpiryCountdown = ({ 
  expiryDate, 
  onExpired,
  warningThresholdMinutes = 60,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onExpired) {
          onExpired();
        }
        return null;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalMinutes: diff / (1000 * 60) });
      return diff;
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(() => {
      const diff = calculateTimeLeft();
      if (diff === null || diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, onExpired]);

  if (!expiryDate || !timeLeft) {
    return null;
  }

  const isWarning = timeLeft.totalMinutes && timeLeft.totalMinutes <= warningThresholdMinutes;
  const isCritical = timeLeft.totalMinutes && timeLeft.totalMinutes <= 15;

  const colorClass = isExpired 
    ? 'text-red-600 bg-red-50' 
    : isCritical 
      ? 'text-red-600 bg-red-50 animate-pulse' 
      : isWarning 
        ? 'text-orange-600 bg-orange-50' 
        : 'text-blue-600 bg-blue-50';

  const formatTimeUnit = (value, unit) => {
    if (value === 0 && unit === 'days') return null;
    return (
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="text-xs text-gray-500">{unit === 'days' ? 'ngày' : unit === 'hours' ? 'giờ' : unit === 'minutes' ? 'phút' : 'giây'}</span>
      </div>
    );
  };

  return (
    <div className={`expiry-countdown rounded-lg p-4 ${colorClass} ${className}`}>
      <div className="text-center mb-2 font-medium">
        {isExpired ? (
          <span className="text-red-600">⚠️ Đã hết hạn</span>
        ) : (
          <span>⏱️ Thời gian còn lại</span>
        )}
      </div>
      
      {!isExpired && (
        <div className="flex justify-center gap-2 items-center">
          {timeLeft.days > 0 && formatTimeUnit(timeLeft.days, 'days')}
          {timeLeft.days > 0 && <span className="text-xl font-bold">:</span>}
          {formatTimeUnit(timeLeft.hours, 'hours')}
          <span className="text-xl font-bold">:</span>
          {formatTimeUnit(timeLeft.minutes, 'minutes')}
          <span className="text-xl font-bold">:</span>
          {formatTimeUnit(timeLeft.seconds, 'seconds')}
        </div>
      )}

      {isWarning && !isExpired && (
        <div className="text-center mt-2 text-sm">
          {isCritical ? '⚠️ Sắp hết hạn! Vui lòng hoàn tất ngay.' : '⚠️ Sắp hết hạn!'}
        </div>
      )}
    </div>
  );
};

export default ExpiryCountdown;
