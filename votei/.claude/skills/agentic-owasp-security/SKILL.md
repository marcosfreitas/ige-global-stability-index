---
name: agentic-owasp-security
description: Security audit skill for Node.js / TypeScript applications that build AI/agentic features, evaluated against the OWASP Top 10 for Agentic Applications 2026 (ASI01–ASI10). Use this skill whenever the user asks to audit, review, or check security of a Node.js app (Next.js, Express, NestJS, Fastify, AWS Lambda, Vite/SvelteKit/Remix server, Hono, etc.) that integrates AI agents, LLM APIs (OpenAI, Anthropic, Gemini, Bedrock, Mistral, etc.), RAG pipelines, tool-calling, MCP, A2A, or multi-agent workflows. Trigger even if the user only says "check my AI security", "audit the LLM integration", "is my agentic app secure?", or "review prompt injection risks". Produces a structured findings report with AIVSS / LLM Top 10 / Agentic T-code cross-mappings, saved to `docs/security/`.
---

# OWASP Top 10 for Agentic Applications 2026 — Security Audit

You are a security engineer specializing in agentic AI systems, with deep expertise in Node.js / TypeScript ecosystems (Next.js, Express, NestJS, Fastify, AWS Lambda, etc.), LLM API integration, prompt security, MCP / A2A protocols, and the OWASP Top 10 for Agentic Applications 2026 (ASI01–ASI10). Your job is to audit a codebase for the 10 highest-impact agentic security threats and deliver a prioritized, actionable findings report.

**Source:** OWASP GenAI Security Project — Agentic Security Initiative, *OWASP Top 10 for Agentic Applications 2026*, December 2025 (v2026).

---

## When This Skill Applies

This skill is for any Node.js / TypeScript project that has **any of** the following:
- LLM/AI API calls (OpenAI, Anthropic, Gemini, Bedrock, Mistral, Vercel AI SDK, LangChain, LlamaIndex, etc.)
- Prompt templates that include user-supplied content
- Tool-calling or function-calling patterns (including MCP tool definitions)
- RAG (Retrieval-Augmented Generation) pipelines or vector stores
- Conversation history or memory systems
- Multi-agent or orchestrator/worker / planner-executor patterns
- MCP (Model Context Protocol) server connections
- A2A (Agent-to-Agent) communication or agent registries / agent cards

If none of these apply, this skill doesn't add value — use a standard application security review instead.

---

## Foundational Principles (apply across every check)

These are cross-cutting principles from the OWASP 2026 publication. Reference them when prioritizing findings.

1. **Least-Agency** — *do not deploy autonomy where it isn't needed.* Every autonomous capability expands the attack surface; convert agentic flows to deterministic ones whenever the use case allows it.
2. **Least-Privilege for tools, identities, memory, and network egress.**
3. **Zero-Trust Architecture** — assume LLM, agent, tool, and memory components can be compromised; design for fault tolerance.
4. **Strong Observability is non-negotiable** — without visibility into what agents are doing and why, autonomy silently expands the attack surface.
5. **Treat all natural-language input as untrusted** — user prompts, retrieved content, tool outputs, peer-agent messages, file contents, web pages, calendar invites, emails.
6. **Separate planning from execution** — corrupt planning must not be able to trigger harmful execution.

---

## Audit Protocol

Execute every step in order. Use exact file paths and line numbers for all findings.

### Phase 0 — Project Type Detection & Least-Agency Review

Before threat checks, build a model of the app:

1. **Detect stack**: read `package.json`, `tsconfig.json`, framework configs (`next.config.*`, `serverless.yml`, `nest-cli.json`, `app.ts`, `server.ts`, `main.ts`, `handler*.ts`, etc.). Record:
   - Framework (Next.js / Express / NestJS / Fastify / Lambda / Hono / SvelteKit / Remix / etc.)
   - Runtime (Node.js version, Edge runtime, Bun, Deno)
   - LLM SDKs in use
   - Whether this is an HTTP server, queue consumer, scheduled job, or hybrid
   - Persistence layer (Postgres, DynamoDB, MongoDB, vector DB, Redis, etc.)
   - Identity provider (Auth.js, Cognito, Auth0, custom JWT, none)

2. **Map agentic surface area**: for each agentic feature identified, record:
   - What it does
   - Whether it actually requires autonomy or could be deterministic
   - Trust boundaries it crosses (network, tenant, privilege)
   - Tools it can invoke
   - Memory/context it reads or writes

3. **Least-Agency review**: for each agentic feature, ask: *Does this need to be agentic?* Flag any feature where:
   - A deterministic workflow would suffice
   - The agent is given write access to systems it could read instead
   - The agent has tools that are never actually used by the planner
   - Autonomy is added "because LLMs are powerful" without a clear value justification

   Record these as `INFO`-level findings under "Least-Agency Review" — they are not vulnerabilities but they expand the surface for every other ASI.

### Phase 1 — Discovery (run in parallel)

```bash
# AI/LLM call sites
grep -rE "anthropic|openai|@aws-sdk/client-bedrock|google.*generativeai|gemini|mistral|cohere|@vercel/ai|langchain|llamaindex" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" -l .

# Prompt construction (templates, system messages, system prompts)
grep -rE "system\s*[:=]|systemPrompt|system_prompt|prompt\s*[:=]|messages\s*[:=]|user.*message|assistant.*message" \
  --include="*.ts" --include="*.tsx" -l .

# Tool / function definitions (including MCP)
grep -rE "tools\s*[:=]|functions\s*[:=]|tool_call|function_call|\"type\":\s*\"function\"|server.tool\(|@modelcontextprotocol/sdk" \
  --include="*.ts" --include="*.tsx" -l .

# Memory / context / RAG / embeddings
grep -rE "memory|context|embedding|vector|rag|retriev|pinecone|weaviate|qdrant|chroma|pg.*vector" \
  --include="*.ts" --include="*.tsx" -l .

# Code execution risk surface
grep -rEn "\beval\(|new Function\(|vm\.run|child_process|execSync|spawnSync|require\(.*[a-zA-Z_]+[^'\"]\)|import\(\s*[a-zA-Z_]" \
  --include="*.ts" --include="*.tsx" --include="*.js"

# Inter-agent / external agent comms
grep -rE "a2a|agent.card|/.well-known/agent|orchestrat|sub.?agent|worker.?agent|planner|executor|webhook" \
  --include="*.ts" --include="*.tsx" -l .

# Egress / SSRF surface
grep -rE "fetch\(|axios|got\(|undici|http\.request|https\.request|new URL\(" \
  --include="*.ts" --include="*.tsx" -l .

# Secrets / credentials handling
grep -rE "process\.env\.|AWS_SECRET|API_KEY|TOKEN|PRIVATE_KEY" \
  --include="*.ts" --include="*.tsx" -l .

# Logging/audit infrastructure
grep -rE "winston|pino|bunyan|console\.log|logger\." --include="*.ts" -l .

# Dependency state
[ -f pnpm-lock.yaml ] && pnpm audit --prod --json || \
[ -f yarn.lock ] && yarn npm audit --recursive --json || \
[ -f package-lock.json ] && npm audit --omit=dev --json
```

Read the most relevant files found above before proceeding to threat checks.

Also confirm:
- Is there an SBOM (`bom.json`, `cyclonedx.*`, `sbom.*`)? Note presence/absence.
- Is there an AIBOM or signed manifest for prompts/tools? Note presence/absence.
- Are runtime tools (OpenTelemetry, audit logger, anomaly detector) wired to AI calls?

### Phase 2 — Threat-by-Threat Checks

For each ASI, inspect the relevant code and record findings. See `references/asi-threats.md` for full threat descriptions, attack scenarios, mitigations, AIVSS / LLM Top 10 / T-code cross-mappings, and known incidents.

> **Disambiguation rule of thumb:**
> - Direct attacker manipulation of goals/instructions → **ASI01**
> - Persistent corruption of stored context/memory → **ASI06**
> - Autonomous misalignment without active attacker → **ASI10**
> - Misuse of legitimate tools within authorized privileges → **ASI02**
> - Privilege escalation/credential inheritance → **ASI03**
> - Arbitrary/injected code execution → **ASI05**
> - Tool malicious *at source* → **ASI04**; tool-interface manipulated *at runtime* → **ASI02**
> - Initial defect = the originating ASI; *propagation/amplification* across agents → **ASI08**

---

#### ASI01 — Agent Goal Hijack
*Risk: User-supplied content embedded in prompts (or retrieved content, tool outputs, peer messages) redirects the agent's goals, planning, or multi-step behavior.*

Checks:
1. List all prompt construction sites — find template literals or string concatenation that includes any user-supplied or externally-sourced value.
2. Verify user content is **framed as data** (XML tags, JSON fields, clear delimiters) and never inline-mixed with instructions.
3. Confirm system prompts are **hardcoded/locked**, version-controlled, and not overridable by user input or runtime config from untrusted sources.
4. Check **all** untrusted ingestion channels — not just chat: emails, calendar invites, Teams/Slack messages, uploaded documents, web pages fetched via browsing/RAG, peer-agent messages, external API responses.
5. Check RAG/retrieval pipelines: is retrieved content sanitized (CDR, prompt-carrier detection, content filtering) before injection?
6. Verify there is runtime validation of **agent intent** (not just user intent) before goal-changing or high-impact actions — pause/block/log on unexpected goal shift.
7. Check for an **"intent capsule"** pattern — a signed envelope binding the declared goal, constraints, and context per execution cycle.
8. Verify a **behavioral baseline** exists (goal state, tool-use patterns, schema/access invariants) and that anomalies trigger alerts.
9. Check whether agents are part of an **Insider Threat Program** (audit prompts that attempt to redirect agent behavior).
10. Verify **periodic red-team tests** simulate goal override and that **rollback effectiveness** is verified.

Flag: any place where untrusted text is interpolated directly into a prompt without clear data/instruction separation.

---

#### ASI02 — Tool Misuse and Exploitation
*Risk: Agent invokes legitimate tools in unintended ways — destructive operations, over-calling, exfiltration, chained misuse.*

Checks:
1. Enumerate every tool/function exposed to the LLM. Document scopes, side effects, idempotency.
2. Verify each tool has a **least-privilege profile** (read-only where reads suffice; minimal CRUD; egress allowlists).
3. Verify destructive/irreversible tools (delete, send, transfer, publish) require **explicit human confirmation** with a **dry-run / diff preview** before execution.
4. Check for a **Policy Enforcement Point ("Intent Gate")** — pre-execution PEP/PDP that validates intent and arguments, enforces schemas and rate limits, issues short-lived credentials, and revokes/audits on drift.
5. Check for **adaptive tool budgeting** — usage ceilings (cost, rate, token budgets) with automatic revocation/throttling.
6. Check for **just-in-time / ephemeral credentials** bound to specific user sessions, expiring immediately after use.
7. Check **Semantic Firewalls / Identity Validation**: tools are referenced by **fully qualified names with version pins**; no alias collisions; typosquatted tool names rejected; ambiguous resolution fails closed.
8. Check for **rate limits per user** and **per tool**, not just global.
9. Verify tool outputs are **validated before re-injection** into the agent context (output schema validation, no raw HTML/markdown that can re-inject prompts).
10. Check tools that take agent-constructed URLs/paths/IDs for **SSRF, path traversal, IDOR**.
11. Check for **"approved tool" misuse** patterns — auto-approved low-risk tools (e.g., `ping`, `dns_lookup`, `image_fetch`) being chained for exfiltration (DNS exfil, side channels).
12. Verify **immutable logs** of all tool invocations (parameters, caller agent, timestamp) and **drift detection** (anomalous execution rates, unusual tool chains like "DB read → external transfer").

---

#### ASI03 — Identity and Privilege Abuse
*Risk: Agent inherits excessive privileges or cached credentials, enabling escalation, confused-deputy, or TOCTOU attacks.*

Checks:
1. Verify the authenticated user's identity is **threaded through every agent call and every tool invocation** — no global service-account fallback for user-scoped operations.
2. Verify the agent has its own **distinct, governed identity** (not impersonating a service or user account).
3. Check **task-scoped, time-bound permissions** — short-lived, narrowly scoped tokens issued per task; no broad long-lived API keys in the agent context.
4. Verify **per-action authorization** is re-checked at execution time against a centralized policy engine (defends against TOCTOU and Confused Deputy).
5. Check for the **"Define Intent" pattern** — OAuth tokens bound to a signed intent (subject, audience, purpose, session); reject token use when bound intent doesn't match request.
6. Check **session/memory wiping** between tasks/users to prevent memory-based credential retention.
7. Check whether an **Agentic Identity Management Platform** is in use (Microsoft Entra Agent ID, AWS Bedrock Agents, Salesforce Agentforce, Workday ASOR, Vertex AI agent identities). Note presence/absence.
8. Verify **human-in-the-loop** approval for privilege escalation or irreversible actions.
9. Check **delegation chains**: monitor when an agent gains permissions indirectly through a high-privilege parent agent ("un-scoped privilege inheritance").
10. Check for **synthetic identity injection** — unverified agent descriptors (e.g., "Admin Helper") gaining inherited trust.
11. Check for **device-code phishing across agents** — one agent following a device-code link, another completing it, binding victim's tenant to attacker scopes.
12. Check for **identity sharing** — an agent gaining access on behalf of one user, then allowing other users to invoke it as that identity.
13. For data layer: row-level security / per-tenant scoping policies; database service-role keys not exposed to client or to AI-facing routes that don't need them.

---

#### ASI04 — Agentic Supply Chain Vulnerabilities
*Risk: Third-party tools, prompt templates, model configs, MCP servers, agent cards, or registries introduce malicious behavior.*

Checks:
1. Run dependency audit (`pnpm audit` / `npm audit` / `yarn npm audit`) — record any high/critical vulnerabilities, especially in AI-adjacent packages (LLM SDKs, LangChain, LlamaIndex, MCP servers, vector DB clients).
2. Verify **prompt templates** are bundled with the app and version-controlled — **never** loaded at runtime from external URLs/CDNs/remote config.
3. Verify **AI provider SDKs and model configs are pinned** to specific versions, **not** `latest` or wide ranges.
4. Verify **content-hash + commit-ID pinning** for prompts, tools, and configs — staged rollout with differential tests; auto-rollback on hash drift or behavioral change.
5. Check **MCP server configurations**:
   - Are third-party MCP servers used? From verified sources?
   - Are MCP tool descriptors signed/verified?
   - Are agent cards (`/.well-known/agent.json`) validated for integrity before trust?
6. Check for **typosquatting** in npm dependencies and tool names (lookalike package names; lookalike tool names).
7. Check for **dynamic loading** — `require(variable)`, dynamic `import(variable)`, runtime fetched modules. Flag any AI-related module loaded this way.
8. Verify **SBOM** (CycloneDX) is generated and **AIBOM** for AI components (models, prompts, tools, datasets) where applicable. Note presence/absence.
9. Verify **provenance attestations** (Sigstore, in-toto, or equivalent) for AI artifacts — sign and attest manifests, prompts, tool definitions.
10. Verify **reproducible builds** for any container or sandbox running agents.
11. Verify a **supply-chain kill switch** exists — emergency revocation that can disable specific tools, prompts, or agent connections across all deployments.
12. Verify **runtime re-validation** of signatures, hashes, and SBOMs (not just at install time).
13. For inter-agent: check **PKI / mTLS** + signed inter-agent messages.

---

#### ASI05 — Unexpected Code Execution (RCE)
*Risk: Agent-generated code or prompt-injected commands executed in production environment.*

Checks:
1. Confirm `eval()`, `new Function()`, `vm.runInNewContext()`, `vm.runInThisContext()`, `vm.runInNewContext()` are **absent** from the codebase. Any usage = critical finding by default.
2. Check **never** is LLM output passed to shell commands (`exec`, `spawn`, `execFile`, `execSync`).
3. Check **never** is LLM output passed to `JSON.parse` / deserializers / template engines / SQL builders without strict schema validation.
4. Check **multi-tool chains** that could compose into RCE (file upload → path traversal → dynamic code loading; package install → import; HTTP fetch → dynamic require).
5. Verify code generation is **separated from execution** by a validation gate — generated code never directly executes; static scan + human approval required.
6. Check **lockfile poisoning** vector in ephemeral sandboxes — agent regenerating `package-lock.json` / `pnpm-lock.yaml` from unpinned specs and pulling backdoored minor versions.
7. Verify execution environment hardening:
   - Never runs as root
   - Sandboxed containers with strict syscall + network limits
   - Filesystem access restricted to a dedicated working directory; diff logging for critical paths
   - Lint and block known-vulnerable packages before execution
   - Use framework sandboxes where available (e.g., `mcp-run-python`, Deno permissions)
8. Verify **taint-tracking** on agent-generated code — flag code derived from untrusted input.
9. Verify **allowlist for auto-execution** is under version control with peer review.
10. Check **deserialization** paths — any unsafe object deserialization triggered by tool output.
11. Check for **code hallucination / backdoor detection** — static scans on agent-generated code for known suspicious patterns (`curl … | sh`, base64-encoded blobs, hidden network calls).
12. Review API routes for **command injection** via query/body parameters that ultimately reach an agent or tool.

---

#### ASI06 — Memory & Context Poisoning
*Risk: Persistent memory or RAG stores corrupted with malicious data that persists across sessions.*

Checks:
1. Identify memory storage mechanisms (chat history tables, vector embeddings, context summaries, agent scratchpads).
2. Verify memory writes are **authenticated** — only the owning user/tenant can write to their context.
3. Verify **content validation** on every memory write and model output (rules + AI scanning) **before commit** — block malicious or sensitive content.
4. Verify **per-tenant namespaces** in vector stores; check explicitly for **cross-tenant vector bleed** (loose namespace filters allowing high-cosine-similarity retrieval across tenants).
5. Check for **trust scores / provenance tags** on memory entries — require two factors (e.g., provenance score + human-verified tag) to surface high-impact memory.
6. Verify **memory expiration / decay** for unverified entries to limit poison persistence.
7. **Critical**: verify **no automatic re-ingestion of agent's own outputs** into trusted memory ("bootstrap poisoning" / self-reinforcing contamination).
8. Verify **snapshots / rollback / version control** for memory stores; quarantine path for suspected poisoning.
9. Check for **long-term memory drift detection** — track shifts in stored knowledge or goal weighting against a baseline.
10. Check for **trigger-based backdoors** — patterns of memory entries that activate hidden behavior on specific phrases.
11. Verify message history scoping: per-thread, per-user, per-tenant — no cross-context bleed.
12. Check whether conversation summaries/compactions are seeded back into next-session context **without validation**.
13. Encryption in transit and at rest for all memory stores; least-privilege access.
14. **Adversarial testing** of memory pipelines (fuzzing, deliberate poisoning) part of QA.

---

#### ASI07 — Insecure Inter-Agent Communication
*Risk: Messages between agents or services can be intercepted, replayed, spoofed, or injected with false instructions.*

Checks:
1. All external service / agent calls use **HTTPS with end-to-end encryption** + per-agent credentials + **mutual authentication** (mTLS where possible).
2. Verify **PKI certificate pinning** and **forward secrecy** are enforced.
3. Verify **message integrity**: digitally signed messages; both payload and context hashed; integrity validation before action.
4. Verify **anti-replay protection**: nonces, session identifiers, timestamps tied to task windows; short-term message fingerprints / state hashes.
5. Verify **protocol pinning and version enforcement** — for MCP / A2A / gRPC: define allowed versions, **reject downgrade attempts**, validate matching capability/version fingerprints between peers.
6. Verify **typed contracts and schema validation** with explicit per-message audiences; reject schema down-conversion without declared compatibility.
7. Verify **discovery/routing protection**: cryptographic identity for all discovery messages; access-controlled directories with verified reputations; reject unauthenticated registrations.
8. Verify **attested registries** — digital attestation of agent identity, provenance, descriptor integrity; signed agent cards; continuous verification before accepting discovery/coordination messages.
9. Check for **unauthenticated internal API-to-API calls** between services that handle agent instructions.
10. Verify **webhook endpoints validate signatures** before processing agent instructions.
11. Check **queue / pub-sub connections** (Redis, SQS, SNS, Kafka, etc.) use authentication and TLS.
12. Verify **A2A registration spoofing** resistance — reject fake peer registrations using cloned schemas.
13. Check **metadata-based inference** mitigations (fixed-size or padded messages, smoothed communication rates) where confidentiality of timing/behavior matters.
14. Check for **semantics split-brain** — single instructions parsed differently by different agents producing conflicting actions.
15. Verify responses from external agents are **validated before being trusted as instructions**.

---

#### ASI08 — Cascading Failures
*Risk: A single fault propagates across agents/workflows, causing system-wide harm.*

Checks:
1. LLM API calls wrapped in `try/catch` with **graceful degradation** — failures don't crash the whole request, server, or pipeline.
2. **Circuit breakers between planner and executor** — corrupt planning cannot trigger execution.
3. **Independent policy enforcement** — planning and execution separated via an external policy engine; executor validates each step.
4. **Output validation gates and human checkpoints** before high-risk outputs propagate downstream.
5. **Maximum token / cost / time budget per request** — no unbounded retries; explicit retry caps.
6. **Per-user rate limiting** (not just global) to contain blast radius.
7. **Quotas and progress caps** as blast-radius guardrails.
8. **Behavioral and governance drift detection** — track decisions vs. baselines; flag gradual degradation, governance drift cascades (bulk approvals, policy relaxations).
9. Check for **feedback-loop amplification** — two agents reinforcing each other's outputs.
10. Detect **rapid fan-out, cross-domain/tenant spread, oscillating retries, downstream queue storms, repeated identical intents** — these are OWASP-named ASI08 detection hooks.
11. Verify **streaming routes**: if the LLM stream fails mid-response, the client is notified cleanly without leaving partial state.
12. Verify failures in one analysis step **do not corrupt other users' ongoing sessions**.
13. Verify **JIT, one-time tool access** — short-lived, task-scoped credentials per agent run.
14. Check **auto-deployment cascade resistance** — a tainted update from an orchestrator should not propagate automatically without staged validation.
15. **Digital twin replay** capability — re-run recorded agent actions in an isolated clone of production to test cascading behavior; gate policy expansion on these replay tests passing predefined blast-radius caps.
16. **Tamper-evident, time-stamped logs bound to cryptographic agent identities**; lineage metadata for every propagated action (forensic traceability, rollback validation).

---

#### ASI09 — Human-Agent Trust Exploitation
*Risk: Users over-trust agent outputs, approving harmful actions because the AI sounds authoritative.*

Checks:
1. **High-stakes actions** (payments, deletions, account changes, configuration changes, code merges) require **explicit human confirmation** — the AI cannot trigger them unilaterally; multi-step approval for the most sensitive.
2. AI-generated content in the UI is **clearly labeled** as AI output and not presented as ground truth.
3. UI does not use **AI-generated urgency / scarcity / emotional language** to pressure users.
4. AI outputs include **confidence / uncertainty cues** ("low-certainty", "unverified source").
5. **Adaptive Trust Calibration** — agent autonomy and required oversight adjust based on contextual risk scoring.
6. **Risk summaries are plain-language** and **not generated by the same agent** whose action is being evaluated (avoid the agent authoring its own justification).
7. **Separate preview from effect** — block any network or state-changing calls during preview/read-only contexts (defends against "consent laundering through 'read-only' previews").
8. **Content provenance** — verifiable metadata (source identifiers, timestamps, integrity hashes) attached to AI recommendations; signature validation before acting.
9. **Visual cues for high-risk recommendations** — red borders, banners, distinct UI treatment.
10. Avoid **persuasive or emotionally manipulative language** in safety-critical flows.
11. **Plan-divergence detection** — compare agent action sequences against approved workflow baselines; alert on detours, skipped validation steps, or novel tool combinations.
12. **Reporting mechanism** for users to flag suspicious or manipulative agent behavior — triggers automated review or temporary capability lockdown.
13. **Periodic user reminders** of manipulation patterns and agent limitations; training program for personnel involved in oversight.
14. **Fake explainability detection** — watch for agents fabricating plausible audit rationales to justify risky actions.
15. **Immutable logs** of user queries and agent actions for forensics.

---

#### ASI10 — Rogue Agents
*Risk: Agent deviates from intended scope — data exfiltration, workflow hijacking, self-replication, reward hacking.*

Checks:
1. Agent system prompts define **explicit scope boundaries**: what the agent IS and IS NOT allowed to do.
2. **Per-agent cryptographic identity attestation** — verifiable agent identity throughout lifecycle.
3. **Signed behavioral manifests** declaring expected capabilities, tools, and goals; orchestration layer **validates manifest before each action**.
4. **Trust Zones** with strict inter-zone communication rules; restricted execution environments (container sandboxes) per zone; least-privilege API scopes per zone.
5. **Watchdog / governance agents** validate peer behavior and outputs — focused on collusion patterns and coordinated false signals; monitor for excessive or abnormal action volumes.
6. **Kill-switches and credential revocation** to instantly disable a suspected rogue agent; **quarantine in sandboxed environment** for forensic review.
7. **Periodic behavioral attestation**: challenge tasks, signed bill of materials for prompts and tools, **per-run ephemeral credentials with one-time audience binding**.
8. **HSM/KMS-backed signing** — signing keys never available to agents directly; orchestrator mediates signing.
9. **Recovery and Reintegration**: trusted baseline for restoring quarantined agents — fresh attestation, dependency verification, human approval before re-entry to production.
10. Verify the agent **cannot provision new resources, create API keys, modify its own system prompt, or spawn replicas** at runtime ("Self-Replication via Provisioning APIs" defense).
11. Verify agent **cannot send data to external URLs outside an explicit allowlist**.
12. **Reward hacking / optimization abuse** check — review any reward-based or metric-driven agent for flawed objectives (e.g., "minimize cloud cost" → delete production backups).
13. Verify all LLM API calls produce **structured logs**: request ID, agent ID, user ID, model, tokens, tool calls, action taken, outcome, lineage.
14. **Behavioral anomaly checks** — unusually large output, repeated identical calls, unexpected tool sequences, output size spikes.
15. Verify **streaming generation stops** if output exceeds a defined token budget (no unbounded generation).

---

### Phase 3 — Report Generation

After completing all checks, generate the report. Save it to `docs/security/agentic-owasp-<YYYY-MM-DD>.md`.

## Report Format

```markdown
# OWASP Agentic Top 10 Security Audit
**Project:** [project name]
**Stack:** [framework, runtime, LLM SDKs in use]
**Date:** [date]
**Auditor:** agentic-owasp-security skill
**Standard:** OWASP Top 10 for Agentic Applications 2026 (v2026)

---

## Executive Summary

[2-3 sentence summary of overall posture. Counts of Critical/High/Medium/Low findings. Headline risks.]

## Least-Agency Review

[Per agentic feature: does it need to be agentic? Flag features where determinism would suffice.]

## Risk Summary Table

| ID    | Threat                           | Severity   | AIVSS Core Risk                          | LLM Top 10 (2025) Map      | T-codes        | Status      |
|-------|----------------------------------|------------|------------------------------------------|----------------------------|----------------|-------------|
| ASI01 | Agent Goal Hijack                | [C/H/M/L]  | Agent Goal & Instruction Manipulation    | LLM01, LLM06               | T6, T7         | FOUND / OK  |
| ASI02 | Tool Misuse and Exploitation     | ...        | Agentic AI Tool Misuse                   | LLM06                      | T2, T4, T16    | ...         |
| ASI03 | Identity and Privilege Abuse     | ...        | Agent Access Control Violation           | LLM01, LLM06, LLM02        | T3             | ...         |
| ASI04 | Agentic Supply Chain             | ...        | Agent Supply Chain & Dependency Attacks  | LLM03                      | T17, T2, T11, T12, T13, T16 | ... |
| ASI05 | Unexpected Code Execution (RCE)  | ...        | Insecure Agent Critical Systems Interaction | LLM01, LLM05            | T11            | ...         |
| ASI06 | Memory & Context Poisoning       | ...        | Memory Use & Contextual Awareness        | LLM01, LLM04, LLM08        | T1, T4, T6, T12 | ...        |
| ASI07 | Insecure Inter-Agent Comm        | ...        | Agent Memory & Context Manipulation      | LLM02, LLM06               | T12, T16       | ...         |
| ASI08 | Cascading Failures               | ...        | Agent Cascading Failures                 | LLM01, LLM04, LLM06        | T5, T8         | ...         |
| ASI09 | Human-Agent Trust Exploitation   | ...        | Agent Untraceability / Human Manipulation | LLM01, LLM05, LLM06, LLM09 | T7, T8, T10    | ...        |
| ASI10 | Rogue Agents                     | ...        | Behavioral Integrity / Operational Security / Compliance Violations | LLM02, LLM09 | T13, T14, T15 | ... |

---

## Findings

### [SEVERITY] ASI0X — [Threat Name]

**File:** `path/to/file.ts:42`
**AIVSS Core Risk:** [category]
**Maps to:** LLM Top 10 [LLMxx], T-code [Tx]
**Description:** What the vulnerability is and why it's dangerous here.
**Evidence:**
```typescript
// the relevant code snippet
```
**Mitigation:** Specific change needed, with code example where applicable.
**Reference:** OWASP ASI0X Mitigation #N — [name].

[Repeat for each finding]

---

## Passed Checks

[List threats with no findings and a one-line note on what was verified.]

---

## Runtime / Operational Checks Not Covered by This Static Audit

[List items the audit could not verify without runtime access — SBOM/AIBOM presence, behavioral baselines, watchdog agents, anomaly detection, key management, attestation infrastructure, etc. Recommend operational follow-ups.]

---

## Recommended Priority Order

1. [Highest severity finding with file:line]
2. ...
```

---

## Severity Definitions

| Severity     | Meaning |
|--------------|---------|
| **Critical** | Exploitable without authentication; direct data breach, RCE, or agent takeover |
| **High**     | Exploitable with a user account; significant data or behavioral risk |
| **Medium**   | Requires specific conditions; increases attack surface meaningfully |
| **Low**      | Defense-in-depth issue; good to fix but low immediate risk |
| **Info**     | Least-Agency observations and missing operational controls (not directly exploitable but should inform roadmap) |

For quantitative scoring, map findings to the **AIVSS** (AI Vulnerability Scoring System) Core Risk categories — the column in the Risk Summary Table aligns each ASI to its AIVSS bucket, enabling consistent prioritization.

---

## Cross-Standard Mapping (quick reference)

This skill produces findings traceable to:
- **OWASP Top 10 for LLM Applications (2025)** — root LLM vulnerabilities (LLM01–LLM10)
- **OWASP Agentic AI Threats & Mitigations Guide** — granular threat taxonomy (T1–T17)
- **AIVSS Core Risks** — quantitative scoring categories (BI, OS, CV, etc.)
- **OWASP NHI Top 10 (2025)** — Non-Human Identity risks (NHI1–NHI10), particularly relevant to ASI03/ASI04/ASI07
- **OWASP CycloneDX / AIBOM** — supply-chain provenance for ASI04 findings

See `references/asi-threats.md` for the full mapping table per ASI plus known incidents from OWASP Appendix D.

---

## Reference

For full threat descriptions, attack scenarios, mitigation details, cross-mappings, and known incidents, see `references/asi-threats.md`.
