async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers
    }
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return data;
}

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`POST ${url} failed: ${response.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return data;
}

module.exports = {
  getJson,
  postJson
};
