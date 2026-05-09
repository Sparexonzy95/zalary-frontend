export default async function handler(req, res) {
  const rawPath = req.query.path;

  const path = Array.isArray(rawPath)
    ? rawPath.join("/")
    : rawPath || "";

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;

    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.append(key, value);
    }
  }

  const targetUrl =
    `http://104.251.216.173/api/${path}` +
    (query.toString() ? `?${query.toString()}` : "");

  const headers = { ...req.headers };
  delete headers.host;
  delete headers["x-forwarded-host"];
  delete headers["x-forwarded-proto"];
  delete headers["x-forwarded-for"];
  delete headers.connection;
  delete headers["content-length"];

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body ?? {}),
    });

    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    res.status(upstream.status);

    const text = await upstream.text();
    res.send(text);
  } catch (error) {
    res.status(502).json({
      error: "Proxy request failed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}