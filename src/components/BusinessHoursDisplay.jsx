
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dayNames = {
  sunday: 'ראשון',
  monday: 'שני', 
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'מוצ"ש'
};

const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BusinessHoursDisplay({ hours, isBlackTheme }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle different formats of hours data
  let schedule = {};
  
  if (typeof hours === 'string') {
    try {
      const parsed = JSON.parse(hours);
      schedule = parsed.schedule || parsed;
    } catch (e) {
      // If it's just a string description
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{hours}</span>
        </div>
      );
    }
  } else if (hours && typeof hours === 'object') {
    schedule = hours.schedule || hours;
  }

  if (!schedule || Object.keys(schedule).length === 0) {
    return (
      <div className="text-gray-500">
        <span>שעות הפעילות לא צוינו</span>
      </div>
    );
  }

  // Get today's day
  const today = new Date().getDay(); // 0 = Sunday
  const todayKey = dayOrder[today];
  const todayHours = schedule[todayKey];

  // Format time range for display
  const formatTimeRanges = (timeRanges) => {
    if (!Array.isArray(timeRanges) || timeRanges.length === 0) {
      return 'סגור';
    }
    
    return timeRanges.map(range => `${range.open}-${range.close}`).join(', ');
  };

  // Get today's status
  const getTodayStatus = () => {
    if (!todayHours) return { text: 'סגור', isOpen: false };
    
    if (!todayHours.isOpen) return { text: 'סגור', isOpen: false };
    if (todayHours.is24Hours) return { text: 'פתוח 24 שעות', isOpen: true };
    
    const timeText = formatTimeRanges(todayHours.timeRanges);
    return { text: timeText, isOpen: true };
  };

  const todayStatus = getTodayStatus();

  if (!isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isBlackTheme ? 'text-red-400' : 'text-blue-600'}`} />
            <span className={`font-medium ${isBlackTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              היום:
            </span>
            <span className={`font-medium ${todayStatus.isOpen ? (isBlackTheme ? 'text-green-400' : 'text-green-600') : (isBlackTheme ? 'text-red-400' : 'text-red-600')}`}>
              {todayStatus.text}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className={isBlackTheme ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-blue-600 hover:text-blue-700'}
          >
            הצג הכל
            <ChevronDown className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`font-medium ${isBlackTheme ? 'text-gray-200' : 'text-gray-800'}`}>שעות פעילות</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className={isBlackTheme ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-blue-600 hover:text-blue-700'}
        >
          הסתר
          <ChevronUp className="w-4 h-4 mr-1" />
        </Button>
      </div>

      <div className="space-y-2">
        {dayOrder.map(day => {
          const dayHours = schedule[day];
          const isToday = day === todayKey;
          
          let displayText = 'סגור';
          let textColor = isBlackTheme ? 'text-red-400' : 'text-red-600';
          
          if (dayHours?.isOpen) {
            if (dayHours.is24Hours) {
              displayText = 'פתוח 24 שעות';
              textColor = isBlackTheme ? 'text-green-400' : 'text-green-600';
            } else if (dayHours.timeRanges?.length > 0) {
              displayText = formatTimeRanges(dayHours.timeRanges);
              textColor = isBlackTheme ? 'text-green-400' : 'text-green-600';
            }
          }
          
          return (
            <div
              key={day}
              className={`flex justify-between items-center py-1 px-2 rounded ${
                isToday 
                  ? (isBlackTheme ? 'bg-gray-800 border border-red-400' : 'bg-blue-50 border border-blue-200') 
                  : ''
              }`}
            >
              <span className={`font-medium ${isToday ? (isBlackTheme ? 'text-red-400' : 'text-blue-900') : (isBlackTheme ? 'text-gray-300' : 'text-gray-700')}`}>
                {dayNames[day]}
                {isToday && ' (היום)'}
              </span>
              <span className={textColor}>{displayText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
