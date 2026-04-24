import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

async function testTweet() {
  try {
    const tweet = await client.v2.tweet("🚀 DarkWave Smart Chain is live! Next-gen Layer 1 blockchain. Lightning-fast DeFi. Home of Chronicles. The future is now. #blockchain #crypto #DeFi https://dwsc.io");
    console.log("✅ Tweet posted successfully!");
    console.log("Tweet ID:", tweet.data.id);
  } catch (error: any) {
    console.error("❌ Error posting tweet:", error.message);
    if (error.data) console.error("Details:", JSON.stringify(error.data, null, 2));
  }
}

testTweet();
