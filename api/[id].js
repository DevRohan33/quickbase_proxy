export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin || "";

  // Restrict domain access
  if (origin !== allowedOrigin) {
    return res.status(403).json({ error: "Access Denied: Invalid Origin" });
  }

  // CORS setup
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Handle preflight
  }

  //  Map allowed API IDs to environment variables
  const apiMap = {
    main: process.env.API_MAIN,
    projects: process.env.API_PROJECTS,
    team: process.env.API_TEAM,
  };

  const { id } = req.query;
  const targetUrl = apiMap[id];

  if (!targetUrl) {
    return res.status(404).json({ error: "Invalid API ID" });
  }

  try {
    // Forward request to Quickbase API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });

    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    res.status(200).send(data);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
