import { CalendarEvent } from '@/views/Schedule/types'

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

interface WorkingDaysCount {
    workingDaysCount: number
    nonWorkingDaysCount: number
}

const weekdayToIndex: Record<Weekday, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
}

export const getWorkingDaysCountBySelection = (
  selectedDays: Weekday[],
  year: number,
  events: CalendarEvent[],
  history_working_days: number,
  history_non_working_days: number,
  startDate: Date
): WorkingDaysCount => {
  // Convert selected weekdays to a Set for O(1) lookup
  const selectedDayIndexes = new Set(
    selectedDays.map((day) => weekdayToIndex[day])
  );

  // Use the provided start date but normalize to start of day
  const calculationStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDate = new Date(year, 11, 31);

  // Validate that start date is not after end date
  if (calculationStartDate > endDate) {
    throw new Error('Start date cannot be after the end of the specified year');
  }

  // Build override map for calendar events - Map of ISO date -> 'ON' or 'OFF'
  const overrideMap = new Map<string, 'ON' | 'OFF'>();


  for (const event of events) {
    
    // Handle dates in local timezone to avoid timezone issues
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    
    // Create proper local dates without time components
    const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // Fix: Don't subtract day for end date - use it as-is for single day events
    // For multi-day events, subtract 1 day to make it inclusive
    const isMultiDay = end.getTime() - start.getTime() > 24 * 60 * 60 * 1000;
    if (isMultiDay) {
      endLocal.setDate(endLocal.getDate() - 1);
    }
    
    
    // Generate all dates in the event range
    const currentDate = new Date(startLocal);
    const eventDates = [];
    
    while (currentDate <= endLocal) {
      // Use local date formatting to avoid timezone issues
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      
      eventDates.push(localDate);
      overrideMap.set(localDate, event.title as 'ON' | 'OFF');
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
  }


  // Calculate working days from the custom start date to end of year
  let currentWorkingDays = 0;
  let currentTotalDays = 0;

  // Create a copy of the start date to avoid modifying the original
  const currentDate = new Date(calculationStartDate);
  
  
  while (currentDate <= endDate) {
    currentTotalDays++;
    
    const dayOfWeek = currentDate.getDay();
    
    // Use local date formatting consistently
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    const override = overrideMap.get(localDate);
    const isNormallyWorkingDay = selectedDayIndexes.has(dayOfWeek);

    // Debug: Log override information
    if (override) {
      console.log(`Date: ${localDate}, Override: ${override}, Normal Working Day: ${isNormallyWorkingDay}`);
    }

    // Determine if this day should be counted as a working day
    if (override === 'OFF') {
      // Explicitly non-working - don't count even if it's normally a working day
    } else if (override === 'ON') {
      // Explicitly working - always count regardless of normal schedule
      currentWorkingDays++;
    } else if (isNormallyWorkingDay) {
      // No override - use default selected weekdays
      currentWorkingDays++;
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add historical data to current calculation
  const totalWorkingDays = history_working_days + currentWorkingDays;
  const totalNonWorkingDays = history_non_working_days + (currentTotalDays - currentWorkingDays);

  return {
    workingDaysCount: totalWorkingDays,
    nonWorkingDaysCount: totalNonWorkingDays,
  };
};

export const applyBooleanArrayToDays = (boolArray: boolean[] = []) => {
    const result = defaultDays.map((day, index) => ({
        ...day,
        selected: boolArray[index] ?? false,
    }))

    return result
}

export const getBooleanArrayFromDays = (
    days: typeof defaultDays,
): boolean[] => {
    return days.map((day) => day.selected)
}

export const defaultDays = [
    {
        name: 'Mon',
        key: 1,
        selected: false,
    },
    {
        name: 'Tue',
        key: 2,
        selected: false,
    },
    {
        name: 'Wed',
        key: 3,
        selected: false,
    },
    {
        name: 'Thu',
        key: 4,
        selected: false,
    },
    {
        name: 'Fri',
        key: 5,
        selected: false,
    },
    {
        name: 'Sat',
        key: 6,
        selected: false,
    },
    {
        name: 'Sun',
        key: 0,
        selected: false,
    },
]
