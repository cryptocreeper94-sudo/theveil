import { pulseClient, formatSignalEmoji, formatGrade, formatPnL } from "./pulse-client";
import { communityHubService } from "./community-hub-service";
import crypto from "crypto";

const BOT_NAME = "PulseBot";
const BOT_USER_ID = "bot_pulse_wallet";

interface BotCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], userId: string, channelId: string) => Promise<string>;
}

class WalletBotService {
  private commands: Map<string, BotCommand> = new Map();

  constructor() {
    this.registerCommands();
  }

  private registerCommands() {
    this.commands.set("/signals", {
      name: "signals",
      description: "Get top StrikeAgent trading signals",
      usage: "/signals [chain]",
      handler: this.handleSignals.bind(this),
    });

    this.commands.set("/analyze", {
      name: "analyze",
      description: "Analyze a token for safety and momentum",
      usage: "/analyze <token_address>",
      handler: this.handleAnalyze.bind(this),
    });

    this.commands.set("/market", {
      name: "market",
      description: "Get market overview with Fear & Greed",
      usage: "/market",
      handler: this.handleMarket.bind(this),
    });

    this.commands.set("/price", {
      name: "price",
      description: "Get price for a token",
      usage: "/price <symbol>",
      handler: this.handlePrice.bind(this),
    });

    this.commands.set("/portfolio", {
      name: "portfolio",
      description: "View your positions and P&L",
      usage: "/portfolio",
      handler: this.handlePortfolio.bind(this),
    });

    this.commands.set("/mode", {
      name: "mode",
      description: "View or set trading mode",
      usage: "/mode [observer|approval|semi_auto|full_auto]",
      handler: this.handleMode.bind(this),
    });

    this.commands.set("/pending", {
      name: "pending",
      description: "View pending trade suggestions",
      usage: "/pending",
      handler: this.handlePending.bind(this),
    });

    this.commands.set("/approve", {
      name: "approve",
      description: "Approve a trade suggestion",
      usage: "/approve <suggestion_id>",
      handler: this.handleApprove.bind(this),
    });

    this.commands.set("/reject", {
      name: "reject",
      description: "Reject a trade suggestion",
      usage: "/reject <suggestion_id>",
      handler: this.handleReject.bind(this),
    });

    this.commands.set("/linkwallet", {
      name: "linkwallet",
      description: "Link your wallet for trading",
      usage: "/linkwallet <address> [nickname]",
      handler: this.handleLinkWallet.bind(this),
    });

    this.commands.set("/balance", {
      name: "balance",
      description: "Check your wallet balance",
      usage: "/balance",
      handler: this.handleBalance.bind(this),
    });

    this.commands.set("/help", {
      name: "help",
      description: "Show all commands",
      usage: "/help",
      handler: this.handleHelp.bind(this),
    });

    this.commands.set("/quant", {
      name: "quant",
      description: "View Quant system metrics",
      usage: "/quant",
      handler: this.handleQuant.bind(this),
    });
  }

  async processMessage(content: string, userId: string, channelId: string): Promise<string | null> {
    if (!content.startsWith("/")) return null;

    const [commandStr, ...args] = content.trim().split(/\s+/);
    const command = this.commands.get(commandStr.toLowerCase());

    if (!command) {
      return `❌ Unknown command: ${commandStr}\nType /help for available commands.`;
    }

    try {
      return await command.handler(args, `dwch_${userId}`, channelId);
    } catch (error: any) {
      console.error(`[WalletBot] Command ${commandStr} error:`, error);
      return `❌ Error: ${error.message || "Something went wrong"}`;
    }
  }

  async sendBotMessage(channelId: string, content: string): Promise<any> {
    const message = await communityHubService.sendMessage({
      channelId,
      userId: BOT_USER_ID,
      username: BOT_NAME,
      content,
      isBot: true,
      replyToId: null,
    });
    return message;
  }

  private async handleSignals(args: string[], userId: string): Promise<string> {
    const chain = args[0] || "all";
    const { signals, total } = await pulseClient.getStrikeAgentSignals(chain, undefined, 5);

    if (signals.length === 0) {
      return `📭 No signals found for chain: ${chain}`;
    }

    let response = `🤖 **StrikeAgent Signals** (${chain.toUpperCase()})\n\n`;

    for (const sig of signals) {
      response += `**${sig.tokenSymbol}** on ${sig.chain}\n`;
      response += `💰 $${parseFloat(sig.priceUsd).toFixed(6)} | MCap: $${(parseInt(sig.marketCapUsd) / 1e6).toFixed(2)}M\n`;
      response += `📊 Score: ${sig.compositeScore}/100 (${formatGrade(sig.compositeScore)})\n`;
      response += `🔒 Safety: ${sig.safetyScore} | 📈 Momentum: ${sig.momentumScore}\n`;
      response += `💬 ${sig.reasoning}\n\n`;
    }

    response += `📊 Total signals: ${total}`;
    return response;
  }

  private async handleAnalyze(args: string[], userId: string): Promise<string> {
    if (!args[0]) {
      return "❌ Usage: /analyze <token_address>";
    }

    const analysis = await pulseClient.analyzeToken(args[0], userId);
    if (!analysis) {
      return "❌ Could not analyze token. Check the address and try again.";
    }

    const { token, safetyMetrics, movementMetrics, aiAnalysis } = analysis;
    const recEmoji = aiAnalysis.recommendation === "SNIPE" ? "🟢" : 
                     aiAnalysis.recommendation === "WATCH" ? "🟡" : "🔴";

    return `🔍 **Token Analysis: ${token.symbol}**

💰 Price: $${token.priceUsd} (${token.priceSol} SOL)
📊 MCap: $${(token.marketCapUsd / 1e6).toFixed(2)}M
💧 Liquidity: $${(token.liquidityUsd / 1e3).toFixed(1)}K
🏪 DEX: ${token.dex}

🔒 **Safety Score: ${safetyMetrics.score}/100 (${safetyMetrics.grade})**
${safetyMetrics.isHoneypot ? "⚠️ HONEYPOT DETECTED!" : "✅ Not a honeypot"}
${safetyMetrics.hasMintAuthority ? "⚠️ Has mint authority" : "✅ No mint authority"}
${safetyMetrics.risks.length > 0 ? `⚠️ Risks: ${safetyMetrics.risks.join(", ")}` : ""}

📈 **Movement (24h)**
5m: ${movementMetrics.priceChange5m > 0 ? "+" : ""}${movementMetrics.priceChange5m.toFixed(2)}%
1h: ${movementMetrics.priceChange1h > 0 ? "+" : ""}${movementMetrics.priceChange1h.toFixed(2)}%
24h: ${movementMetrics.priceChange24h > 0 ? "+" : ""}${movementMetrics.priceChange24h.toFixed(2)}%
Volume: $${(movementMetrics.volumeUsd24h / 1e6).toFixed(2)}M

${recEmoji} **AI Recommendation: ${aiAnalysis.recommendation}** (${aiAnalysis.score}/100)
💬 ${aiAnalysis.reasoning}`;
  }

  private async handleMarket(): Promise<string> {
    const market = await pulseClient.getMarketOverview();
    if (!market) {
      return "❌ Could not fetch market data";
    }

    const fgEmoji = market.fearGreed <= 25 ? "😱" :
                    market.fearGreed <= 45 ? "😰" :
                    market.fearGreed <= 55 ? "😐" :
                    market.fearGreed <= 75 ? "😊" : "🤑";

    return `📊 **Market Overview**

💹 Total Market Cap: $${(market.totalMarketCap / 1e12).toFixed(2)}T (${market.totalMarketCapChange > 0 ? "+" : ""}${market.totalMarketCapChange.toFixed(2)}%)

₿ BTC Dominance: ${market.btcDominance.toFixed(1)}%
Ξ ETH Dominance: ${market.ethDominance.toFixed(1)}%

${fgEmoji} **Fear & Greed Index: ${market.fearGreed}** (${market.fearGreedLabel})

🔄 Altcoin Season Index: ${market.altcoinSeason}/100`;
  }

  private async handlePrice(args: string[]): Promise<string> {
    if (!args[0]) {
      return "❌ Usage: /price <symbol> (e.g., /price btc)";
    }

    const price = await pulseClient.getPrice(args[0]);
    if (!price) {
      return `❌ Could not fetch price for ${args[0].toUpperCase()}`;
    }

    const changeEmoji = price.usd_24h_change >= 0 ? "📈" : "📉";
    return `💰 **${args[0].toUpperCase()}**

$${price.usd.toLocaleString()} ${changeEmoji} ${price.usd_24h_change >= 0 ? "+" : ""}${price.usd_24h_change.toFixed(2)}% (24h)`;
  }

  private async handlePortfolio(args: string[], userId: string): Promise<string> {
    const [positions, wallets] = await Promise.all([
      pulseClient.getPositions(userId),
      pulseClient.getWallets(userId),
    ]);

    let balance = null;
    if (wallets.length > 0) {
      balance = await pulseClient.getWalletBalance(wallets[0].address);
    }

    let response = "📊 **Your Portfolio**\n\n";

    if (balance) {
      response += `💰 Wallet Balance: ${balance.balance} SOL\n\n`;
    }

    if (positions.length === 0) {
      response += "📭 No open positions";
    } else {
      response += "📈 **Open Positions**\n";
      let totalPnl = 0;

      for (const pos of positions) {
        const pnl = parseFloat(pos.pnlPercent);
        const pnlUsd = parseFloat(pos.pnlUsd);
        totalPnl += pnlUsd;
        response += `${pnl >= 0 ? "🟢" : "🔴"} **${pos.tokenSymbol}**: ${formatPnL(pnl)} ($${pnlUsd.toFixed(2)})\n`;
      }

      response += `\n💵 **Total P&L:** ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`;
    }

    return response;
  }

  private async handleMode(args: string[], userId: string): Promise<string> {
    if (!args[0]) {
      const config = await pulseClient.getTradingConfig(userId);
      if (!config) {
        return "📊 Current mode: observer (default)";
      }
      const modeEmojis: Record<string, string> = {
        observer: "👁️",
        approval: "✋",
        semi_auto: "🤖",
        full_auto: "🚀",
      };
      return `📊 Current mode: ${modeEmojis[config.mode] || ""} **${config.mode}**`;
    }

    const validModes = ["observer", "approval", "semi_auto", "full_auto"];
    if (!validModes.includes(args[0])) {
      return `❌ Invalid mode. Choose: ${validModes.join(", ")}`;
    }

    const result = await pulseClient.setTradingMode(userId, args[0] as any);
    if (!result) {
      return "❌ Failed to update trading mode";
    }

    const modeDescriptions: Record<string, string> = {
      observer: "👁️ **Observer** - AI watches and learns, no trading",
      approval: "✋ **Approval** - AI suggests, you approve each trade",
      semi_auto: "🤖 **Semi-Auto** - AI executes high-confidence trades",
      full_auto: "🚀 **Full Auto** - AI executes all qualifying trades",
    };

    return `✅ Trading mode updated!\n\n${modeDescriptions[args[0]]}`;
  }

  private async handlePending(args: string[], userId: string): Promise<string> {
    const suggestions = await pulseClient.getSuggestions(userId, "pending");

    if (suggestions.length === 0) {
      return "📭 No pending trade suggestions.";
    }

    let response = "🤖 **Pending Trade Suggestions**\n\n";

    for (const sug of suggestions) {
      response += `**ID: ${sug.id.slice(-8)}**\n`;
      response += `${sug.action === "BUY" ? "🟢 BUY" : "🔴 SELL"} **${sug.tokenSymbol}** (${sug.chain})\n`;
      response += `Amount: ${sug.suggestedAmount} SOL | Confidence: ${sug.confidence}%\n`;
      response += `💬 ${sug.reasoning}\n`;
      response += `⏰ Expires: ${new Date(sug.expiresAt).toLocaleString()}\n`;
      response += `Use: /approve ${sug.id.slice(-8)} or /reject ${sug.id.slice(-8)}\n\n`;
    }

    return response;
  }

  private async handleApprove(args: string[], userId: string): Promise<string> {
    if (!args[0]) {
      return "❌ Usage: /approve <suggestion_id>";
    }

    const suggestions = await pulseClient.getSuggestions(userId, "pending");
    const match = suggestions.find(s => s.id.endsWith(args[0]));
    
    if (!match) {
      return `❌ Suggestion not found: ${args[0]}`;
    }

    const approved = await pulseClient.approveSuggestion(match.id, userId);
    if (!approved) {
      return "❌ Failed to approve suggestion";
    }

    const execution = await pulseClient.executeSuggestion(match.id, userId);
    if (execution) {
      return `✅ Trade approved & executing!\n\nTx: ${execution.txSignature?.slice(0, 16)}...`;
    }

    return "✅ Trade approved! Execution pending.";
  }

  private async handleReject(args: string[], userId: string): Promise<string> {
    if (!args[0]) {
      return "❌ Usage: /reject <suggestion_id>";
    }

    const suggestions = await pulseClient.getSuggestions(userId, "pending");
    const match = suggestions.find(s => s.id.endsWith(args[0]));
    
    if (!match) {
      return `❌ Suggestion not found: ${args[0]}`;
    }

    const rejected = await pulseClient.rejectSuggestion(match.id, userId, "Rejected via Community Hub");
    return rejected ? "❌ Trade suggestion rejected." : "❌ Failed to reject suggestion";
  }

  private async handleLinkWallet(args: string[], userId: string): Promise<string> {
    if (!args[0]) {
      return "❌ Usage: /linkwallet <address> [nickname]";
    }

    const address = args[0];
    const nickname = args.slice(1).join(" ") || "My Wallet";

    const wallet = await pulseClient.linkWallet(userId, address, nickname);
    if (!wallet) {
      return "❌ Failed to link wallet";
    }

    return `✅ Wallet linked!\n\n📍 ${address.slice(0, 8)}...${address.slice(-6)}\n📝 ${nickname}`;
  }

  private async handleBalance(args: string[], userId: string): Promise<string> {
    const wallets = await pulseClient.getWallets(userId);

    if (wallets.length === 0) {
      return "❌ No wallet linked. Use /linkwallet <address> to link one.";
    }

    const balance = await pulseClient.getWalletBalance(wallets[0].address);
    if (!balance) {
      return "❌ Could not fetch balance";
    }

    return `💰 **Wallet Balance**\n\n${balance.balance} SOL`;
  }

  private async handleHelp(): Promise<string> {
    return `🤖 **PulseBot Commands**

📊 **Market & Signals**
/signals [chain] - Get StrikeAgent signals
/analyze <address> - Analyze a token
/market - Market overview & Fear/Greed
/price <symbol> - Get token price
/quant - Quant system metrics

💰 **Trading**
/portfolio - View your positions
/mode [mode] - View/set trading mode
/pending - View pending suggestions
/approve <id> - Approve a suggestion
/reject <id> - Reject a suggestion

👛 **Wallet**
/linkwallet <address> - Link wallet
/balance - Check SOL balance

🔧 **Modes:** observer, approval, semi_auto, full_auto
🔗 **Chains:** solana, ethereum, base, polygon, arbitrum, bsc`;
  }

  private async handleQuant(): Promise<string> {
    const metrics = await pulseClient.getQuantMetrics();
    if (!metrics) {
      return "❌ Could not fetch Quant metrics";
    }

    return `🤖 **Quant System Metrics**

📊 Total Scans: ${metrics.totalScans?.toLocaleString() || 0}
🪙 Tokens Analyzed: ${metrics.totalTokensAnalyzed?.toLocaleString() || 0}
📡 Signals Generated: ${metrics.signalsGenerated?.toLocaleString() || 0}

💰 Trades Executed: ${metrics.tradesExecuted || 0}
📈 Win Rate: ${metrics.winRate || 0}%
🎯 Model Accuracy: ${metrics.modelAccuracy || 0}%`;
  }

  verifyWebhook(payload: any, signature: string, timestamp: string): boolean {
    return pulseClient.verifyWebhook(payload, signature, timestamp);
  }
}

export const walletBotService = new WalletBotService();
