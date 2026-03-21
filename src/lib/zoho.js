const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_API_BASE = "https://api.zakya.in/inventory/v1";

let cachedAccessToken = null;
let tokenExpiresAt = 0;

export async function getAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }
  const params = new URLSearchParams({
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });
  const res = await fetch(`${ZOHO_ACCOUNTS_URL}?${params.toString()}`, { method: "POST" });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Zoho token response not JSON: ${text.slice(0, 200)}`);
  }
  if (data.error) throw new Error(`Zoho OAuth error: ${data.error}`);
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedAccessToken;
}

export async function zohoGet(endpoint, params = {}) {
  const token = await getAccessToken();
  const query = new URLSearchParams({
    organization_id: process.env.ZOHO_ORG_ID,
    ...params,
  });
  const url = `${ZOHO_API_BASE}${endpoint}?${query.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Zoho API error ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Zoho returned non-JSON: ${text.slice(0, 200)}`);
  }
}

export async function fetchAllInvoices(dateFrom, dateTo) {
  let page = 1;
  let all = [];
  let hasMore = true;
  while (hasMore) {
    const data = await zohoGet("/invoices", {
      date_start: dateFrom,
      date_end: dateTo,
      status: "paid",
      page: page.toString(),
      per_page: "200",
      sort_column: "date",
      sort_order: "A",
    });
    all = all.concat(data.invoices || []);
    hasMore = data.page_context?.has_more_page || false;
    page++;
  }
  return all;
}
