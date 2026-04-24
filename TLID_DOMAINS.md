# TLID.io Subdomain Registry

All ecosystem apps are accessible via branded `.tlid.io` subdomains.
These subdomains require a wildcard A record (`*`) at your DNS registrar (Namecheap)
pointing to the same IP address as your main `tlid.io` domain.

Each subdomain must also be added as a custom domain in Replit's publish settings.

---

## DNS Setup (Namecheap - One Time)

1. Log in to Namecheap > Domain List > Manage `tlid.io` > Advanced DNS
2. Find the IP address from your existing `tlid.io` A record
3. Add: **A Record** | Host: `*` | Value: *(same IP)* | TTL: Automatic

---

## All Custom Domains (Purchased)

| Domain | Points To |
|--------|-----------|
| `dwsc.io` | Main Trust Layer app |
| `dwtl.io` | Main Trust Layer app |
| `tlid.io` | Main Trust Layer app |
| `yourlegacy.io` | Chronicles |
| `darkwavegames.io` | The Arcade |
| `darkwavestudios.io` | DarkWave Studios |
| `intothevoid.app` | The Void |
| `trustshield.tech` | TrustShield / Guardian Scanner |
| `garagebot.io` | GarageBot |
| `getorby.io` | Orby |
| `orbitstaffing.io` | ORBIT Staffing OS |
| `lotopspro.com` | Lot Ops Pro |
| `lotopspro.io` | Lot Ops Pro |
| `happyeats.app` | TL Driver Connect / Happy Eats |
| `tldriverconnect.com` | TL Driver Connect |
| `darkwavepulse.com` | Pulse |
| `paintpros.io` | PaintPros |
| `nashpaintpros.io` | Nashville Painting Pros |
| `tradeworksai.io` | TradeWorks AI |
| `brewandboard.coffee` | Brew & Board Coffee |
| `strikeagent.io` | StrikeAgent |
| `vedasolus.io` | VedaSolus |

---

## Subdomains to Add in Replit Publish Settings

Add each of these as a custom domain when publishing:

| # | Subdomain | App Name | Type | Redirects To |
|---|-----------|----------|------|-------------|
| 1 | `academy.tlid.io` | DarkWave Academy | Internal | *(serves /academy)* |
| 2 | `arbora.tlid.io` | Arbora | External | verdara.replit.app/arbora |
| 3 | `arcade.tlid.io` | The Arcade | Internal | *(serves /arcade)* |
| 4 | `brewboard.tlid.io` | Brew & Board Coffee | External | brewandboard.coffee |
| 5 | `chronicles.tlid.io` | Chronicles | Internal | *(serves /)* |
| 6 | `darkwave.tlid.io` | DarkWave | Internal | *(serves /)* |
| 7 | `darkwavegames.tlid.io` | DarkWave Games | Internal | darkwavegames.io |
| 8 | `darkwavestudios.tlid.io` | DarkWave Studios | External | darkwavestudios.io |
| 9 | `driverconnect.tlid.io` | TL Driver Connect | External | happyeats.app |
| 10 | `dwsc.tlid.io` | DWSC | Internal | dwsc.io |
| 11 | `garagebot.tlid.io` | GarageBot | External | garagebot.io |
| 12 | `guardian.tlid.io` | Guardian | Internal | *(serves /guardian-scanner)* |
| 13 | `guardianai.tlid.io` | Guardian AI | Internal | *(serves /guardian-ai)* |
| 14 | `guardianscanner.tlid.io` | Guardian Scanner | Internal | *(serves /guardian-scanner)* |
| 15 | `guardianscreener.tlid.io` | Guardian Screener | Internal | *(serves /guardian-screener)* |
| 16 | `lotopspro.tlid.io` | Lot Ops Pro | External | lotopspro.com |
| 17 | `nashpaintpros.tlid.io` | Nashville Painting Pros | External | nashpaintpros.io |
| 18 | `orbit.tlid.io` | ORBIT Staffing OS | External | orbitstaffing.io |
| 19 | `orby.tlid.io` | Orby | External | getorby.io |
| 20 | `paintpros.tlid.io` | PaintPros | External | paintpros.io |
| 21 | `pulse.tlid.io` | Pulse | External | darkwavepulse.com |
| 22 | `signalchat.tlid.io` | Signal Chat | Internal | *(serves /signal-chat)* |
| 23 | `strikeagent.tlid.io` | StrikeAgent | External | strikeagent.io |
| 24 | `thevoid.tlid.io` | The Void | Internal | *(serves /the-void)* |
| 25 | `throughtheveil.tlid.io` | Through The Veil | Internal | *(serves /veil)* |
| 26 | `tlid.tlid.io` | TLID.io | Internal | *(serves /domains)* |
| 27 | `torque.tlid.io` | Torque | Internal | *(serves /torque)* |
| 28 | `tradeworks.tlid.io` | TradeWorks AI | External | tradeworksai.io |
| 29 | `trusthome.tlid.io` | Trust Home | Internal | *(serves /trust-home)* |
| 30 | `trustlayer.tlid.io` | Trust Layer | Internal | *(serves /)* |
| 31 | `trustshield.tlid.io` | TrustShield | Internal | *(serves /guardian-scanner)* |
| 32 | `trustvault.tlid.io` | Trust Vault | Internal | *(serves /trust-vault)* |
| 33 | `vedasolus.tlid.io` | VedaSolus | External | vedasolus.io |
| 34 | `verdara.tlid.io` | Verdara | External | verdara.replit.app |
| 35 | `yourlegacy.tlid.io` | Your Legacy | Internal | yourlegacy.io |

---

## Types

- **Internal** = Hosted within this Replit app (gateway serves the correct page directly)
- **External** = Hosted on a separate app (gateway redirects to the custom domain)

---

## Quick Copy List (for Replit Publish Settings)

```
academy.tlid.io
arbora.tlid.io
arcade.tlid.io
brewboard.tlid.io
chronicles.tlid.io
darkwave.tlid.io
darkwavegames.tlid.io
darkwavestudios.tlid.io
driverconnect.tlid.io
dwsc.tlid.io
garagebot.tlid.io
guardian.tlid.io
guardianai.tlid.io
guardianscanner.tlid.io
guardianscreener.tlid.io
lotopspro.tlid.io
nashpaintpros.tlid.io
orbit.tlid.io
orby.tlid.io
paintpros.tlid.io
pulse.tlid.io
signalchat.tlid.io
strikeagent.tlid.io
thevoid.tlid.io
throughtheveil.tlid.io
tlid.tlid.io
torque.tlid.io
tradeworks.tlid.io
trusthome.tlid.io
trustlayer.tlid.io
trustshield.tlid.io
trustvault.tlid.io
vedasolus.tlid.io
verdara.tlid.io
yourlegacy.tlid.io
```
