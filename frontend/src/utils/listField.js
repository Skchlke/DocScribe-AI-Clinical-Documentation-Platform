// Generic helpers for editing an array field held in React state via a setter,
// e.g. setForm(prev => ({ ...prev, allergies: addItem(prev.allergies, value) })).

export function addItem(list, value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return list;
  if (list.includes(trimmed)) return list;
  return [...list, trimmed];
}

export function removeItem(list, index) {
  return list.filter((_, i) => i !== index);
}

export function updateItem(list, index, value) {
  return list.map((item, i) => (i === index ? value : item));
}
