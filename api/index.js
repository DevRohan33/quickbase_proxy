export default async function handler(req, res) {
  console.log("Handler invoked:", req.method, req.url);
  console.log("Origin:", req.headers.origin);
  console.log("Referer:", req.headers.referer);
  
  const allowedDomain = "https://uirtus.quickbase.com";
  const origin = req.headers.origin || "";

  // ALWAYS set CORS headers first
  res.setHeader("Access-Control-Allow-Origin", allowedDomain);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (req.method === "OPTIONS") {
    console.log("Preflight request handled");
    return res.status(200).end();
  }

  // Check origin/referer
  const referer = req.headers.referer || "";
  const isAllowed =
    origin === allowedDomain ||
    referer.startsWith(allowedDomain + "/") ||
    referer === allowedDomain;

  console.log("Is allowed:", isAllowed);

  if (!isAllowed) {
    console.log("Access denied");
    return res.status(403).json({ 
      error: "Access Denied",
      origin: origin,
      referer: referer 
    });
  }

  // Get id from query parameter
  const { id } = req.query;
  console.log("API ID:", id);

  // Map allowed API IDs
  const dataMap = {
    main: process.env.API_MAIN,
    projects: process.env.API_PROJECTS,
    team: process.env.API_TEAM,
    name: process.env.API_NAME,
    vertical: process.env.API_VERTICAL_SPACE,
  };

  const data = dataMap[id];

  if (!data) {
    console.log("Invalid API ID");
    return res.status(404).json({ error: "Invalid API ID" });
  }

  console.log("Returning data for:", id);

  // Check if data is a URL (starts with http)
  if (data.startsWith("http://") || data.startsWith("https://")) {
    // It's a URL, fetch it
    try {
    const url = new URL(data);
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "id") url.searchParams.append(key, value);
    }

    console.log("Fetching target URL:", url.toString());

    const response = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });


      console.log("Target API responded:", response.status);

      const contentType = response.headers.get("content-type");
      const fetchedData =
        contentType && contentType.includes("application/json")
          ? await response.json()
          : await response.text();

      return res.status(response.status).send(fetchedData);
    } catch (err) {
      console.error("Proxy Error:", err);
      return res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message 
      });
    }
  } else {
    // It's plain text, return it directly
    return res.status(200).send(data);
  }
}