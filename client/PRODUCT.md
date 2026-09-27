# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is Ana, a physiotherapist who uses the system daily to run her own clinic. The experience must remain understandable and efficient for a healthcare professional without technical training.

Patients are a secondary audience. They interact mainly through WhatsApp to receive confirmations, reminders, useful guidance, rescheduling options, and responses from the clinic.

The product may later support other physiotherapists and small clinics, but the current experience is optimized for a small practice with a simple operating routine.

## Product Purpose

FisioCare brings scheduling, patients, clinical records, treatment evolution, reports, finances, settings, and WhatsApp conversations into one coherent workflow. It exists to reduce administrative work so the physiotherapist can spend more time caring for patients.

Success means the professional can understand what needs attention, complete common tasks without training, and keep patient and clinical information organized without switching between disconnected tools.

## Positioning

FisioCare is a focused physiotherapy workspace rather than a generic clinic ERP. Its key mechanism is connecting the clinical routine to communication: appointments, follow-ups, available slots, and patient context can drive clear actions and official WhatsApp messages from the same product.

## Operating Context

The main routine includes reviewing the day, scheduling or rescheduling appointments, checking available slots and the waiting list, opening patient profiles, recording clinical evolution, reviewing reports and finances, and communicating through WhatsApp.

The system is primarily used on desktop during the clinic's working day, with responsive mobile access for quick checks and actions.

## Capabilities and Constraints

- React web client backed by the existing Node.js API and MySQL data model.
- Official Meta WhatsApp Cloud API is the default provider. Evolution API remains available in code as a disabled alternative.
- Preserve existing working routes, product terminology, clinical workflows, and real application capabilities.
- Patient and clinical information require privacy-conscious handling consistent with LGPD expectations.
- The interface must remain simple enough to use without technical training.
- Do not invent medical claims, patient outcomes, testimonials, or unsupported clinic metrics.

## Brand Commitments

- Product name: FisioCare.
- Voice: calm, direct, supportive, and professional; avoid technical jargon in user-facing copy.
- The established green and warm cream palette is a binding reference. New visual proposals may reinterpret composition, density, hierarchy, and components while preserving this recognizable color identity.

## Evidence on Hand

- Existing production-oriented interface in `client/src` with routes for login, dashboard, agenda, patients, patient registration, clinical evolution, WhatsApp, reports, finances, insurance providers, and settings.
- Existing tests and fake development data demonstrate scheduling and dashboard states.
- Existing Figma exploration: https://www.figma.com/design/QVujpFRrxKQrwrwak39U6U/FisioCare
- Earlier Paper exploration: https://app.paper.design/file/01M2JSNNX29TQ1MT31DHQ7YW5T
- Project documentation in `README.md` describes the current architecture and official WhatsApp integration.
- No real testimonials, public performance benchmarks, or validated patient outcome claims are available and future work must not fabricate them.

## Product Principles

1. Make the next useful action obvious.
2. Keep clinical context close to scheduling and communication decisions.
3. Reduce repeated administrative work through safe, understandable automation.
4. Prefer calm clarity over dense management-software conventions.
5. Preserve trust by making status, consequences, and message delivery explicit.

## Accessibility & Inclusion

Use clear language, readable typography, keyboard-accessible controls, visible focus states, sufficient contrast, and responsive layouts. Do not rely on color alone to communicate appointment, message, or clinical status.
