export default async function handler(req, res) {
  const allowedDomain = "https://uirtus.quickbase.com";
  const origin = req.headers.origin || "";

  // CORS headers 
  res.setHeader("Access-Control-Allow-Origin", allowedDomain);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Check origin/referer after CORS headers
  const isAllowed =
    origin === allowedDomain ||
    (req.headers.referer || "").startsWith(allowedDomain);

  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied" });
  }

  // Get id from path parameter
  const { id } = req.query;

  // Map allowed API IDs
  const apiMap = {
    main: process.env.API_MAIN,
    projects: process.env.API_PROJECTS,
    team: process.env.API_TEAM,
  };

  const targetUrl = apiMap[id];

  if (!targetUrl) {
    return res.status(404).json({ error: "Invalid API ID" });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });

    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    res.status(response.status).send(data);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}