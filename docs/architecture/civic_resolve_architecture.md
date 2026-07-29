# CivicResolve AI — System Architecture

This folder contains the complete architecture design documents, PNG photo renders, SVG vector graphics, Excalidraw diagrams, and workflow representations for **CivicResolve AI (AI-Powered Civic Complaint Resolution System)**.

---

## 📸 Architecture Diagram (PNG Photo Format)

![CivicResolve AI Architecture PNG](./civic_resolve_architecture.png)

---

## 🎨 Scalable Vector Graphic (SVG Format)

![CivicResolve AI Architecture SVG](./civic_resolve_architecture.svg)

---

## 🔀 Interactive Flowchart (Mermaid)

```mermaid
graph TD
    CP["Citizen Portal<br/>(Web • Mobile • Photo • Voice • Text • Location)"]
    GW["API Gateway / Backend<br/>(Authentication • Validation • File Upload)"]
    ORCH["Orchestrator<br/>(LangGraph Engine & State Machine)"]
    STATE[("Shared Incident Object<br/>Single Source of Truth")]

    subgraph AGENTS ["Multi-Agent Execution Layer"]
        INT["Intake Agent<br/>(Category & Geocoding)"]
        ROUT["Routing Agent<br/>(Ward Match & SLA)"]
        DRAFT["Drafting Agent<br/>(Structured Legal Letter)"]
        TRACK["Submission & Tracking<br/>(Lifecycle Tracking)"]
        ESC["Escalation Agent<br/>(SLA Monitor & Alert)"]
    end

    EXT["External Government Layer<br/>(Municipality APIs • Portals • Email/SMS)"]
    DASH["Citizen Dashboard<br/>(Status • Timeline • Notifications)"]

    subgraph INFRA ["Supporting Infrastructure Services"]
        DB[("MongoDB Database")]
        LLM["LLM API (Gemini 3.6 Flash & Zod)"]
        CRON["Scheduler (Cron SLA Monitor)"]
        NOTIF["Notification Service (Email/SMS)"]
    end

    CP --> GW
    GW --> ORCH
    ORCH --> STATE
    STATE --> INT
    STATE --> ROUT
    STATE --> DRAFT
    STATE --> TRACK
    STATE --> ESC

    INT --> EXT
    ROUT --> EXT
    DRAFT --> EXT
    TRACK --> EXT
    ESC --> EXT

    EXT --> DASH

    DB -.- ORCH
    LLM -.- AGENTS
    CRON -.- ESC
    NOTIF -.- EXT
```

---

## 📂 Architecture Files

| File Name | Format | Description |
| :--- | :--- | :--- |
| **[`civic_resolve_architecture.png`](./civic_resolve_architecture.png)** | **PNG Photo Image** | High-resolution raster photo render (445 KB). |
| **[`civic_resolve_architecture.svg`](./civic_resolve_architecture.svg)** | **SVG Vector** | Scalable vector graphic diagram. |
| **[`civic_resolve_architecture.excalidraw`](./civic_resolve_architecture.excalidraw)** | **Excalidraw JSON** | Editable diagram file for [Excalidraw.com](https://excalidraw.com). |
| **[`civic_resolve_architecture.md`](./civic_resolve_architecture.md)** | **Markdown Doc** | Comprehensive design document. |
