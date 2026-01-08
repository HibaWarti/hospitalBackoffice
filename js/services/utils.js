(() => {
function exportToCSV(data, filename, columns) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      const stringValue = String(value ?? '');
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${ts}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportToPDF(data, filename, title, columns) {
  if (!window.jspdf) {
    console.error("jsPDF not loaded");
    alert("PDF export not available");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const lang = (window.App && App.Services && App.Services.I18n && App.Services.I18n.getCurrentLang?.()) || 'en';
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${now.toLocaleString(lang)}`, 14, 30);
  
  const tableData = data.map(item =>
    columns.map(col => String(item[col.key] ?? ''))
  );
  
  doc.autoTable({
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233] },
  });
  
  doc.save(`${filename}_${ts}.pdf`);
}
window.App = window.App || {};
App.Services = App.Services || {};
App.Services.Utils = { exportToCSV, exportToPDF };
})();
