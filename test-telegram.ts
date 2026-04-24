async function testTelegram() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  
  if (!botToken || !channelId) {
    console.log("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID");
    return;
  }
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId,
      text: "🚀 DarkWave Smart Chain marketing automation is now LIVE!\n\nStay tuned for updates about our revolutionary blockchain ecosystem.",
      parse_mode: "HTML"
    })
  });
  
  const data = await response.json();
  
  if (data.ok) {
    console.log("✅ Telegram message posted successfully!");
  } else {
    console.log("❌ Failed:", data.description);
  }
}

testTelegram();
