# 🌊 SeaSafe — Captain's Copilot

> **Official submission by Team TryHard for Build With Bharat 2026**
>
> SeaSafe is an AI-powered maritime decision-support platform designed for merchant shipping. It analyzes geopolitical threats, cyclones, piracy, port congestion, and weather conditions to recommend safer, smarter, and more efficient shipping routes while ensuring compliance with global maritime data regulations.

---
<p align="center">

<a href="https://cerulean-meringue-9c5cdc.netlify.app" target="_blank">
  🌐 Live Demo
</a>
&nbsp;•&nbsp;
<a href="https://github.com/utkarshStudio/TryHard-BuildWithBharat-SeaSafe" target="_blank">
  📂 GitHub Repository
</a>

</p>

# 🚢 About SeaSafe

SeaSafe simulates the workflow of a ship's captain receiving critical advisories during a voyage.

Instead of relying solely on navigation data, SeaSafe combines AI reasoning, weather intelligence, maritime risk analysis, and compliance-aware decision support to help captains make informed routing decisions.

The platform provides complete transparency by displaying every AI tool call, route comparison, and recommendation before the captain makes the final decision.

---

# ✨ Key Features

## 🌍 Five Interactive Maritime Scenarios

* 🔴 Red Sea Missile Threat
* 🛢 Strait of Hormuz Seizure Risk
* 🚢 Panama Canal Drought
* 🏴 Singapore Strait Piracy
* 🌪 Arabian Sea Cyclone

Switch instantly between scenarios using keyboard shortcuts or the scenario selector.

---

## 🛠 Custom Scenario Builder

Create your own voyage by specifying:

* Vessel Name
* Vessel Type
* Origin Port
* Destination Port
* Threat Severity

SeaSafe automatically generates:

* Route options
* Weather analysis
* Threat assessment
* AI recommendation
* Decision summary

---

## 🤖 Local-First AI Copilot

The AI orchestrator performs multiple maritime intelligence tasks including:

* Chokepoint monitoring
* Weather hazard detection
* Route comparison
* ETA calculation
* Fuel estimation
* Port congestion analysis

Each tool call is streamed live with execution status and results.

---

## 📊 Smart Decision Dashboard

SeaSafe recommends the optimal route by comparing:

* ETA
* Fuel Consumption
* Cost
* Carbon Emissions
* Overall Risk

Interactive radar charts make comparing routes quick and intuitive.

---

## 🔒 Compliance Mode

Press **C** to enable Compliance Mode.

SeaSafe automatically masks vessel telemetry according to applicable regulations including:

* 🇮🇳 India DPDP Act
* 🇪🇺 GDPR
* 🇦🇪 UAE FDPL
* 🌐 IMO Guidelines

A dedicated Compliance HUD displays:

* Active jurisdiction
* Data retention policy
* Look-ahead distance
* Route progress
* Waypoints disposed

---

## 📜 Captain Audit Log

Every captain action is permanently recorded.

The audit log stores:

* Accepted route
* Dismissed recommendation
* AI reasoning
* Tool execution history
* Timestamp

Captain overrides are clearly highlighted.

---

## 🗺 Interactive Maritime Map

Powered by **MapLibre GL** and **deck.gl**.

Visualizes:

* Shipping routes
* Vessel position
* Weather hazards
* Risk zones
* Compliance overlays
* Animated route transitions

---

## ⌨ Keyboard Shortcuts

| Key     | Action                  |
| ------- | ----------------------- |
| **1–5** | Switch Scenario         |
| **R**   | Replay Current Scenario |
| **A**   | Accept Recommendation   |
| **C**   | Toggle Compliance Mode  |
| **Esc** | Close Decision Card     |

---

# 🛠 Tech Stack

| Category         | Technology            |
| ---------------- | --------------------- |
| Framework        | Next.js 16            |
| Language         | TypeScript            |
| UI               | React 19              |
| Styling          | Tailwind CSS v4       |
| State Management | Zustand               |
| Maps             | MapLibre GL + deck.gl |
| UI Components    | shadcn/ui             |
| Icons            | Lucide React          |
| Notifications    | Sonner                |
| AI Runtime       | Ollama (Optional)     |
| Mapping Tiles    | OpenFreeMap           |

---

# 📂 Project Structure

```text
app/
components/
lib/
public/
```

Major modules include:

* AI Orchestrator
* Maritime Route Planner
* Weather Engine
* Compliance Engine
* Interactive Map
* Decision Dashboard
* Audit Log
* Scenario Builder

---

# 🚀 Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

### Optional Local AI

```bash
ollama serve
ollama pull llama3.2
```

SeaSafe automatically falls back to a deterministic AI response if Ollama is unavailable.

---

# 🎬 Demo Flow

1. Launch SeaSafe.
2. A maritime advisory is triggered automatically.
3. Click **Assess**.
4. Watch the AI execute maritime intelligence tools.
5. Compare suggested routes.
6. Accept or override the recommendation.
7. Enable Compliance Mode.
8. Explore additional scenarios or create your own.

---

# 👥 Team

**Team TryHard**

Official submission for **Build With Bharat 2026**.

---

# 📄 License

This project was developed for **Build With Bharat 2026** and is intended for educational and hackathon demonstration purposes.
