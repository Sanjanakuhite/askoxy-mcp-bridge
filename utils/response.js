function textContent(text) {
  return [{ type: 'text', text: JSON.stringify(text) }];
}

function toolResult(payload) {
  return {
    content: textContent(payload)
  };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.content)) return value.content;
  return [];
}

module.exports = {
  toolResult,
  normalizeArray
};
