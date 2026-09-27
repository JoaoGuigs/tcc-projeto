---
name: "FisioCare — Mapa de Movimento"
description: "Um espaço clínico calmo que torna o percurso do cuidado e a próxima ação visíveis."
colors:
  care-green: "#276B61"
  care-green-soft: "#DCEBE6"
  care-green-selected: "#EEF6F2"
  care-green-on-dark: "#D4E8E3"
  canvas-cream: "#F6F2EA"
  sidebar-cream: "#EDE7DB"
  paper: "#FFFFFF"
  plane-soft: "#FAF8F4"
  field-paper: "#FBFAF7"
  ink: "#20312B"
  ink-muted: "#52635B"
  border: "#D8D2C7"
  attention: "#7B4E0B"
  attention-soft: "#F5E9CC"
  milestone: "#5A476D"
  milestone-soft: "#E9E2F0"
  danger: "#75413D"
  danger-soft: "#F1DDDA"
typography:
  display:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
  headline:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
  title:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  body:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  field-value:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  action:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  label:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
rounded:
  field: "10px"
  control: "11px"
  compact-surface: "13px"
  status: "14px"
  surface: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.care-green}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    height: "44px"
  field:
    backgroundColor: "{colors.field-paper}"
    textColor: "{colors.ink}"
    typography: "{typography.field-value}"
    rounded: "{rounded.field}"
    height: "48px"
  status-confirmed:
    backgroundColor: "{colors.care-green-soft}"
    textColor: "{colors.care-green}"
    typography: "{typography.label}"
    rounded: "{rounded.status}"
    height: "28px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
---

# Design System: FisioCare — Mapa de Movimento

## Overview

**Creative North Star: "Mapa de Movimento"**

O sistema visual trata o dia da clínica como um percurso conectado de cuidado. O próximo atendimento, a decisão pendente e sua consequência aparecem em planos claros, tabelas e sequências cronológicas, sem transformar a rotina da fisioterapeuta em um painel empresarial genérico.

A atmosfera combina um espaço creme quente com planos brancos, tipografia direta e uma rota verde usada como estrutura de informação. A expressão permanece calma e compacta: curvas e nós só aparecem quando comunicam tempo, progresso, seleção ou relação clínica.

**Key Characteristics:**
- Warm cream workspace with calm white content planes.
- One green care path connecting current state, progress, and next action.
- Compact rectangular controls and textual status labels.
- Flat tonal layering without gradients or decorative shadows.
- Responsive continuity from an icon-and-label desktop sidebar to an icon-and-label mobile bottom navigation.

## Colors

A paleta preserva o verde e o creme reconhecíveis da FisioCare, apoiados por tintas semânticas discretas e texto de alto contraste.

### Primary
- **Verde do Cuidado** (`#276B61`): ação primária, navegação atual, progresso, seleção e estados confirmados.
- **Névoa de Cuidado** (`#DCEBE6`): confirmação, informação segura e apoio tonal ao verde principal.
- **Seleção Clínica** (`#EEF6F2`): plano selecionado ou horário disponível que precisa permanecer legível como superfície.
- **Verde Claro sobre Fundo Escuro** (`#D4E8E3`): texto secundário sobre planos preenchidos pelo verde principal.

### Secondary
- **Âmbar de Atenção** (`#7B4E0B`): pendências, confirmações e itens que exigem ação humana.
- **Âmbar Suave** (`#F5E9CC`): plano tonal para avisos e conexão pendente.

### Tertiary
- **Violeta de Marco** (`#5A476D`): chegada ou marco clínico notável dentro de uma cronologia.
- **Violeta Suave** (`#E9E2F0`): apoio tonal para o violeta de marco.
- **Rosa de Falha** (`#75413D`): erro, exclusão e consequência destrutiva.
- **Rosa Suave** (`#F1DDDA`): plano de falha ou confirmação destrutiva.

### Neutral
- **Creme de Trabalho** (`#F6F2EA`): fundo principal da aplicação.
- **Creme da Navegação** (`#EDE7DB`): menu lateral e separação estrutural.
- **Papel Clínico** (`#FFFFFF`): planos de conteúdo e controles secundários.
- **Papel Suave** (`#FAF8F4`): linhas e blocos alternados sem elevação.
- **Papel de Campo** (`#FBFAF7`): fundo de entradas de dados.
- **Tinta Clínica** (`#20312B`): texto principal e informação que precisa dominar a leitura.
- **Tinta de Apoio** (`#52635B`): texto secundário, metadados e navegação inativa.
- **Borda Mineral** (`#D8D2C7`): divisores, contornos e trilhas inativas.

### Named Rules

**The Green Is Direction Rule.** Reserve green for primary actions, current navigation, progress, selection, and confirmed states.

**The Status Has a Voice Rule.** Every status includes text or a meaningful symbol in addition to color.

## Typography

**Display Font:** Source Sans 3 (with Arial and sans-serif fallbacks)  
**Body Font:** Source Sans 3 (with Arial and sans-serif fallbacks)  
**Label Font:** Source Sans 3 (with Arial and sans-serif fallbacks)

**Character:** A single humanist sans-serif keeps clinical information familiar, direct, and compact. Hierarchy comes from size and the observed 400, 600, and 700 weights rather than from a contrasting display face.

### Hierarchy
- **Display** (700, 34px): desktop page titles and the strongest orientation cue.
- **Headline** (700, 24px): major section headings and primary workflow labels.
- **Title** (700, 17px): card titles, patient names, times, and immediate actions.
- **Body** (400, 14px): explanatory copy and supporting clinical context.
- **Field Value** (600, 14px): entered data and compact values inside controls.
- **Action** (700, 14px): button labels and direct textual actions.
- **Label** (700, 13px): statuses, compact actions, navigation metadata, and field labels.

### Named Rules

**The One Family Rule.** Use Source Sans 3 throughout the product and create hierarchy with the established size and weight range.

## Layout

Desktop surfaces use a fixed 252px left sidebar and a generous cream workspace populated by a few purposeful white planes. The sidebar combines familiar 20px line icons with visible labels, separates Rotina from Gestão, and keeps the professional profile at the bottom. On the approved 1920px compositions, the main content begins around 300px; the login is the exception, using a 790px brand plane beside the form. Internal rhythm repeatedly uses 8px, 12px, 16px, 20px, and 24px steps.

On the approved 390px mobile composition, content becomes a single column with 16–18px outer margins. The sidebar becomes a 62px bottom navigation with the same icons and short labels, while the current appointment, daily path, and next action retain their order and semantic emphasis.

Chronological curves sit beside the content they organize. They do not cross unrelated panels or become a page-wide decoration.

## Elevation & Depth

The system is flat and tonal. It uses no shadows, gradients, or filters in the approved artifacts. Depth comes from cream-to-white surface changes, subtle borders, and semantic tints; ordinary planes use either a fill change or a border, while selected and error states may pair a tint with a semantic outline.

### Named Rules

**The Tonal Plane Rule.** Establish hierarchy with background tone and borders; do not add ornamental elevation.

## Shapes

The form language is softly rectangular. Fields use 10px corners, compact buttons use 11px, smaller panels use 13px, status capsules use a 14px radius at 28px height, and primary surfaces use 16px. Route nodes use an 8px outer circle with a 3px center; active and semantic nodes use a 3px stroke. Lines are thin and round-capped, with curves reserved for real sequence or relationship.

## Components

### Buttons
- **Shape:** compact rounded rectangle, 44px high with an 11px radius.
- **Primary:** care-green fill, paper text, and a bold 14px label.
- **Hover / Focus:** preserve size and corner geometry while strengthening the outline or ink; the documented keyboard focus is a 3px care-green outline.
- **Secondary:** paper fill, ink text, and a 1px mineral border.
- **Danger:** rose-soft fill with rose text; pair it with explicit consequence copy.

### Chips
- **Style:** 28px-high status capsule with a 14px radius; use a semantic tint behind a bold 13px label.
- **State:** green is confirmed or actionable, amber is pending attention, violet is a notable milestone, and rose is failed or destructive.

### Cards / Containers
- **Corner Style:** 16px for primary planes and 13px for compact cards.
- **Background:** paper for primary content, with soft neutral or semantic fills for rows and states.
- **Shadow Strategy:** none; use the tonal-plane rule.
- **Border:** 1px mineral border when separation is needed, replaced or reinforced by a semantic outline for selection and errors.
- **Internal Padding:** usually 20–24px in the approved surfaces.

### Inputs / Fields
- **Style:** paper-field background, 1px mineral stroke, 10px radius, and 48px height.
- **Focus:** a 3px care-green outline with the field geometry unchanged.
- **Error / Disabled:** use rose for errors and neutral-muted treatment for unavailable actions, always with explanatory text.

### Navigation

Desktop navigation is a warm-cream sidebar with icon-and-label items that are 48px tall. The current destination combines a white plane, short green marker, green icon, and bold green label. Items are grouped under Rotina and Gestão; Configurações and the professional profile remain anchored near the bottom. Mobile navigation becomes a white bottom bar with the same familiar icons and short labels. Never use an icon without a visible label for primary navigation.

### Care Path

The signature path combines a thin mineral route, alternating nodes, and adjacent content blocks. Node color encodes the semantic state, while the accompanying text states the same meaning. Use the path only for chronology, selection, progress, or a real relationship between records.

## Do's and Don'ts

### Do:
- **Do** keep the next useful action visible beside its clinical context.
- **Do** reserve the care path for chronology, selection, progress, or relationship.
- **Do** pair every semantic color with text or a meaningful symbol.
- **Do** preserve the warm cream workspace, white planes, and restrained green emphasis.
- **Do** collapse the desktop sidebar into icon-and-label bottom navigation on narrow mobile surfaces.

### Don't:
- **Don't** turn the interface into a matrix of equal, disconnected dashboard cards.
- **Don't** use route lines or nodes as decoration without encoded meaning.
- **Don't** add shadows or gradients to create hierarchy that tone and borders already provide.
- **Don't** communicate appointment, message, or clinical status through color alone.
- **Don't** use ambiguous icon-only navigation or mix unrelated functions without group labels.
