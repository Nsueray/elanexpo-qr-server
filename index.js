require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const apiDomain = process.env.ZOHO_API_DOMAIN;
const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;

let accessToken = "";

async function refreshAccessToken() {
  try {
    const response = await axios.post(`https://accounts.zoho.com/oauth/v2/token`, null, {
      params: {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token"
      }
    });

    accessToken = response.data.access_token;
    console.log("✅ Token yenilendi.");
  } catch (error) {
    console.error("❌ Token yenileme hatası:", error.response?.data || error.message);
  }
}

refreshAccessToken();
setInterval(refreshAccessToken, 50 * 60 * 1000);

app.get("/badge", async (req, res) => {
  const badgeId = req.query.badge_id;
  if (!badgeId) return res.status(400).json({ error: "Badge ID eksik." });

  try {
    const response = await axios.get(`${apiDomain}/crm/v2/Visitors/search?criteria=(Badge_ID:equals:${badgeId})`, {
      headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
    });

    const visitor = response.data.data?.[0];
    if (!visitor) return res.status(404).json({ error: "Ziyaretçi bulunamadı." });

    res.json({
      name: `${visitor.Name || ""} ${visitor.Visitor_Last_Name || ""}`,
      company: visitor.Company || "",
      country: visitor.Country || ""
    });

  } catch (error) {
    console.error("❌ Hata:", error.response?.data || error.message);
    res.status(500).json({ error: "Veri alınamadı." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
