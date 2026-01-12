(() => {
function exportToCSV(data, filename, columns) {
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
  // Normalize columns (handle string or object)
  const headers = columns.map(col => (typeof col === 'object' && col.header) ? col.header : col).join(',');
  
  const rows = data.map(item =>
    columns.map(col => {
      const key = (typeof col === 'object' && col.key) ? col.key : col;
      const value = item[key];
      const stringValue = String(value ?? '');
      
      let finalValue = stringValue;
      
      // Force string for phone numbers or values starting with +, 0, or containing - (to prevent Excel formula/date interpretation)
      if (/^[\d\-\+\(\)\s]+$/.test(stringValue) && (stringValue.includes('-') || stringValue.startsWith('+') || stringValue.startsWith('0')) && stringValue.length > 3) {
         finalValue = `="${stringValue}"`;
      }
      
      if (finalValue.includes(',') || finalValue.includes('"')) {
        return `"${finalValue.replace(/"/g, '""')}"`;
      }
      return finalValue;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  // Add BOM for UTF-8 support in Excel
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${ts}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportToPDF(data, filename, title, columns) {
  // Use HTML rendering for better font support (Arabic) and consistency
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '800px';
  wrapper.style.padding = '40px';
  wrapper.style.background = 'white';
  wrapper.style.color = 'black';
  wrapper.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
  wrapper.dir = document.documentElement.dir || 'ltr';

  const h1 = document.createElement('h1');
  h1.innerText = title;
  h1.style.marginBottom = '10px';
  wrapper.appendChild(h1);

  const p = document.createElement('p');
  p.innerText = `Generated on: ${new Date().toLocaleString()}`;
  p.style.marginBottom = '20px';
  p.style.fontSize = '12px';
  p.style.color = '#666';
  wrapper.appendChild(p);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '12px';

  // Header
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  trHead.style.background = '#0ea5e9';
  trHead.style.color = 'white';
  
  columns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = (typeof col === 'object' && col.header) ? col.header : col;
    th.style.padding = '8px';
    th.style.border = '1px solid #ddd';
    th.style.textAlign = 'left';
    if (document.documentElement.dir === 'rtl') th.style.textAlign = 'right';
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  data.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.style.background = index % 2 === 0 ? '#fff' : '#f9fafb';
    columns.forEach(col => {
      const td = document.createElement('td');
      const key = (typeof col === 'object' && col.key) ? col.key : col;
      td.innerText = item[key] ?? '';
      td.style.padding = '8px';
      td.style.border = '1px solid #ddd';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);

  document.body.appendChild(wrapper);

  exportElementToPDF(wrapper, filename).finally(() => {
    document.body.removeChild(wrapper);
  });
}

function exportDetailsToPDF(data, filename, title, fields) {
   // Legacy wrapper
   if (!window.jspdf) return;
   exportToPDF([data], filename, title, fields);
}

function exportElementToPDF(element, filename) {
  if (!window.html2canvas || !window.jspdf) {
    console.error("html2canvas or jsPDF not loaded");
    alert("Export not available");
    return Promise.resolve();
  }
  
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    ignoreElements: (element) => {
        // Ignore buttons, close icons, and elements explicitly marked
        if (element.tagName === 'BUTTON') return true;
        if (element.classList.contains('no-print')) return true;
        if (element.id && typeof element.id === 'string' && (element.id.includes('close') || element.id.includes('export'))) return true;
        return false;
    }
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; 
    const pageHeight = 297; 
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    
    doc.save(`${filename}_${ts}.pdf`);
  });
}

window.App = window.App || {};
App.Services = App.Services || {};
App.Services.Utils = { exportToCSV, exportToPDF, exportDetailsToPDF, exportElementToPDF };
})();
