# Phylax — User Stories

## Submitter

1. As a submitter, I want to fill out a simple form with title, description, and optional category so that I can report an incident in under 60 seconds.
2. As a submitter, I want the AI to suggest severity and category based on my description so that I don't have to guess the right priority level.
3. As a submitter, I want to receive a ticket number (PHX-000001) immediately after submission so that I can reference it later.
4. As a submitter, I want to see the current status of my incident so that I know it's being worked on.
5. As a submitter, I want to add comments to my open incident so that I can provide additional context after submission.

## Admin — Triage

6. As an admin, I want to see a triage queue of all unassigned incidents so that I know what needs attention.
7. As an admin, I want to toggle between FIFO and Priority queue ordering so that I can choose the strategy that fits my team.
8. As an admin, I want to see the AI-suggested severity and category alongside each incident so that I can validate or override before assigning.
9. As an admin, I want to assign an incident to myself or another team member so that ownership is clear.
10. As an admin, I want to change the severity or category of an incident so that misclassified incidents get corrected.

## Admin — Workflow

11. As an admin, I want to move an incident through enforced statuses (Open → In Progress → Resolved → Closed) so that the workflow is consistent.
12. As an admin, I want to reopen a Resolved incident back to In Progress so that failed fixes get reworked.
13. As an admin, I want to add internal notes to an incident so that my team can see context without the submitter seeing it.
14. As an admin, I want to write resolution notes when resolving an incident so that the fix is documented.
15. As an admin, I want every status change, severity change, and assignment change logged automatically so that I have a complete audit trail.

## Admin — Dashboard & Insights

16. As an admin, I want a dashboard showing total open incidents, average time-to-resolve, incidents by severity, and incidents by status so that I have operational visibility at a glance.
17. As an admin, I want to see which incidents are approaching stale (no update in X days) so that nothing falls through the cracks.
18. As an admin, I want to generate an AI postmortem summary for a resolved incident so that I can share a writeup without writing one from scratch.
19. As an admin, I want the dashboard to show events flowing in from the Analytics Service so that I see Phylax activity alongside my other apps.

## Admin — Settings

20. As an admin, I want to configure queue strategy (FIFO vs Priority) from a settings page so that I don't need to redeploy to change it.
21. As an admin, I want to manage team members (add/remove) so that assignment options stay current.
```

