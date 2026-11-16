# Japy ADHD Mode: evidence-informed plan

Research checked 16 November 2026.

## Goal and limits

ADHD affects people differently, so ADHD Mode is an optional set of adjustable study supports. It is not an ADHD assessment or treatment, and no interface can guarantee attention or study completion. The design should reduce friction and let each learner decide what helps.

NICE recommends tailoring environmental modifications to the individual and gives shorter focus periods with movement breaks and reduced distractions as examples. W3C cognitive-accessibility guidance recommends limiting interruptions and unnecessary content, using short critical paths, and making it easy to regain context after attention shifts. A 2025 review of systematic reviews found that evidence for digital ADHD interventions remains uneven, so Japy should validate usability claims with learners instead of presenting the feature as clinically proven.

## Shipped first version

- Profile toggle, off by default, with a plain-language explanation and an easy way to turn it off.
- Local persistence plus a per-user Supabase `focus_mode_enabled` preference. The setting represents a display preference, not a diagnosis.
- A quieter Today screen with one recommended next action and no streak, forecast, mascot, or metrics cluster competing with it.
- Five-card practice blocks with visible progress, practice controls tucked under an Options button, and calm pause/continue choices after the block.
- Coaching and opt-in reminder copy that gives one small next action, avoids urgency and streak pressure, and never enables notifications automatically.

## Next implementation phases

### 1. Personalize the support

Offer a small number of user-controlled round sizes (for example 3, 5, or 8 cards), an optional break length, and a choice of reading or writing as the default. Keep five cards as a starting default only, not a claim that this length suits everyone. Preserve an obvious route to change options or return to the full interface.

### 2. Make resuming reliable

Save the active lesson and last completed card locally, then sync them for signed-in accounts. On return, show one explicit choice to resume or start fresh. Keep a break user-controlled; avoid forcing timers, lockouts, or blocking overlays.

### 3. Protect control and privacy

Keep reminders opt-in, editable, and easy to pause. Add quiet hours and a per-day cap before adding any new notification type. Store only the preferences needed to render the chosen experience; do not collect diagnosis, symptom scores, or inferred attention data. Keep ordinary learning progress available with ADHD Mode off.

### 4. Validate with learners

Co-design with adults with varied ADHD experiences before calling the experience ADHD-friendly. Include people who prefer visual structure, people who find timers stressful, and learners with co-occurring reading, sensory, or motor needs. Use consented usability sessions and offer a non-clinical option to describe what was helpful or distracting.

## Release checks

- A learner can enable, disable, and change the mode without losing learning progress; the choice survives app restart and signed-in device sync.
- Every screen-reader control has a clear name and state; large text, reduced motion, contrast, and touch targets remain usable.
- A user can pause, stop, or leave a round at any time, and receives no shame-based failure or streak-loss copy in ADHD Mode.
- Measure task-start time, round completion, return-to-study after pausing, and learner-rated effort/distraction in an opt-in study. Compare modes within the same learners where practical; report sample size and uncertainty.
- Treat worse distraction, higher stress, or lower usability for any subgroup as a reason to revise the design. Do not use completion rate alone as proof of ADHD benefit.

## Sources

- [NICE guideline NG87: ADHD diagnosis and management](https://www.nice.org.uk/guidance/ng87/chapter/recommendations) — individualised environmental modifications, including reducing distractions and shorter focus periods with breaks.
- [W3C WAI: Help Users Focus](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/) — limit interruptions and unnecessary content, use short critical paths, and help people reorient.
- [Evaluating the evidence: a systematic review of reviews of digital interventions for ADHD](https://pmc.ncbi.nlm.nih.gov/articles/PMC12016436/) — evidence varies by intervention and many included reviews had low or critically low methodological quality.
- [CDC: ADHD in adults](https://www.cdc.gov/adhd/about/adhd-in-adults.html) — common functional difficulties and the need for support to depend on the person and environment.
