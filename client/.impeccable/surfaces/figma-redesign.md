# Figma redesign — Mapa de Movimento

## THESIS

The clinic day is a connected care journey. The interface makes current care, the next decision, and the consequence of that decision visible without turning the product into a generic dashboard.

## OWN-WORLD

Physiotherapy treatment plans, movement assessment paths, clinical chronology, and the quiet material character of a small care practice. The system belongs to a working clinic rather than to hospital software or a generic business dashboard.

## STORY

Ana begins with today's care path, resolves confirmations and open slots, moves into the patient's history when treatment starts, records evolution, and communicates the next step through WhatsApp. Reports and finances summarize the same path rather than becoming separate products.

## FIRST VIEWPORT

The dashboard exposes what is happening now, the remaining appointments, one open slot, and the human actions that deserve attention. A user should understand the day's state within seconds.

## FORM

Warm cream workspace; calm white planes; one green care path; compact rectangular controls; textual status labels; Source Sans 3; chronological curves only when time, progress, selection, or relationship is real. Hover and focus preserve geometry while strengthening outline and ink. Motion is limited to a node advancing along a real path after a state change.

## Concept roll

Seed key: `4230e613`. The assigned third grounded direction was accepted by the user.

## Mode

Operate

## Scope

Create a complete alternative visual system in Figma for every meaningful frontend workflow already present in the codebase. Preserve the existing Figma work and add this as a separate family for comparison.

## Direction

The interface treats the clinic day as a care journey. A thin route line, meaningful nodes, and connected transitions organize appointments, patient history, communication, and follow-up. The system avoids a generic dashboard made from equal cards. Dense information lives in calm planes, clear tables, and chronological paths.

## Visual system

- Warm cream canvas and the established FisioCare green remain recognizable.
- Source Sans 3 carries the complete interface.
- White content planes use 12–16px radii and either a border or subtle depth, never both.
- Green is reserved for primary actions, current navigation, progress, and confirmed states.
- Amber marks attention and pending confirmation; muted rose marks destructive or failed states; violet marks arrivals or notable clinical milestones.
- Desktop navigation uses a 252px warm-cream sidebar with familiar line icons and visible labels, grouped into Rotina and Gestão. The active destination uses a white plane, a green icon, a green label, and a short green marker on the left.
- Buttons are compact rounded rectangles. Pills are limited to statuses and segmented controls.
- Every status includes text or a symbol in addition to color.

## Functional organization

1. Login and first professional registration.
2. Daily command center.
3. Agenda in day, week, and month views, including waiting list and available slots.
4. Patient directory, registration, and patient profile.
5. Clinical evolution recording and recent history.
6. WhatsApp inbox with patient context and official Meta connection state.
7. Reports, finances, and insurance providers.
8. Clinic, message, WhatsApp, and security settings.
9. Mobile daily command center.

## First viewport promise

The dashboard immediately shows the care path for today: what has happened, what is next, where a slot is open, and which human action deserves attention. The route is the information architecture, not decoration.

## Interaction promise

Selecting a node in the daily path reveals the relevant patient context and next action. Across other screens, the same node vocabulary marks steps, chronology, selection, and completion.

## Honest risk

The route metaphor can become decorative if overused. Each line and node must encode chronology, selection, progress, or relationship; otherwise it is removed.
