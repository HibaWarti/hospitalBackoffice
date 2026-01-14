(() => {
function t(key) {
  const svc = window.App && window.App.Services && window.App.Services.I18n;
  if (svc && typeof svc.t === 'function') return svc.t(key);
  return key;
}

function isSwalAvailable() {
  return typeof window.Swal === 'function' && typeof window.Swal.fire === 'function';
}

function toast(type, message) {
  if (!isSwalAvailable()) {
    // Fallback (non-blocking)
    console.log(`[${type}] ${message}`);
    return;
  }

  const Toast = window.Swal.mixin({
    toast: true,
    position: document.documentElement.dir === 'rtl' ? 'top-start' : 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

function toastSuccess(message) {
  toast('success', message);
}

function toastWarning(message) {
  toast('warning', message);
}

function toastError(message) {
  toast('error', message);
}

function confirmDialog(options) {
  const opts = options || {};
  const title = opts.title || t('confirm');
  const text = opts.text || '';
  const icon = opts.icon || 'warning';
  const confirmButtonText = opts.confirmButtonText || t('confirm');
  const cancelButtonText = opts.cancelButtonText || t('cancel');

  if (!isSwalAvailable()) {
    return Promise.resolve(window.confirm(text || title));
  }

  return window.Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: document.documentElement.dir === 'rtl',
  }).then(r => !!r.isConfirmed);
}

function formatDateDMY(value) {
  if (!value) return '';

  if (value instanceof Date) {
    const dd = String(value.getDate()).padStart(2, '0');
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const yyyy = String(value.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

  const str = String(value).trim();
  if (!str) return '';

  // Already in dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Slash format (m/d/yyyy or mm/dd/yyyy) - normalize when possible
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = parseInt(slash[1], 10);
    const b = parseInt(slash[2], 10);
    const yyyy = slash[3];

    // If one side can't be a month, infer the other
    // - a > 12 => dd/mm
    // - b > 12 => mm/dd
    let dd;
    let mm;
    if (a > 12 && b <= 12) {
      dd = a;
      mm = b;
    } else if (b > 12 && a <= 12) {
      dd = b;
      mm = a;
    } else {
      // Ambiguous: assume legacy MM/DD/YYYY and normalize to DD/MM/YYYY
      dd = b;
      mm = a;
    }

    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`;
    }
    return str;
  }

  // ISO yyyy-mm-dd (or yyyy-mm-ddTHH:mm)
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const yyyy = m[1];
    const mm = m[2];
    const dd = m[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  return str;
}

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
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const isRTL = document.documentElement.dir === 'rtl';

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  doc.setFontSize(18);
  doc.text(String(title || ''), 14, 20, { align: isRTL ? 'right' : 'left' });
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`${t('generatedOn')}: ${now.toLocaleString()}`, isRTL ? 196 : 14, 27, { align: isRTL ? 'right' : 'left' });
  doc.setTextColor(0, 0, 0);

  const head = [columns.map((col) => (typeof col === 'object' && col.header) ? String(col.header) : String(col))];
  const body = data.map((item) =>
    columns.map((col) => {
      const key = (typeof col === 'object' && col.key) ? col.key : col;
      return String((item && item[key] != null) ? item[key] : '');
    })
  );

  const autoTableFn = doc.autoTable || (doc && doc.constructor && doc.constructor.API && doc.constructor.API.autoTable);
  if (typeof autoTableFn !== 'function') {
    doc.save(`${filename}_${ts}.pdf`);
    return;
  }

  doc.autoTable({
    head,
    body,
    startY: 32,
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineWidth: 0,
      halign: isRTL ? 'right' : 'left',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      lineWidth: 0,
      fontStyle: 'bold',
    },
    bodyStyles: {
      lineWidth: 0,
      textColor: [17, 24, 39],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 14, right: 14 },
    theme: 'plain',
  });

  doc.save(`${filename}_${ts}.pdf`);
}

function exportDetailsToPDF(data, filename, title, fields) {
   // Legacy wrapper
   if (!window.jspdf) return;
   const mapped = Array.isArray(fields)
     ? fields.map((f) => {
         const key = (f && typeof f === 'object' && f.key != null) ? f.key : null;
         const label = (f && typeof f === 'object' && f.header != null) ? f.header : (key != null ? String(key) : '');
         return { label, value: key != null ? (data ? data[key] : '') : '' };
       })
     : [];
   exportReportToPDF({
     filename,
     title,
     fields: mapped,
   });
}

function exportReportToPDF(options) {
  const opts = options || {};
  const filename = opts.filename || 'report';
  const title = opts.title || t('report') || 'Report';
  const subtitle = opts.subtitle || '';
  const fields = Array.isArray(opts.fields) ? opts.fields : [];
  const sections = Array.isArray(opts.sections) ? opts.sections : [];
  if (!window.jspdf) return Promise.resolve();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const isRTL = document.documentElement.dir === 'rtl';

  const autoTableFn = doc.autoTable || (doc && doc.constructor && doc.constructor.API && doc.constructor.API.autoTable);
  if (typeof autoTableFn !== 'function') {
    doc.save(`${filename}.pdf`);
    return Promise.resolve();
  }

  const primary = [0, 123, 255];
  const marginX = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const centerX = pageW / 2;

  const headerSubtitle = (opts.headerSubtitle != null && String(opts.headerSubtitle).trim())
    ? String(opts.headerSubtitle).trim()
    : (subtitle || 'Hospital Backoffice System');
  const footerText = (opts.footerText != null && String(opts.footerText).trim())
    ? String(opts.footerText).trim()
    : `Generated by Hospital Backoffice – ${new Date().getFullYear()}`;

  const now = new Date();
  doc.setFontSize(18);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(String(title || ''), centerX, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  doc.text(String(headerSubtitle), centerX, 24, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`${t('generatedOn')}: ${now.toLocaleString()}`, centerX, 29, { align: 'center' });
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, 32, pageW - marginX, 32);

  doc.setTextColor(0, 0, 0);

  const mapFields = (items) => (Array.isArray(items) ? items : []).map((f) => [
    (f && f.label != null) ? String(f.label) : '',
    (f && f.value != null) ? String(f.value) : '-',
  ]);

  const normalizedSections = (() => {
    const s = Array.isArray(sections) ? sections.filter(Boolean) : [];
    if (s.length > 0) return s;
    if (fields.length > 0) return [{ title: 'Details', fields }];
    return [];
  })();

  let y = 38;

  normalizedSections.forEach((section) => {
    const sectionTitle = section && section.title != null ? String(section.title) : '';
    const sectionFields = mapFields(section && section.fields);
    if (!sectionTitle && sectionFields.length === 0) return;

    if (sectionTitle) {
      doc.autoTable({
        head: [[sectionTitle]],
        body: [],
        startY: y,
        theme: 'plain',
        styles: {
          fontSize: 12,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineWidth: 0,
          halign: isRTL ? 'right' : 'left',
          valign: 'middle',
        },
        headStyles: {
          fillColor: primary,
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { left: marginX, right: marginX },
      });
      y = doc.lastAutoTable ? doc.lastAutoTable.finalY : y;
    }

    if (sectionFields.length > 0) {
      doc.autoTable({
        head: [],
        body: sectionFields,
        startY: y,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          lineColor: [204, 204, 204],
          lineWidth: 0.2,
          halign: isRTL ? 'right' : 'left',
          valign: 'top',
          textColor: [17, 24, 39],
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { fontStyle: 'normal' },
        },
        margin: { left: marginX, right: marginX },
      });
      y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 10;
    } else {
      y += 8;
    }
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(String(footerText), centerX, pageH - 10, { align: 'center' });
  }

  doc.save(`${filename}.pdf`);
  return Promise.resolve();
}

function exportElementToPDF(element, filename, options) {
  if (!window.html2canvas || !window.jspdf) {
    console.error(t('pdfLibNotLoaded'));
    alert(t('exportNotAvailable'));
    return Promise.resolve();
  }

  const opts = options || {};

  let target = element;
  let cleanup = null;

  if (!opts.raw) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-export-root';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = '800px';
    wrapper.style.padding = '56px';
    wrapper.style.background = '#ffffff';
    wrapper.style.color = '#000000';
    wrapper.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
    wrapper.dir = document.documentElement.dir || 'ltr';

    const style = document.createElement('style');
    style.innerHTML = `
      .pdf-export-root, .pdf-export-root * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        text-shadow: none !important;
        filter: none !important;
      }
      .pdf-export-root { color: #000000; }
      .pdf-export-root * { color: #000000 !important; opacity: 1 !important; }
      .pdf-export-root label,
      .pdf-export-root .text-muted-foreground {
        color: #374151 !important;
      }
      .pdf-export-root h1,
      .pdf-export-root h2,
      .pdf-export-root h3 {
        color: #000000 !important;
      }
      .pdf-export-root .bg-background,
      .pdf-export-root .bg-card,
      .pdf-export-root .bg-muted,
      .pdf-export-root .bg-muted\/20,
      .pdf-export-root .glass {
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }
      .pdf-export-root .border,
      .pdf-export-root .border-border,
      .pdf-export-root .border-input {
        border-color: #e5e7eb !important;
      }
      .pdf-export-root .grid { display: grid !important; }
    `;
    wrapper.appendChild(style);

    const detectedTitle = (opts.title && String(opts.title).trim())
      || element?.getAttribute?.('data-pdf-title')
      || element?.querySelector?.('h1, h2, h3')?.innerText?.trim()
      || String(filename || 'Details');

    const h1 = document.createElement('h1');
    h1.innerText = detectedTitle;
    h1.style.margin = '0 0 6px 0';
    h1.style.fontSize = '20px';
    h1.style.fontWeight = '700';
    wrapper.appendChild(h1);

    const meta = document.createElement('div');
    meta.innerText = `${t('generatedOn')}: ${new Date().toLocaleString()}`;
    meta.style.marginBottom = '18px';
    meta.style.fontSize = '12px';
    meta.style.color = '#6b7280';
    wrapper.appendChild(meta);

    const card = document.createElement('div');
    card.style.border = '1px solid #e5e7eb';
    card.style.borderRadius = '12px';
    card.style.padding = '28px';
    card.style.background = '#ffffff';
    card.style.boxShadow = 'none';

    const clone = element.cloneNode(true);
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.border = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.background = 'transparent';
    clone.style.padding = '0';

    // Remove typical modal header/footer chrome (close/export buttons etc.)
    const buttons = Array.from(clone.querySelectorAll('button'));
    buttons.forEach((btn) => {
      const container = btn.closest('div');
      const shouldRemoveContainer = container && (
        container.classList.contains('border-b') ||
        container.classList.contains('border-t')
      );
      if (shouldRemoveContainer) {
        container.remove();
      } else {
        btn.remove();
      }
    });

    // Remove any explicitly marked elements
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    card.appendChild(clone);
    wrapper.appendChild(card);

    document.body.appendChild(wrapper);
    target = wrapper;
    cleanup = () => {
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    };
  }
  
  return html2canvas(target, {
    scale: 3,
    useCORS: true,
    logging: false,
    letterRendering: true,
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
    
    const margin = 10;
    const imgWidth = 210 - (margin * 2);
    const pageHeight = 297 - (margin * 2);
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    let heightLeft = imgHeight;
    let position = margin;
    
    doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'NONE');
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = margin - (imgHeight - heightLeft);
      doc.addPage();
      doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'NONE');
      heightLeft -= pageHeight;
    }
    
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    
    doc.save(`${filename}_${ts}.pdf`);
  }).finally(() => {
    if (cleanup) cleanup();
  });
}

window.App = window.App || {};
App.Services = App.Services || {};
App.Services.Utils = {
  exportToCSV,
  exportToPDF,
  exportDetailsToPDF,
  exportReportToPDF,
  exportElementToPDF,
  formatDateDMY,
  toastSuccess,
  toastWarning,
  toastError,
  confirmDialog,
};
})();
