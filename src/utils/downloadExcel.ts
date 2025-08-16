import * as XLSX from 'xlsx';

interface ExcelDownloadOptions {
  data: any[];
  columns: any[];
  pageName: string;
  selectedYear?: string;
  onDownloadStart?: () => void;
  onDownloadEnd?: () => void;
}

export const downloadExcel = async (options: ExcelDownloadOptions) => {
  const {
    data,
    columns,
    pageName,
    selectedYear = '',
    onDownloadStart,
    onDownloadEnd,
  } = options;

  try {
    if (onDownloadStart) onDownloadStart();

    // First, prepare the data with appropriate headers
    const headerRow = columns.map((col) => col.header);

    // Create a worksheet from scratch
    const worksheet = XLSX.utils.aoa_to_sheet([
      headerRow, // First row as headers
      ...data.map((row: { [x: string]: any }) =>
        columns.map((col: any) => row[col.accessorKey as keyof typeof row])
      ), // Data rows
    ]);

    // Get the range of the worksheet (e.g., A1:G10)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

    // Define border style
    const borderStyle = {
      style: 'thin',
      color: { rgb: '000000' },
    };

    // Add borders to all cells and track content length for column width
    const colWidths: number[] = Array(range.e.c + 1).fill(0);

    // Process each cell for styling and width calculation
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        // Get cell address (e.g., A1, B2)
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        // Get the cell
        const cell = worksheet[cellAddress];

        // If cell exists, add style and calculate width
        if (cell) {
          // If cell doesn't have an 's' (style) property, add it
          if (!cell.s) cell.s = {};

          // Add border style to all sides
          cell.s.border = {
            top: borderStyle,
            bottom: borderStyle,
            left: borderStyle,
            right: borderStyle,
          };

          // Add special style for header row
          if (R === 0) {
            cell.s.fill = {
              fgColor: { rgb: 'E0E0E0' }, // Light gray background
              patternType: 'solid',
            };
            cell.s.font = {
              bold: true,
            };
          }

          // Calculate column width based on content
          // Get content length
          let contentLength = 0;
          if (cell.v !== null && cell.v !== undefined) {
            contentLength = String(cell.v).length;
          }

          // Keep track of the maximum length for each column
          colWidths[C] = Math.max(colWidths[C], contentLength);
        }
      }
    }

    // Set column widths (add some padding to the calculated width)
    worksheet['!cols'] = colWidths.map((width) => ({
      width: Math.min(Math.max(width + 2, 8), 50), // Min 8, max 50 characters, +2 for padding
    }));

    // Create a workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, pageName);

    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true, // Important for styles to be applied
    });

    // Convert buffer to Blob
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Create download link and trigger download
    const fileName = `${pageName.replace(/\s+/g, '_')}${
      selectedYear ? `_${selectedYear}` : ''
    }_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    if (onDownloadEnd) onDownloadEnd();
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    if (onDownloadEnd) onDownloadEnd();
    throw error;
  }
};