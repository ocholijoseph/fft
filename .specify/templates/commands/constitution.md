# Constitution Command

## Description
Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.

## Usage
```
/constitution [arguments]
```

## Arguments
- User input can be provided directly by the agent or as command arguments
- Must consider user input before proceeding with the prompt (if not empty)

## Execution Flow

1. **Load Template**
   - Load existing constitution template at `.specify/memory/constitution.md`
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`
   - Respect user-specified number of principles if provided

2. **Collect Values**
   - Use user input values when provided
   - Infer from existing repo context (README, docs, prior constitution versions)
   - For governance dates:
     - `RATIFICATION_DATE`: Original adoption date (ask if unknown or mark TODO)
     - `LAST_AMENDED_DATE`: Today if changes are made, otherwise keep previous
   - `CONSTITUTION_VERSION`: Increment according to semantic versioning:
     * MAJOR: Backward incompatible governance/principle removals or redefinitions
     * MINOR: New principle/section added or materially expanded guidance
     * PATCH: Clarifications, wording, typo fixes, non-semantic refinements

3. **Draft Updated Constitution**
   - Replace every placeholder with concrete text
   - Preserve heading hierarchy
   - Ensure each Principle section includes: succinct name line, paragraph/bullet list capturing non-negotiable rules, explicit rationale
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations

4. **Consistency Propagation**
   - Read and validate `.specify/templates/plan-template.md` for constitutional alignment
   - Read and validate `.specify/templates/spec-template.md` for scope/requirements alignment
   - Read and validate `.specify/templates/tasks-template.md` for task categorization alignment
   - Read and validate each command file in `.specify/templates/commands/*.md`
   - Read and validate runtime guidance docs (README.md, docs/quickstart.md, etc.)

5. **Produce Sync Impact Report**
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred

6. **Validation**
   - No remaining unexplained bracket tokens
   - Version line matches report
   - Dates in ISO format YYYY-MM-DD
   - Principles are declarative, testable, and free of vague language

7. **Write Constitution**
   - Write completed constitution back to `.specify/memory/constitution.md` (overwrite)

8. **Output Summary**
   - New version and bump rationale
   - Files flagged for manual follow-up
   - Suggested commit message

## Formatting Requirements
- Use Markdown headings exactly as in template
- Wrap long rationale lines for readability (<100 chars ideally)
- Single blank line between sections
- Avoid trailing whitespace

## Error Handling
- If critical info missing (e.g., ratification date unknown), insert `TODO(<FIELD_NAME>): explanation`
- Include deferred items in Sync Impact Report
- Do not create new template; always operate on existing `.specify/memory/constitution.md`

## Constitutional Alignment
This command itself must follow constitutional principles:
- Security-First Design: Ensures constitutional governance maintains security standards
- Role-Based Access Control: Validates that role-based requirements are preserved
- Modern User Experience: Maintains documentation standards for user-facing features
- AI-Powered Financial Insights: Ensures AI requirements are properly documented
- Comprehensive Data Management: Validates data management standards in governance

## Technical Standards Compliance
- Google OAuth2 Authentication: Ensures authentication standards are maintained in constitution
- PostgreSQL Database Architecture: Validates database requirements in constitutional principles
- React + TailwindCSS Frontend: Ensures frontend standards are properly documented
