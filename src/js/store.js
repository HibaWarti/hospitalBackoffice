function read(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function write(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function list(key) {
  return read(key);
}

function create(key, item, prefix) {
  const items = read(key);
  const id = item.id || uid(prefix || 'id');
  const next = { ...item, id };
  items.push(next);
  write(key, items);
  return next;
}

function update(key, id, patch) {
  const items = read(key);
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, id };
  write(key, items);
  return items[idx];
}

function removeItem(key, id) {
  const items = read(key).filter((x) => x.id !== id);
  write(key, items);
}

function toCSV(items) {
  if (!items.length) return '';
  const headers = Object.keys(items[0]);
  const rows = items.map((it) =>
    headers.map((h) => String(it[h] ?? '').replace(/"/g, '""')).map((v) => `"${v}"`).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(filename, items) {
  const csv = toCSV(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

