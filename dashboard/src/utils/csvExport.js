// Utility helper to generate and trigger CSV download with UTF-8 BOM
export function downloadCsv(filename, csvContent) {
  // \uFEFF ensures Excel and other spreadsheet apps render UTF-8 correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format detailed link analytics into structured CSV sections
export function generateAnalyticsCsv(data, selectedRangeLabel = 'Last 7 Days') {
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [];

  // 1. Overview Section
  lines.push('=== LINK OVERVIEW ===');
  lines.push('Short Code,Destination URL,Total Clicks,Filtered Clicks,Date Range,Created At,Expired At');
  lines.push([
    escapeCsv(`/${data.shortCode}`),
    escapeCsv(data.originalUrl),
    data.totalClicks || 0,
    data.filteredClicks || data.totalClicks || 0,
    escapeCsv(selectedRangeLabel),
    escapeCsv(new Date(data.createdAt).toLocaleString()),
    escapeCsv(data.expiredAt ? new Date(data.expiredAt).toLocaleString() : 'Never'),
  ].join(','));
  lines.push('');

  // 2. Daily Clicks Trend
  lines.push('=== DAILY CLICKS TREND ===');
  lines.push('Date,Clicks');
  (data.clicksByDay || []).forEach((item) => {
    lines.push(`${escapeCsv(item.date)},${item.count}`);
  });
  lines.push('');

  // 3. Device Breakdown (if available)
  if (data.deviceBreakdown && data.deviceBreakdown.length > 0) {
    const totalDev = data.deviceBreakdown.reduce((s, d) => s + (d.count || 0), 0) || 1;
    lines.push('=== DEVICE BREAKDOWN ===');
    lines.push('Device Type,Clicks,Percentage');
    data.deviceBreakdown.forEach((item) => {
      const pct = Math.round((item.count / totalDev) * 100);
      lines.push(`${escapeCsv(item.deviceType || 'unknown')},${item.count},${pct}%`);
    });
    lines.push('');
  }

  // 4. Browser Breakdown (if available)
  if (data.browserBreakdown && data.browserBreakdown.length > 0) {
    const totalBrow = data.browserBreakdown.reduce((s, b) => s + (b.count || 0), 0) || 1;
    lines.push('=== BROWSER BREAKDOWN ===');
    lines.push('Browser,Clicks,Percentage');
    data.browserBreakdown.forEach((item) => {
      const pct = Math.round((item.count / totalBrow) * 100);
      lines.push(`${escapeCsv(item.browser || 'unknown')},${item.count},${pct}%`);
    });
    lines.push('');
  }

  // 5. Country Breakdown (if available)
  if (data.countryBreakdown && data.countryBreakdown.length > 0) {
    const totalCountry = data.countryBreakdown.reduce((s, c) => s + (c.count || 0), 0) || 1;
    lines.push('=== COUNTRY BREAKDOWN ===');
    lines.push('Country,Clicks,Percentage');
    data.countryBreakdown.forEach((item) => {
      const pct = Math.round((item.count / totalCountry) * 100);
      lines.push(`${escapeCsv(item.country || 'unknown')},${item.count},${pct}%`);
    });
    lines.push('');
  }

  // 6. Top Referrers (if available)
  if (data.topReferrers && data.topReferrers.length > 0) {
    lines.push('=== TOP REFERRERS ===');
    lines.push('Referrer Source,Clicks');
    data.topReferrers.forEach((item) => {
      lines.push(`${escapeCsv(item.referrer || 'Direct / None')},${item.count}`);
    });
    lines.push('');
  }

  return lines.join('\r\n');
}
