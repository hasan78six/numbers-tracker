export function formatDate(dateString: string): string {
    // Create a Date object directly from the ISO string
    const date = new Date(dateString)

    // Format the date using toLocaleString
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        // hour: 'numeric',
        // minute: '2-digit',
        // hour12: true,
    })
}

export function formatDateToYMD(date: Date, timezone: string='UTC'): string {
    const options: Intl.DateTimeFormatOptions = { 
      timeZone: timezone,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }
    
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date)
    const month = parts.find(part => part.type === 'month')?.value || '01'
    const day = parts.find(part => part.type === 'day')?.value || '01'
    const year = parts.find(part => part.type === 'year')?.value || '2000'
    
    return `${year}-${month}-${day}`
  }

export const getTodayDate = (): Date => {
    return new Date()
}

export function getWeekDetails(dateInput: string, timezone: string='UTC') {
    // Create date in specified timezone or default to user's local timezone
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone }
    const formatter = new Intl.DateTimeFormat('en-US', options)
    
    // Parse the input date
    const date = new Date(dateInput)
    
    // Get parts in the correct timezone
    const parts = formatter.formatToParts(date)
    const year = parseInt(parts.find(part => part.type === 'year')?.value || '0')
    const month = parseInt(parts.find(part => part.type === 'month')?.value || '0') - 1 // 0-based month
    const day = parseInt(parts.find(part => part.type === 'day')?.value || '0')
    
    // Create a date object with these parts
    const zonedDate = new Date(Date.UTC(year, month, day))
    
    // Get day of week (0 = Sunday, 6 = Saturday in UTC)
    const dayOfWeek = zonedDate.getUTCDay()
    
    // Calculate Monday of current week
    const monday = new Date(zonedDate)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setUTCDate(zonedDate.getUTCDate() + diffToMonday)
    
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const fullWeek = []
    const fullWeekDates = []
    
    const formatterRange = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    
    // Generate week details
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday)
      current.setUTCDate(monday.getUTCDate() + i)
      
      // Format the date for display in the target timezone
      const formattedParts = new Intl.DateTimeFormat('en-US', { 
        timeZone: timezone,
        day: 'numeric' 
      }).formatToParts(current)
      
      const dayNum = formattedParts.find(part => part.type === 'day')?.value || ''
      const label = `${daysOfWeek[i]} ${dayNum}`
      fullWeek.push(label)
      
      // For fullWeekDates, we need a consistent format
      fullWeekDates.push(formatDateToYMD(current, timezone))
    }
    
    const startOfWeek = new Date(monday)
    const endOfWeek = new Date(monday)
    endOfWeek.setUTCDate(monday.getUTCDate() + 6)
    
    const weekRange = `${formatterRange.format(startOfWeek)} - ${formatterRange.format(endOfWeek)}`
    
    return {
      range: weekRange,
      fullWeek: fullWeek,
      fullWeekDates: fullWeekDates
    }
  }

export function getAdjacentWeekDate(dateInput: string, direction = 'next') {
    const date = new Date(dateInput)
    const diff = direction === 'next' ? 7 : -7

    const newDate = new Date(date)
    newDate.setDate(date.getDate() + diff)

    return newDate
}

export const isSameDate = (date1: Date, date2: Date) => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    )
}

export function getPassedWeeksOfCurrentYear(): number {
  const today = new Date();
  
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const daysPassed = Math.floor((today.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  
  const startDayOfWeek = startOfYear.getDay();
  const adjustedStartDay = startDayOfWeek === 0 ? 7 : startDayOfWeek;
  
  const daysToFirstThursday = (4 - adjustedStartDay + 7) % 7;
  const weeksPassed = Math.ceil((daysPassed + adjustedStartDay - 1) / 7);
  
  if (daysPassed < daysToFirstThursday) {
    return 1; // Just return week 1 in this case
  }
  
  return weeksPassed - 1;
}

export function getReportEndDate(year?: number): string {
  // Get today's date
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // If no year provided, use current year
  const targetYear = year !== undefined ? year : currentYear;
  
  // Case 1: If the target year is the current year
  if (targetYear === currentYear) {
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - daysToSubtract);
    
    const month = String(lastSunday.getMonth() + 1).padStart(2, '0');
    const day = String(lastSunday.getDate()).padStart(2, '0');
    
    return `${targetYear}-${month}-${day}`;
  }
  
  // Case 2: If the target year is in the past
  else if (targetYear < currentYear) {
    return `${targetYear}-12-31`;
  }
  
  // Case 3: If the target year is in the future
  else {
    // Return the first day of the target year
    return `${targetYear}-01-01`;
  }
}

export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

export const getWeeksInYear = (year: number): number => {
  // Get the first day of the year
  const firstDay = new Date(year, 0, 1);
  
  // Get the last day of the year
  const lastDay = new Date(year, 11, 31);
  
  // Get day of week of January 1st (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Get day of week of December 31st
  const lastDayOfWeek = lastDay.getDay();
  
  // A year has 53 weeks if:
  // 1. January 1st is a Thursday, OR
  // 2. January 1st is a Wednesday in a leap year
  if (
    (firstDayOfWeek === 4) || // Thursday
    (firstDayOfWeek === 3 && isLeapYear(year)) // Wednesday in leap year
  ) {
    return 53;
  }
  
  // Otherwise, the year has 52 weeks
  return 52;
};

export function isCurrentYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year === currentYear;
}