async function testDiscord() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log("❌ DISCORD_WEBHOOK_URL not set");
    return;
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: "🚀 DarkWave Smart Chain marketing automation is now LIVE! Stay tuned for updates about our revolutionary blockchain ecosystem.",
      username: "DarkWave Bot"
    })
  });
  
  if (response.ok) {
    console.log("✅ Discord message posted successfully!");
  } else {
    console.log("❌ Failed:", response.status, await response.text());
  }
}

testDiscord();
