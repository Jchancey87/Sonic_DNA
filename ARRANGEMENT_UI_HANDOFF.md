# Song Arrangement Auditing App UI Handoff

## Overview
This document captures a UI and UX handoff for the current song arrangement auditing app interface based on the provided screen. The current product has a strong functional foundation, especially around section-based arrangement analysis, but the interface still feels form-heavy where it should feel timeline-first and workstation-like.

The main opportunity is to evolve the app from a stacked admin-style layout into a focused music-analysis workspace. For this product, the best reference model is less a generic dashboard and more a lightweight DAW-adjacent editor optimized for fast structural annotation.

## Current strengths
The current screen already communicates the app's purpose clearly. The arrangement lens heading, timeline blocks, and editable section panel all make the workflow understandable on first glance.

Several elements are already working well:
- The dark visual theme fits the analytical and studio-oriented tone.
- The section timeline makes the song structure immediately visible.
- The active section state is recognizable.
- The editor supports practical fields such as start time, duration, and production cues.
- The analytical prompt at the bottom reinforces the intended thinking process for the user.

## Primary UX issues
1. **Layout Hierarchy**: The screen reads as a vertical stack of panels rather than a dedicated arrangement workstation, which makes the most important interaction surface, the timeline, feel smaller than it should.
2. **Form-Heavy Inputs**: Too much of the interface relies on generic form controls. The app is about musical structure and temporal editing, so the controls should feel faster, more visual, and more spatial.
3. **Semantic styling inconsistencies**: Accent colors, borders, and button treatments do not yet communicate a clear hierarchy between primary actions, neutral controls, and destructive actions.

## Recommended layout changes
The most valuable structural improvement is to move to a **two-panel workspace**:
- **Left panel**: arrangement lens guidance, project context, and analysis prompts.
- **Right panel**: timeline, transport actions, and active section editor.
- Keep the timeline pinned near the top of the main workspace so it remains the dominant surface.
- Treat the section editor as a contextual inspector panel rather than a large form block sitting under the timeline.

This would make the app feel closer to a production tool. It also reduces vertical scrolling and makes section editing feel directly tied to the timeline selection.

## Timeline improvements
The timeline should become the visual center of the app.
- **Increase section block height** so each segment can hold a title, timing, and one line of summary without crowding.
- **Time markers**: Move time markers into a dedicated ruler row above the section blocks.
- **Drag/Resize Affordances**: Add stronger resize and drag affordances on section edges so editability is obvious.
- **Audio awareness**: Introduce a subtle waveform, density pattern, or energy-strip background to make the timeline feel audio-aware.
- **Active-state clarity**: Improve active-state clarity with a thicker accent edge, glow, or filled selection treatment instead of relying mostly on a thin border.
- **Hover/Selected states**: Add hover and selected states that clearly distinguish browsing from editing.
- **Playhead**: If playback is available, the timeline should also show playhead movement or section progress. That single change would make the app feel much more alive and tightly connected to the audio.

## Section editor improvements
The section editor should feel like an inspector, not a generic CRUD form.
- **Remove heavy colored left border** and use surface elevation, spacing, and title treatment to show focus.
- **Visual color picker**: Convert the section color/type dropdown into a faster visual picker with swatches or pills.
- **Sync Action**: Make the Sync action more visually important because it is workflow-critical.
- **Auto-expand Textarea**: Let the observations field auto-expand so longer production notes remain comfortable to write.
- **Grouping**: Group timing-related controls together and separate them visually from descriptive metadata.
- **Button Priority**: Reduce button competition by giving Play Section clear priority and de-emphasizing Close Editor.
- **Progressive disclosure**: A useful interaction model would be a compact default editor with progressive disclosure. Show only the most common fields first, then reveal advanced notes or metadata as needed.

## Typography and visual hierarchy
The interface has a promising studio-analysis aesthetic, but the typography hierarchy is doing too much with one style.
- **Mono/Technical Font**: Keep the monospace or technical display style for lens headers, timeline labels, and signal-analysis framing.
- **Sans-Serif Font**: Use a highly legible sans-serif for form labels, helper text, and input content.
- **Contrast**: Increase contrast for muted labels and placeholder text so the screen is easier to scan.
- **Heading standard**: Standardize heading sizes and spacing so each panel has a clearer parent-child hierarchy.
- **Case rules**: Reduce visual noise from all-caps labels where readability matters more than atmosphere.
- A split typography system would preserve the identity of the tool while making the day-to-day editing experience easier.

## Color system cleanup
The current color usage feels expressive but not fully systematic.
- Use one primary accent color for selection, active states, and main actions.
- Reserve red exclusively for destructive actions like delete.
- Use neutral surfaces and borders for panel separation instead of multiple accent colors.
- Tie section type colors to a limited semantic palette and use them consistently in the timeline and editor.
- Avoid decorative accent borders unless they convey real meaning.

## Component-specific updates
- **Add Section button**: Promote to a filled primary button with stronger placement.
- **Section blocks**: Increase height and add richer selected, hover, and playback states.
- **Type selector**: Replace with swatches, pills, or a custom segmented picker.
- **Sync button**: Make it icon-led and visually prominent.
- **Play Section button**: Increase size and treat as the primary editor action.
- **Close Editor button**: Reduce emphasis to secondary or text-style action.
- **Prompt box**: Break into numbered steps or collapsible guidance.
- **Observation textarea**: Auto-grow and improve padding/line height.

## Interaction design
- **Animations**: Animate section selection with a subtle scale or glow transition.
- **Transitions**: Slide or fade the editor panel in when a section becomes active.
- **Playhead**: Show timeline playback progress directly inside the selected block.
- **Hover states**: Add clear hover feedback to draggable areas and timeline segments.
- **Keyboard Shortcuts**: Support keyboard shortcuts for play, add section, and jumping between sections.

## React and Vite implementation notes
Suggested structure:
- `ArrangementWorkspace`
- `ArrangementSidebar`
- `TimelineRuler`
- `TimelineTrack`
- `TimelineSectionBlock`
- `SectionInspector`
- `TransportControls`
- `AnalysisPromptPanel`

State suggestions:
- Store selected section, playback state, and editor visibility in a React context or clean states.
- Keep timeline scrolling isolated from page scrolling.
- Model section edits optimistically so dragging and timing adjustments feel immediate.
- If animation is added, use CSS transitions/animations or Framer Motion only where it improves clarity, not as decoration.
