/**
 * Transaction status interface
 */
interface TransactionStatus {
  id: string;
  status: 'PENDING' | 'CLOSED' | string;
}

/**
 * Transaction data interface
 */
interface Transaction {
  commission: number;
  pending_date: string  | Date;
  closed_date: string | Date | null;
  statuses: TransactionStatus;
}

/**
 * Income sequence result interface
 */
interface IncomeSequence {
  key: 'current_pending_income' | 'closed_income';
  values: Record<string, string>;
}

/**
 * Configuration options for income sequence generation
 */
interface SequenceOptions {
  includeZeroValues?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'MM/DD/YYYY';
}

/**
 * Date range utility type
 */
type DateRange = {
  startDate: Date;
  endDate: Date;
};

/**
 * Main class for generating commission income sequences
 */
class CommissionSequenceGenerator {
  private readonly options: Required<SequenceOptions>;

  constructor(options: SequenceOptions = {}) {
    this.options = {
      includeZeroValues: false,
      dateFormat: 'YYYY-MM-DD',
      ...options
    };
  }

  /**
   * Generates pending and closed income sequences from transaction data
   */
  public generateIncomeSequence(transactions: Transaction[]): IncomeSequence[] {
    this.validateInput(transactions);

    if (transactions.length === 0) {
      return [];
    }

    const sortedTransactions = this.sortTransactionsByPendingDate(transactions);
    const dateRange = this.getDateRange(sortedTransactions);
    const dailyDates = this.generateDateRange(dateRange.startDate, dateRange.endDate);

    const pendingIncomeValues = this.generatePendingIncomeSequence(sortedTransactions, dailyDates);
    const closedIncomeValues = this.generateClosedIncomeSequence(sortedTransactions, dailyDates);

    return this.buildResultObjects(pendingIncomeValues, closedIncomeValues);
  }

  /**
   * Validates input transactions array
   */
  private validateInput(transactions: Transaction[]): void {
    if (!Array.isArray(transactions)) {
      throw new Error('Transactions must be an array');
    }

    transactions.forEach((transaction, index) => {
      if (!this.isValidTransaction(transaction)) {
        throw new Error(`Invalid transaction at index ${index}`);
      }
    });
  }

  /**
   * Checks if a transaction object is valid
   */
  private isValidTransaction(transaction: any): transaction is Transaction {
    return (
      transaction &&
      typeof transaction.commission === 'number' &&
      typeof transaction.pending_date === 'string' &&
      (transaction.closed_date === null || typeof transaction.closed_date === 'string') &&
      transaction.statuses &&
      typeof transaction.statuses.id === 'string' &&
      typeof transaction.statuses.status === 'string'
    );
  }

  /**
   * Sorts transactions by pending date in ascending order
   */
  private sortTransactionsByPendingDate(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) => 
      new Date(a.pending_date).getTime() - new Date(b.pending_date).getTime()
    );
  }

  /**
   * Determines the date range for processing (extends to end of year)
   */
  private getDateRange(transactions: Transaction[]): DateRange {
    const startDate = new Date(transactions[0].pending_date);
    
    // Get the year from the start date to determine end of year
    const startYear = startDate.getFullYear();
    
    // Set end date to December 31st of the same year
    const endDate = new Date(startYear + 1, 0, 0); // This gives us Dec 31 of startYear
    
    return { startDate, endDate };
  }

  /**
   * Generates array of dates between start and end (inclusive)
   */
  private generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Generates pending income sequence for all dates
   */
  private generatePendingIncomeSequence(
    transactions: Transaction[], 
    dates: Date[]
  ): Record<string, string> {
    const pendingIncomeValues: Record<string, string> = {};
    
    dates.forEach(date => {
      const dateStr = this.formatDate(date);
      const pendingAmount = this.calculatePendingIncomeForDate(transactions, date);
      
      if (this.options.includeZeroValues || pendingAmount !== "0") {
        pendingIncomeValues[dateStr] = pendingAmount;
      }
    });
    
    return pendingIncomeValues;
  }

  /**
   * Generates closed income sequence for all dates
   */
  private generateClosedIncomeSequence(
    transactions: Transaction[], 
    dates: Date[]
  ): Record<string, string> {
    const closedIncomeValues: Record<string, string> = {};
    
    dates.forEach(date => {
      const dateStr = this.formatDate(date);
      const closedAmount = this.calculateClosedIncomeForDate(transactions, date);
      
      if (closedAmount > 0) {
        closedIncomeValues[dateStr] = closedAmount.toString();
      }
    });
    
    return closedIncomeValues;
  }

  /**
   * Calculates pending income for a specific date
   */
  private calculatePendingIncomeForDate(transactions: Transaction[], targetDate: Date): string {
    const totalPending = transactions.reduce((total, transaction) => {
      const pendingDate = new Date(transaction.pending_date);
      const closedDate = transaction.closed_date ? new Date(transaction.closed_date) : null;
      
      // Include if transaction is pending on target date
      if (pendingDate <= targetDate) {
        // Exclude if transaction was closed before or on target date
        if (!closedDate || closedDate > targetDate) {
          return total + transaction.commission;
        }
      }
      
      return total;
    }, 0);
    
    return totalPending.toString();
  }

  /**
   * Calculates closed income for a specific date
   */
  private calculateClosedIncomeForDate(transactions: Transaction[], targetDate: Date): number {
    return transactions
      .filter(transaction => {
        if (!transaction.closed_date) return false;
        const closedDate = new Date(transaction.closed_date);
        return this.isSameDate(closedDate, targetDate);
      })
      .reduce((total, transaction) => total + transaction.commission, 0);
  }

  /**
   * Builds the final result objects
   */
  private buildResultObjects(
    pendingIncomeValues: Record<string, string>,
    closedIncomeValues: Record<string, string>
  ): IncomeSequence[] {
    const result: IncomeSequence[] = [];
    
    if (Object.keys(pendingIncomeValues).length > 0) {
      result.push({
        key: 'current_pending_income',
        values: pendingIncomeValues
      });
    }
    
    if (Object.keys(closedIncomeValues).length > 0) {
      result.push({
        key: 'closed_income',
        values: closedIncomeValues
      });
    }
    
    return result;
  }

  /**
   * Formats date to string based on options
   */
  private formatDate(date: Date): string {
    if (this.options.dateFormat === 'MM/DD/YYYY') {
      return date.toLocaleDateString('en-US');
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Checks if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }
}

/**
 * Utility function for quick usage without class instantiation
 */
export function generateIncomeSequence(
  transactions: Transaction[], 
  options?: SequenceOptions
): IncomeSequence[] {
  const generator = new CommissionSequenceGenerator(options);
  return generator.generateIncomeSequence(transactions);
}

// Example usage
const sampleData: Transaction[] = [
  {
    commission: 60,
    pending_date: "2025-04-21",
    closed_date: "2025-05-30",
    statuses: {
      id: "189131e4-9c9f-42d2-99d9-fe63f5cd22bf",
      status: "CLOSED"
    }
  },
  {
    commission: 1,
    pending_date: "2025-05-30",
    closed_date: null,
    statuses: {
      id: "d504e14b-dc00-4fcb-a2e2-a4cea52855b6",
      status: "PENDING"
    }
  }
];


