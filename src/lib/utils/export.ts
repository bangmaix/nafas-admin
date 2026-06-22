/**
 * Utility to convert an array of objects to a CSV string and trigger a download.
 * @param data Array of objects to export
 * @param filename Desired filename (e.g., 'attendance_report.csv')
 * @param headers Optional mapping of keys to header labels
 */
export function exportToCSV(data: any[], filename: string, headers?: Record<string, string>) {
  if (!data || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const headerRow = headers
    ? keys.map(key => headers[key] || key).join(",")
    : keys.join(",");

  const rows = data.map(obj => {
    return keys.map(key => {
      let val = obj[key];

      // Handle nested objects (like user_profiles or mosques)
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        val = val.name || val.full_name || JSON.stringify(val);
      }

      // Format as string and escape quotes
      const stringVal = val === null || val === undefined ? "" : String(val);
      const escaped = stringVal.replace(/"/g, '""');

      return `"${escaped}"`;
    }).join(",");
  });

  const csvContent = [headerRow, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
