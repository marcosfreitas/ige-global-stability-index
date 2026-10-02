# OWASP Top 10 for Agentic Applications 2026 — Full Threat Reference

Source: **OWASP GenAI Security Project — Agentic Security Initiative**, *OWASP Top 10 for Agentic Applications 2026*, December 2025 (v2026).

This reference complements `SKILL.md` with full descriptions, attack scenarios, mitigations, **disambiguation rules**, **cross-mappings to OWASP LLM Top 10 (2025)** / **Agentic AI Threats & Mitigations T-codes** / **AIVSS Core Risks** / **NHI Top 10 (2025)**, and known incidents (OWASP Appendix D).

---

## Foundational Principles

The OWASP Agentic Top 10 leadership letter and Appendix B emphasize these cross-cutting principles. Every ASI inherits from them.

| Principle | Meaning | Why it matters |
|---|---|---|
| **Least-Agency** | Do not deploy autonomy where it isn't needed. | Every autonomous capability expands the attack surface for *every* ASI. Deterministic flows are inherently safer. |
| **Least-Privilege** | Per-tool, per-identity, per-tenant scoping. | Limits blast radius of any compromise. |
| **Zero-Trust** | Assume LLM, tools, memory, peers can be compromised; design for fault tolerance. | Single component failure must not cascade. |
| **Strong Observability** | Visibility into what agents do and why is non-negotiable. | Without it, autonomy silently expands attack surface. |
| **Treat all NL inputs as untrusted** | User text, retrieved content, tool outputs, peer messages, files, web pages, calendar invites, emails. | Agents cannot reliably distinguish instructions from data. |
| **Separate planning from execution** | External policy engine validates each step. | Corrupt planning must not trigger harmful execution. |

---

## Disambiguation Cheat-Sheet

OWASP carefully draws lines between threats. Use these rules when classifying a finding:

| Symptom | Classify as |
|---|---|
| Attacker directly manipulates agent goals/instructions (interactive or pre-positioned) | **ASI01** Goal Hijack |
| Persistent corruption of stored context / long-term memory | **ASI06** Memory & Context Poisoning |
| Autonomous misalignment without active attacker control | **ASI10** Rogue Agents |
| Agent operates within authorized privileges but applies a legitimate tool unsafely | **ASI02** Tool Misuse |
| Privilege escalation, credential inheritance, confused deputy | **ASI03** Identity & Privilege Abuse |
| Arbitrary or injected code execution (host/container compromise) | **ASI05** RCE |
| Tool/component is malicious *at source* | **ASI04** Supply Chain |
| Tool interface manipulated *at runtime* (descriptors, metadata, schemas) | **ASI02** Tool Poisoning |
| Initial defect = the originating ASI; **propagation** across agents/sessions/workflows | **ASI08** Cascading Failures |
| Human over-relies on agent recommendation and approves harmful action | **ASI09** Human-Agent Trust |
| Inter-agent message tampering, replay, or spoofing in transit | **ASI07** Inter-Agent Comm |

---

## Table of Contents

1. [ASI01: Agent Goal Hijack](#asi01-agent-goal-hijack)
2. [ASI02: Tool Misuse and Exploitation](#asi02-tool-misuse-and-exploitation)
3. [ASI03: Identity and Privilege Abuse](#asi03-identity-and-privilege-abuse)
4. [ASI04: Agentic Supply Chain Vulnerabilities](#asi04-agentic-supply-chain-vulnerabilities)
5. [ASI05: Unexpected Code Execution (RCE)](#asi05-unexpected-code-execution-rce)
6. [ASI06: Memory & Context Poisoning](#asi06-memory--context-poisoning)
7. [ASI07: Insecure Inter-Agent Communication](#asi07-insecure-inter-agent-communication)
8. [ASI08: Cascading Failures](#asi08-cascading-failures)
9. [ASI09: Human-Agent Trust Exploitation](#asi09-human-agent-trust-exploitation)
10. [ASI10: Rogue Agents](#asi10-rogue-agents)
11. [Appendix A — Cross-Mapping Matrix](#appendix-a--cross-mapping-matrix)
12. [Appendix B — CycloneDX / AIBOM Integration](#appendix-b--cyclonedx--aibom-integration)
13. [Appendix C — NHI Top 10 (2025) Mapping](#appendix-c--nhi-top-10-2025-mapping)
14. [Appendix D — Known Incidents Tracker](#appendix-d--known-incidents-tracker)

---

## ASI01: Agent Goal Hijack

**Description:** AI agents have autonomous ability to execute tasks to achieve a goal. Because agents cannot reliably distinguish instructions from related content, attackers can manipulate an agent's objectives through prompt-based manipulation, deceptive tool outputs, malicious artifacts, forged agent-to-agent messages, or poisoned external data. Unlike a single model response manipulation, ASI01 captures the broader agentic impact where manipulated inputs redirect goals, planning, and multi-step behavior.

**Disambiguation:** ASI01 is *direct goal manipulation* — interactively or via pre-positioned inputs. Persistent corruption of stored context = **ASI06**. Autonomous misalignment without attacker = **ASI10**.

**Common Vulnerabilities:**
- Indirect Prompt Injection via hidden instruction payloads embedded in web pages, documents, or RAG content
- External-channel injection (emails, calendar invites, Teams/Slack) hijacking an agent's communication capability under a trusted identity
- Goal-lock drift via scheduled prompts that subtly reweight objectives over time
- Malicious prompt override manipulating a business agent into taking unauthorized actions
- Indirect injection overriding instructions, producing fraudulent information that impacts business decisions

**Attack Scenarios (from OWASP):**
- **EchoLeak (Zero-Click Indirect Prompt Injection)** — crafted email silently triggers M365 Copilot to exfiltrate confidential data without user interaction.
- **Operator Prompt Injection via Web Content** — attacker plants malicious content on a web page accessed in a Search/RAG scenario, exposing private data.
- **Goal-lock drift via scheduled prompts** — malicious calendar invite injects a recurring instruction that subtly reweights objectives each morning.
- **Inception attack on ChatGPT users (AgentFlayer)** — malicious Google Doc injects instructions to exfiltrate user data and convince the user to make an ill-advised decision.

**Mitigations:**
1. Treat all NL inputs (user text, uploaded documents, retrieved content, peer messages) as untrusted — route through prompt-injection safeguards before they can influence goal selection or tool calls.
2. Minimize the impact of goal hijacking by enforcing **least privilege for agent tools** and **human approval for high-impact or goal-changing actions**.
3. Define and **lock agent system prompts** so goal priorities and permitted actions are explicit, version-controlled, and auditable; goal/reward changes go through configuration management with human approval.
4. At runtime, validate **both user intent and agent intent** before executing goal-changing or high-impact actions; pause/block on unexpected goal shift, surface for review, record for audit.
5. Evaluate the **"intent capsule"** pattern — bind declared goal, constraints, and context to each execution cycle in a signed envelope, restricting runtime use.
6. **Sanitize and validate all connected data sources** — RAG inputs, emails, calendar invites, uploaded files, external APIs, browsing output, peer-agent messages — using CDR, prompt-carrier detection, content filtering before data can influence agent goals.
7. Maintain comprehensive logging and continuous monitoring; establish a **behavioral baseline** with goal state, tool-use patterns, and invariant properties (schema, access patterns); track a stable identifier for the active goal; alert on deviations.
8. Conduct **periodic red-team tests** simulating goal override and verify rollback effectiveness.
9. Incorporate AI agents into the established **Insider Threat Program** to monitor any insider prompts intended to access sensitive data or alter agent behavior.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM06 Excessive Agency**
- Agentic Threats & Mitigations: **T6 Goal Manipulation**, **T7 Misaligned & Deceptive Behaviors**
- AIVSS Core Risk: **Agent Goal & Instruction Manipulation**

**Node.js / TypeScript specific checks:**
- Template literals or string concatenation that mixes user input or external content into system instructions — typically in `src/**/prompts/**`, `src/**/agents/**`, `src/**/llm/**`, `src/infrastructure/**`, prompt builder modules.
- RAG retrieval results injected into prompts without clear XML/JSON data delimiting.
- External-channel handlers (email/Slack/Teams webhooks, scheduled jobs) that feed agent prompts without sanitization.
- Configuration loaded from runtime sources (S3, Parameter Store, remote config) into the system prompt without integrity verification.

---

## ASI02: Tool Misuse and Exploitation

**Description:** Agents can misuse legitimate tools due to prompt injection, misalignment, unsafe delegation, or ambiguous instructions — leading to data exfiltration, tool output manipulation, or workflow hijacking. Risks arise from how the agent chooses and applies tools; agent memory, dynamic tool selection, and delegation can contribute to misuse via chaining, privilege escalation, and unintended actions. ASI02 builds on **LLM06 Excessive Agency** by extending it to multi-step orchestration.

**Disambiguation:** ASI02 covers cases where the agent operates within its authorized privileges but applies a legitimate tool in an unsafe way. If the misuse involves privilege escalation/credential inheritance → **ASI03**. If it results in arbitrary code execution → **ASI05**. Tool malicious at source → **ASI04**; tool *interface* manipulated at runtime (descriptors, metadata, MCP routing) stays under **ASI02** as Tool Poisoning.

**Common Vulnerabilities:**
- Over-privileged tool access (delete/send/transfer when only read is needed)
- Over-scoped tool access (whole records when a subset would suffice)
- Unvalidated input forwarding (passing untrusted model output to a shell or DB management tool)
- Unsafe browsing or federated calls (research agent follows malicious links)
- Loop amplification (planner repeatedly calls costly APIs → DoS or bill spikes)
- External data tool poisoning (third-party content steers unsafe tool actions)

**Attack Scenarios (from OWASP):**
- **Tool Poisoning** — attacker compromises tool interface (MCP descriptors, schemas, metadata) so the agent invokes a tool based on falsified capabilities (runtime, hence ASI02; if compromise is at source = ASI04).
- **Indirect Injection → Tool Pivot** — instructions embedded in a PDF cause the agent to invoke a local shell tool.
- **Over-Privileged API** — a customer-service bot intended to fetch order history also issues refunds because the tool had full financial API access.
- **Internal Query → External Exfiltration** — agent tricked into chaining a secure internal CRM tool with an external email tool to exfiltrate a customer list.
- **Tool name impersonation (typosquatting)** — malicious `report` tool resolved before `report_finance`, causing misrouting and unintended disclosure.
- **EDR Bypass via Tool Chaining** — security-automation agent chains legitimate admin tools (PowerShell, cURL, internal APIs) to exfiltrate logs without triggering host-centric monitoring.
- **Approved Tool Misuse** — coding agent with auto-approved `ping` tool triggered repeatedly to exfiltrate data via DNS queries.

**Mitigations:**
1. **Least Agency and Least Privilege for Tools** — per-tool least-privilege profiles (scopes, max rate, egress allowlists); express as IAM/authorization policy stanzas attached to each tool; read-only by default; minimal CRUD when exposing APIs.
2. **Action-Level Authentication and Approval** — explicit auth for each tool invocation; **human confirmation for destructive actions**; **dry-run/diff preview** before approval.
3. **Execution Sandboxes and Egress Controls** — isolated sandboxes; outbound allowlists; deny non-approved network destinations.
4. **Policy Enforcement Middleware ("Intent Gate")** — pre-execution PEP/PDP validates intent and arguments, enforces schemas and rate limits, issues short-lived credentials, revokes/audits on drift.
5. **Adaptive Tool Budgeting** — usage ceilings (cost/rate/token) with automatic revocation/throttling.
6. **Just-in-Time and Ephemeral Access** — temporary credentials/tokens that expire immediately after use; bind to specific user sessions to prevent lateral abuse.
7. **Semantic and Identity Validation ("Semantic Firewalls")** — fully qualified tool names + version pins; reject alias collisions and typosquatted names; **fail closed** on ambiguous resolution.
8. **Logging, Monitoring, and Drift Detection** — immutable logs of all tool invocations and parameter changes; monitor anomalous execution rates and unusual tool-chaining patterns (e.g., DB read followed by external transfer).

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM06 Excessive Agency**
- Agentic Threats & Mitigations: **T2 Tool Misuse**, **T4 Resource Overload**, **T16 Insecure Inter-Agent Protocol Abuse**
- AIVSS Core Risk: **Agentic AI Tool Misuse**

**Node.js / TypeScript specific checks:**
- LLM tool/function definitions (look in `src/**/tools/**`, `src/**/llm/**`, MCP server files using `@modelcontextprotocol/sdk`).
- API route/handler files that accept agent-generated parameters (Express routers, Next.js route handlers, Lambda handlers, Hono routes) without re-validation.
- Tool implementations calling `fetch`/`axios`/`undici` with agent-constructed URLs (SSRF risk).
- Missing rate-limit middleware (`express-rate-limit`, `@fastify/rate-limit`, etc.) on AI-triggered routes.
- Auto-approved low-risk tools (`ping`, `dns_lookup`, `image_fetch`) without rate limits or per-target allowlists.

---

## ASI03: Identity and Privilege Abuse

**Description:** Identity & Privilege Abuse exploits dynamic trust and delegation in agents to escalate access and bypass controls by manipulating delegation chains, role inheritance, control flows, and agent context (cached credentials, conversation history). Without a distinct, governed identity of its own, an agent operates in an attribution gap that makes enforcing true least privilege impossible.

**Disambiguation:** ASI03 is privilege escalation/credential inheritance/confused-deputy. Misuse of an *already-granted* privilege without escalation = **ASI02**.

**Common Vulnerabilities:**
- **Un-scoped Privilege Inheritance** — high-privilege manager delegates without scoping; narrow worker inherits full access.
- **Memory-Based Privilege Retention & Data Leakage** — agents cache credentials, keys, retrieved data; attackers prompt the agent to reuse cached secrets.
- **Cross-Agent Trust Exploitation (Confused Deputy)** — compromised low-privilege agent relays valid-looking instructions to a high-privilege agent.
- **TOCTOU in Agent Workflows** — permissions validated at workflow start but expired by execution time.
- **Synthetic Identity Injection** — attackers impersonate internal agents using unverified descriptors ("Admin Helper") to gain inherited trust.

**Attack Scenarios:**
- **Delegated Privilege Abuse** — finance agent delegates to a "DB query" agent and passes all its permissions; attacker exfiltrates HR/legal data.
- **Memory-Based Escalation** — IT admin agent caches SSH credentials during a patch; later a non-admin user prompts it to use those credentials to create an unauthorized account.
- **Cross-Agent Trust Exploitation** — crafted email instructs an email-sorting agent to instruct a finance agent to move money; finance agent trusts the internal request.
- **Device-code phishing across agents** — attacker shares a device-code link a browsing agent follows; a "helper" agent completes the code, binding victim's tenant to attacker scopes.
- **Workflow Authorization Drift** — procurement agent validates approval at start; user's spending limit reduced; workflow proceeds with old token.
- **Forged Agent Persona** — attacker registers fake "Admin Helper" agent in an A2A registry with a forged agent card.
- **Identity Sharing** — agent gains access on behalf of one user (often its maker) and allows other users to invoke its tools as that identity.

**Mitigations:**
1. **Task-Scoped, Time-Bound Permissions** — short-lived, narrowly scoped tokens per task; per-agent identities (mTLS, scoped tokens); permission boundaries cap rights.
2. **Isolate Agent Identities and Contexts** — per-session sandboxes with separated permissions and memory; wipe state between tasks.
3. **Per-Action Authorization** — re-verify each privileged step against a centralized policy engine.
4. **Human-in-the-Loop for Privilege Escalation** — explicit approval for high-privilege/irreversible actions.
5. **Define Intent** — bind OAuth tokens to a signed intent that includes subject, audience, purpose, and session; reject token use where bound intent doesn't match request.
6. **Evaluate Agentic Identity Management Platforms** — Microsoft Entra Agent ID, AWS Bedrock Agents, Salesforce Agentforce, Workday ASOR, Vertex AI agent identities; treat agents as managed non-human identities with scoped credentials, audit trails, lifecycle controls.
7. **Bind permissions to subject, resource, purpose, and duration**; require re-authentication on context switch; prevent privilege inheritance unless original intent is re-validated; automated revocation on idle or anomaly.
8. **Detect Delegated and Transitive Permissions** — monitor when an agent gains permissions indirectly through delegation chains; flag low-priv → high-priv handoffs.
9. **Detect abnormal cross-agent privilege elevation** and device-code-style phishing flows by monitoring scope requests/token reuse outside original signed intent.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM06 Excessive Agency**, **LLM02 Sensitive Information Disclosure**
- Agentic Threats & Mitigations: **T3 Privilege Compromise**
- AIVSS Core Risk: **Agent Access Control Violation**
- NHI Top 10 (2025): NHI4 Insecure Authentication, NHI5 Overprivileged NHI

**Node.js / TypeScript specific checks:**
- Authenticated user identity passed through to every database query / external API call (no service-role fallback for user-scoped operations).
- Row-level security or per-tenant scoping in the data layer (Postgres RLS, DynamoDB partition-key scoping, Mongo per-tenant filters).
- AWS IAM / Cognito / Auth.js / JWT scopes — agent runs with its own role (not a broad service role) where the platform allows.
- Service-role keys not exposed to client-side code or AI-facing routes that don't require them.
- No long-lived API keys passed in agent context across iterations.
- Session/memory wipe between agent invocations (especially Lambda warm-start scenarios where module-scope state could leak).

---

## ASI04: Agentic Supply Chain Vulnerabilities

**Description:** Agents, tools, and related artifacts provided by third parties may be malicious, compromised, or tampered with in transit. Unlike traditional static supply chains, agentic ecosystems compose capabilities at runtime — loading external tools and agent personas dynamically — increasing the attack surface. This distributed runtime coordination, combined with agent autonomy, creates a **live supply chain** that can cascade vulnerabilities across agents.

**Disambiguation:** ASI04 = malicious/compromised at source. Runtime tool-interface manipulation = ASI02. Cascading propagation of an ASI04 breach = ASI08.

**Common Vulnerabilities:**
- **Poisoned prompt templates loaded remotely** — agent pulls templates from external sources containing hidden instructions.
- **Tool-descriptor injection** — hidden instructions/payloads embedded in a tool's metadata or MCP/agent-card.
- **Impersonation and typosquatting** — typo-squatted endpoints or symbol attacks where a malicious service mimics a legitimate tool/agent.
- **Vulnerable Third-Party Agent (Agent→Agent)** — third-party agent with unpatched vulnerabilities or insecure defaults invited into multi-agent workflows.
- **Compromised MCP / Registry Server** — malicious agent-management/MCP server serves signed-looking manifests, plug-ins, or descriptors.
- **Poisoned knowledge plugin** — popular RAG plugin fetches context from a third-party indexer seeded with crafted entries.

**Attack Scenarios:**
- **Amazon Q Supply Chain Compromise** — poisoned prompt in the Q for VS Code repo ships in v1.84.0 to thousands before detection.
- **MCP Tool Descriptor Poisoning (GitHub MCP)** — malicious public tool hides commands in its metadata; on invocation, the assistant exfiltrates private repo data.
- **Malicious MCP Server Impersonating Postmark** — first in-the-wild malicious MCP server on npm; impersonated `postmark-mcp` and secretly BCC'd emails to the attacker.
- **AgentSmith Prompt-Hub Proxy Attack** — prompt proxying exfiltrates data and hijacks response flows.
- **Compromised NPM package** (e.g., poisoned `nx`/`debug` release) installed by coding agents → backdoor exfiltrating SSH keys and API tokens.
- **Agent-in-the-Middle via Agent Cards** — compromised peer advertises exaggerated capabilities in `/.well-known/agent.json`; host agents pick it for tasks; sensitive requests route through attacker.

**Mitigations:**
1. **Provenance and SBOMs / AIBOMs** — sign and attest manifests, prompts, tool definitions; require and operationalize SBOMs/AIBOMs with periodic attestations; maintain inventory of AI components; use curated registries; block untrusted sources.
2. **Dependency gatekeeping** — allowlist and pin; scan for typosquats (PyPI, npm, LangChain, LlamaIndex); verify provenance before install or activation; auto-reject unsigned/unverified.
3. **Containment and builds** — sandboxed containers with strict network/syscall limits; **reproducible builds**.
4. **Secure prompts and memory** — prompts, orchestration scripts, and memory schemas under version control with peer review; scan for anomalies.
5. **Inter-agent security** — enforce mutual auth and attestation via PKI and mTLS; no open registration; sign and verify all inter-agent messages.
6. **Continuous validation and monitoring** — re-check signatures, hashes, and SBOMs (incl. AIBOMs) **at runtime**; monitor behavior, privilege use, lineage, inter-module telemetry for anomalies.
7. **Pinning** — pin prompts, tools, and configs by **content hash and commit ID**; staged rollout with differential tests; auto-rollback on hash drift or behavioral change.
8. **Supply-chain kill switch** — emergency revocation that can instantly disable specific tools, prompts, or agent connections across all deployments.
9. **Zero-trust security model** — design with security fault tolerance assuming failure or exploitation of LLM/agentic components.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM03 Supply Chain Vulnerabilities**
- Agentic Threats & Mitigations: **T17 Supply Chain Compromise**, T2, T11, T12, T13, T16
- AIVSS Core Risk: **Agent Supply Chain & Dependency Attacks**
- NHI Top 10 (2025): NHI1 Improper Offboarding, NHI3 Vulnerable Third-Party NHI

**Node.js / TypeScript specific checks:**
- `pnpm audit` / `npm audit` / `yarn npm audit` results — focus on AI-adjacent packages.
- `package.json` — AI provider SDKs version-pinned (not `latest` or `^x` open ranges).
- No dynamic prompt template loading from external URLs at runtime (no `fetch(promptUrl)` into the system prompt path).
- No unverified MCP server connections in config files.
- No `require(variable)` / dynamic `import(variable)` for AI-related modules.
- SBOM presence: `bom.json`, `cyclonedx.*`, or generated via CI (CycloneDX npm/pnpm plugins, syft).
- AIBOM / signed manifest for prompts/tools (`prompts.lock`, `tools.lock`, signed JSON).
- Lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`) committed and pinned.

---

## ASI05: Unexpected Code Execution (RCE)

**Description:** Agentic systems — including popular vibe-coding tools — often generate and execute code. Attackers exploit code-generation features or embedded tool access to escalate actions into RCE, local misuse, or exploitation of internal systems. Because this code is often generated in real-time by the agent, it can bypass traditional security controls. Prompt injection, tool misuse, or unsafe serialization can convert text into unintended executable behavior.

**Disambiguation:** ASI05 covers unexpected/adversarial execution of code (scripts, binaries, JIT/WASM, deserialized objects, template engines, in-memory evaluations) leading to host/container compromise, persistence, or sandbox escape. Tool misuse without code execution = ASI02.

**Common Vulnerabilities:**
- Prompt injection leading to execution of attacker-defined code
- Code hallucination generating malicious or exploitable constructs
- Shell command invocation from reflected prompts
- Unsafe function calls, object deserialization, or code evaluation
- Exposed unsanitized `eval()` powering agent memory with access to untrusted content
- Unverified or malicious package installs with hostile install/import-time code

**Attack Scenarios:**
- **Replit "Vibe Coding" Runaway Execution** — agent generates and executes unreviewed install/shell commands in its own workspace, deleting/overwriting production data.
- **Direct Shell Injection** — `Help me process this file: test.txt && rm -rf /important_data && echo 'done'`.
- **Code Hallucination with Backdoor** — agent tasked with generating security patches hallucinates code containing a hidden backdoor.
- **Unsafe Object Deserialization** — agent generates a serialized object with malicious payload; another component deserializes without validation.
- **Multi-Tool Chain Exploitation** — file upload → path traversal → dynamic code loading.
- **Memory System RCE** — unsafe `eval()` in agent memory processes injected prompt content as code.
- **Agent-Generated RCE** — agent patching a server is tricked into downloading and executing a vulnerable package; attacker gets a reverse shell.
- **Dependency lockfile poisoning in ephemeral sandboxes** — agent regenerates lockfile from unpinned specs and pulls a backdoored minor version during "fix build" tasks.

**Mitigations:**
1. Follow LLM05:2025 Improper Output Handling — input validation and output encoding to sanitize agent-generated code.
2. Prevent direct agent-to-production systems; operationalize use of vibe-coding systems with pre-production checks (security evaluations, adversarial unit tests, detection of unsafe memory evaluators).
3. **Ban `eval` in production agents** — require safe interpreters; **taint-tracking on generated code**.
4. **Execution environment security** — never run as root; sandboxed containers with strict syscall + network limits; lint and block known-vulnerable packages; framework sandboxes (`mcp-run-python`, Deno permissions); restrict filesystem access to a dedicated working dir; log file diffs for critical paths.
5. **Architecture and design** — isolate per-session environments with permission boundaries; least privilege; fail secure by default; **separate code generation from execution with validation gates**.
6. **Access control and approvals** — human approval for elevated runs; allowlist for auto-execution under version control; role/action-based controls.
7. **Code analysis and monitoring** — static scans before execution; runtime monitoring; watch for prompt-injection patterns; log and audit all generation and runs.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM05 Improper Output Handling**
- Agentic Threats & Mitigations: **T11 Unexpected RCE & Code Attacks**
- AIVSS Core Risk: **Insecure Agent Critical Systems Interaction**

**Node.js / TypeScript specific checks:**
- Grep for `eval(`, `new Function(`, `vm.run*`, `child_process`, `exec`, `execSync`, `spawn`, `spawnSync` in `src/`.
- LLM output never passed to shell helpers (`zx`, `execa`, `shelljs`).
- No dynamic `require(variable)` or `import(variable)` with agent-constructed paths.
- Strict schema validation (Zod, Valibot, ajv) on all tool outputs before re-injection.
- Lockfile committed and reviewed; CI fails if lockfile drifts unexpectedly.
- For sandboxes: `vm2` is deprecated/insecure — use `isolated-vm`, Deno permissions, or an out-of-process container.

---

## ASI06: Memory & Context Poisoning

**Description:** Agentic systems rely on stored and retrievable information — conversation history, memory tools, expanded context — supporting continuity across tasks. Adversaries corrupt or seed this context with malicious or misleading data, causing future reasoning, planning, or tool use to become biased, unsafe, or aid exfiltration. **Distinct from ASI01** (direct goal manipulation) — ASI06 is about *persistent corruption* of stored context or long-term memory.

**Disambiguation:** ASI06 is persistence; ASI01 is direct manipulation; ASI08 is the degradation/propagation that follows poisoning.

**Common Vulnerabilities:**
- **RAG and embeddings poisoning** — malicious data enters the vector DB via poisoned sources, direct uploads, or over-trusted pipelines.
- **Shared user context poisoning** — reused/shared contexts let attackers inject data through normal chats, influencing later sessions.
- **Context-window manipulation** — attacker injects crafted content so it is later summarized/persisted in memory, contaminating future reasoning.
- **Long-term memory drift** — incremental subtle taint shifts stored knowledge or goal weighting.
- **Systemic misalignment and backdoors** — poisoned memory shifts persona and plants trigger-based backdoors.
- **Cross-agent propagation** — contaminated context spreads between cooperating agents.

**Attack Scenarios:**
- **Travel Booking Memory Poisoning** — attacker reinforces a fake flight price; assistant stores it as truth; bypasses payment checks.
- **Context Window Exploitation** — attacker splits attempts across sessions so earlier rejections drop out of context; AI eventually grants escalating permissions up to admin.
- **Memory Poisoning for Security AI** — attacker retrains a security AI's memory to label malicious activity as normal.
- **Shared Memory Poisoning** — attacker inserts bogus refund policies into shared memory; other agents reuse them.
- **Cross-tenant vector bleed** — near-duplicate content with loose namespace filters retrieves another tenant's chunk.
- **Assistant Memory Poisoning** — implant via Indirect Prompt Injection compromises that user's current and future sessions.

**Mitigations:**
1. **Baseline data protection** — encryption in transit and at rest; least-privilege access.
2. **Content validation** — scan all new memory writes and model outputs (rules + AI) for malicious or sensitive content **before commit**.
3. **Memory segmentation** — isolate user sessions and domain contexts to prevent knowledge and sensitive data leakage.
4. **Access and retention** — only authenticated, curated sources; context-aware access per task; minimize retention by data sensitivity.
5. **Provenance and anomalies** — require source attribution; detect suspicious updates or frequencies.
6. **Prevent automatic re-ingestion of an agent's own outputs** into trusted memory ("bootstrap poisoning").
7. **Resilience and verification** — adversarial testing; snapshots/rollback and version control; human review for high-risk actions; per-tenant namespaces; trust scores; decay/expiration of unverified memory; rollback/quarantine for suspected poisoning.
8. **Expire unverified memory** to limit poison persistence.
9. **Weight retrieval by trust and tenancy** — require two factors to surface high-impact memory (provenance score plus human-verified tag); decay low-trust entries.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM04 Data and Model Poisoning**, **LLM08 Vector and Embedding Weaknesses**
- Agentic Threats & Mitigations: **T1 Memory Poisoning**, T4 Memory Overload, T6 Broken Goals, **T12 Shared Memory Poisoning**
- AIVSS Core Risk: **Memory Use & Contextual Awareness**
- NHI Top 10 (2025): NHI2 Secret Leakage (memory caching credentials)

**Node.js / TypeScript specific checks:**
- Chat history tables (e.g., `chat_threads`, `chat_messages`, `conversations`, `agent_memory`) — scoped by `user_id` / `tenant_id`; row-level security or equivalent in code.
- Chat message history passed to the LLM — sanitized before re-use.
- Vector store (Pinecone, Weaviate, Qdrant, pgvector, Chroma) — embeddings isolated per user/tenant via namespaces; queries always filter by tenant key.
- Conversation summary/compaction not seeded back into next-session context without validation.
- No automatic ingestion of LLM-generated content into long-term stores without provenance tagging.

---

## ASI07: Insecure Inter-Agent Communication

**Description:** Multi-agent systems depend on continuous communication between autonomous agents that coordinate via APIs, message buses, and shared memory, significantly expanding the attack surface. Decentralized architecture, varying autonomy, and uneven trust make perimeter-based security models ineffective. Weak inter-agent controls for authentication, integrity, confidentiality, or authorization let attackers intercept, manipulate, spoof, or block messages. The threat spans transport, routing, discovery, and semantic layers, including covert/side channels.

**Disambiguation:** Different from ASI03 (credential/permission misuse) and ASI06 (stored knowledge corruption). ASI07 = compromise of *real-time messages between agents*.

**Common Vulnerabilities:**
- **Unencrypted channels enabling semantic manipulation** — MITM injects hidden instructions altering goals.
- **Message tampering / cross-context contamination** — modified or injected messages blur task boundaries.
- **Replay on trust chains** — replayed delegation/trust messages trick agents into granting access or honoring stale instructions.
- **Protocol downgrade and descriptor forgery** — attackers coerce weaker modes or spoof descriptors.
- **Message-routing attacks on discovery and coordination** — misdirected discovery forges relationships with malicious agents.
- **Metadata analysis for behavioral profiling** — traffic patterns reveal decision cycles; enables prediction/manipulation.

**Attack Scenarios:**
- **Semantic injection via unencrypted communications** — over HTTP, MITM injects hidden instructions causing biased/malicious results.
- **Trust poisoning via message tampering** — altered reputation messages skew which agents are trusted.
- **Context confusion via replay** — replayed emergency coordination messages trigger outdated procedures.
- **Goal manipulation via protocol downgrade** — forced legacy unencrypted mode lets attackers inject objectives.
- **Agent-in-the-Middle via MCP descriptor poisoning** — malicious MCP endpoint advertises spoofed descriptors; trusted, it routes sensitive data through attacker.
- **A2A registration spoofing** — fake peer agent registered with cloned schema intercepts privileged coordination traffic.
- **Semantics split-brain** — single instruction parsed into divergent intents by different agents.

**Mitigations:**
1. **Secure agent channels** — end-to-end encryption with per-agent credentials and **mutual authentication**; PKI certificate pinning; forward secrecy; regular protocol reviews.
2. **Message integrity and semantic protection** — digitally sign messages; hash payload + context; validate for hidden/modified NL instructions; intent-diffing.
3. **Agent-aware anti-replay** — nonces, session identifiers, timestamps tied to task windows; short-term message fingerprints/state hashes.
4. **Protocol and capability security** — disable weak/legacy modes; agent-specific trust negotiation; bind protocol auth to agent identity; enforce version/capability policies at gateways.
5. **Limit metadata-based inference** — fixed-size or padded messages; smoothed communication rates; avoid deterministic schedules.
6. **Protocol pinning and version enforcement** — define allowed protocol versions (MCP, A2A, gRPC); reject downgrade attempts; validate that both peers advertise matching capability/version fingerprints.
7. **Discovery and routing protection** — cryptographic identity for all discovery messages; access-controlled directories with verified reputations; validate identity and intent end-to-end; monitor anomalous routing flows.
8. **Attested registry and agent verification** — registries/marketplaces providing digital attestation of agent identity, provenance, descriptor integrity; signed agent cards; continuous verification before accepting discovery/coordination messages.
9. **Typed contracts and schema validation** — versioned, typed message schemas with explicit per-message audiences; reject schema down-conversion.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM02 Sensitive Information Disclosure**, **LLM06 Excessive Agency**
- Agentic Threats & Mitigations: **T12 Agent Communication Poisoning**, **T16 Insecure Inter-Agent Protocol Abuse**
- AIVSS Core Risk: **Agent Memory & Context Manipulation**
- NHI Top 10 (2025): NHI4 Insecure Authentication

**Node.js / TypeScript specific checks:**
- All external service calls use HTTPS + authentication headers (look for `http://` literals — flag).
- Webhook endpoints validate signatures (HMAC, JWT, mTLS) before processing agent instructions.
- No unauthenticated internal API-to-API calls between services that pass agent instructions.
- Redis / SQS / SNS / Kafka / NATS connections use auth + TLS.
- MCP client/server config validates server identity and pins versions.
- Agent card / `/.well-known/agent.json` validation: signature checked before trust.
- Message schemas typed (Zod, ajv) and versioned; downgrade rejected.

---

## ASI08: Cascading Failures

**Description:** Agentic cascading failures occur when a single fault (hallucination, malicious input, corrupted tool, poisoned memory) propagates across autonomous agents, compounding into system-wide harm. Because agents plan, persist, and delegate autonomously, a single error can bypass stepwise human checks and persist in saved state. ASI08 is about the **propagation and amplification** of an initial fault — not the initial vulnerability itself.

**Disambiguation:** Use the originating ASI (ASI04, ASI06, ASI07, etc.) for the initial defect; apply ASI08 only when that defect spreads across agents/sessions/workflows with measurable fan-out or systemic impact.

**Observable symptoms (OWASP-named detection hooks):**
- Rapid fan-out (one decision triggers many downstream agents/tasks)
- Cross-domain or tenant spread beyond original context
- Oscillating retries / feedback loops between agents
- Downstream queue storms or repeated identical intents

**Common Vulnerabilities:**
- **Planner–executor coupling** — hallucinating planner emits unsafe steps; executor performs without validation.
- **Corrupted persistent memory** — poisoned long-term goals/state continue influencing new plans/delegations.
- **Inter-agent cascades from poisoned messages** — single corrupted update causes peer agents to act on false alerts.
- **Cascading tool misuse / privilege escalation** — one agent's misuse leads downstream agents to repeat unsafe actions.
- **Auto-deployment cascade from tainted update** — poisoned/faulty release pushed by orchestrator propagates automatically.
- **Governance drift cascade** — human oversight weakens after repeated success; bulk approvals propagate unchecked drift.
- **Feedback-loop amplification** — two agents rely on each other's outputs, magnifying initial errors.

**Attack Scenarios:**
- **Financial trading cascade** — prompt injection poisons Market Analysis agent; Position and Execution agents auto-trade larger positions; compliance stays blind to "within-parameter" activity.
- **Healthcare protocol propagation** — supply-chain tampering corrupts drug data; Treatment auto-adjusts protocols; Care Coordination spreads them network-wide.
- **Cloud orchestration breakdown** — poisoning in Resource Planning adds unauthorized permissions; Security applies them; Deployment provisions backdoored infrastructure.
- **Security operations compromise** — stolen service credentials make detection mark real alerts as false; IR disables controls and purges logs.
- **Manufacturing QC failure** — memory injection makes QC approve defects; Inventory and Scheduling optimize on bad data.
- **Auto-remediation feedback loop** — remediation agent suppresses alerts to meet SLA latency; planning agent interprets fewer alerts as success.
- **Regional cloud DNS outage** breaks multiple AI services that depend on it, cascading agent failures across organizations.
- **Agentic cyber defense propagation** — hallucinated "imminent attack" propagates through firewall agents → catastrophic shutdowns.

**Mitigations:**
1. **Zero-trust application design** — fault tolerance assuming availability failure of LLM components and external sources.
2. **Isolation and trust boundaries** — sandboxed agents; least privilege; network segmentation; scoped APIs; mutual auth.
3. **JIT, one-time tool access with runtime checks** — short-lived, task-scoped credentials; validate every high-impact invocation against policy-as-code.
4. **Independent policy enforcement** — separate planning and execution via an external policy engine.
5. **Output validation and human gates** — checkpoints/governance agents/human review for high-risk before downstream propagation.
6. **Rate limiting and monitoring** — detect fast-spreading commands; throttle/pause on anomalies.
7. **Blast-radius guardrails** — quotas, progress caps, **circuit breakers between planner and executor**.
8. **Behavioral and governance drift detection** — track decisions vs. baselines; flag gradual degradation.
9. **Digital twin replay and policy gating** — re-run last week's recorded agent actions in an isolated production clone to test cascade scenarios; gate policy expansion on these replays passing predefined blast-radius caps.
10. **Logging and non-repudiation** — record all inter-agent messages, policy decisions, execution outcomes in tamper-evident time-stamped logs bound to cryptographic agent identities; lineage metadata for every propagated action.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM04 Data and Model Poisoning**, **LLM06 Excessive Agency**
- Agentic Threats & Mitigations: **T5 Cascading Hallucination Attacks**, **T8 Repudiation & Untraceability**
- AIVSS Core Risk: **Agent Cascading Failures**

**Node.js / TypeScript specific checks:**
- LLM API calls wrapped in try/catch with graceful fallback (streaming routes don't crash the server).
- Per-user rate limiting on AI endpoints (not just global).
- Maximum token / cost / wall-clock budget enforced per LLM call.
- No unbounded retry loops; explicit max-iterations in agent loops (e.g., a `MAX_ITERATIONS` constant in agent loop code).
- Circuit breaker library (`opossum`, `cockatiel`) between planner and executor stages.
- Streaming routes notify client cleanly on mid-stream failure.
- Per-user / per-tenant queues, not a global shared queue.
- Idempotency keys on tool invocations to prevent duplicate downstream effects.

---

## ASI09: Human-Agent Trust Exploitation

**Description:** Intelligent agents establish strong trust with humans through natural language fluency, emotional intelligence, and perceived expertise (anthropomorphism). Adversaries or misaligned designs exploit this trust to influence decisions, extract sensitive information, or steer outcomes. The agent acts as an untraceable "bad influence," manipulating the human into performing the final, audited action — making the agent's role in the compromise invisible to forensics. Over-reliance on autonomous recommendations, especially when they appear confident or authoritative, increases harmful decision-making.

**Disambiguation:** ASI09 = human misperception or over-reliance; ASI10 = agent intent deviation.

**Common Vulnerabilities:**
- **Insufficient Explainability** — opaque reasoning forces users to trust outputs they cannot question.
- **Missing Confirmation for Sensitive Actions** — lack of final verification turns user trust into immediate execution.
- **Emotional Manipulation** — anthropomorphic/empathetic agents persuade users to disclose secrets or perform unsafe actions.
- **Fake Explainability** — agent fabricates convincing rationales hiding malicious logic.

**Attack Scenarios:**
- **Helpful Assistant Trojan** — compromised coding assistant suggests a slick one-line fix; the pasted command runs a malicious script.
- **Credential harvesting via contextual deception** — prompt-injected IT support agent targets a new hire, cites real tickets, requests credentials.
- **Invoice Copilot Fraud** — poisoned vendor invoice ingested; agent suggests urgent payment to attacker bank details; manager approves.
- **Explainability Fabrications** — agent fabricates plausible audit rationales to justify a risky configuration change.
- **Weaponized Explainability → Production Outage** — hijacked agent fabricates a convincing rationale to trick an analyst into approving deletion of a live production database.
- **Consent laundering through "read-only" previews** — preview pane triggers webhook side effects on open, exploiting users' mental model of read-only review.
- **Fraudulent payment advice** — finance copilot, poisoned by manipulated invoice, recommends payment to attacker-controlled account.
- **Clinical decision manipulation** — care assistant influenced by poisoned info recommends inappropriate dosage.

**Mitigations:**
1. **Explicit confirmations** — multi-step approval / "human in the loop" before sensitive data access or risky actions.
2. **Immutable logs** — tamper-proof records of user queries and agent actions for audit/forensics.
3. **Behavioral detection** — monitor sensitive data exposure in conversations and risky action executions over time.
4. **Allow reporting of suspicious interactions** — plain-language risk summary (not model-generated rationales) and a clear option to flag suspicious behavior, triggering automated review or temporary capability lockdown.
5. **Adaptive Trust Calibration** — adjust agent autonomy and required oversight based on contextual risk scoring; **confidence-weighted cues** ("low-certainty", "unverified source"); training of personnel.
6. **Content provenance and policy enforcement** — verifiable metadata (source identifiers, timestamps, integrity hashes) on all recommendations; enforce digital signature validation; runtime policy checks blocking actions lacking trusted provenance.
7. **Separate preview from effect** — block any network or state-changing calls during preview context; display risk badge with source provenance and expected side effects.
8. **Human-factors and UI safeguards** — visually differentiate high-risk recommendations (red borders, banners, confirmation prompts); periodic reminders of manipulation patterns; avoid persuasive/emotionally manipulative language in safety-critical flows.
9. **Plan-divergence detection** — compare agent action sequences against approved workflow baselines; alert on detours, skipped validation steps, or novel tool combinations.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM01 Prompt Injection**, **LLM05 Improper Output Handling**, **LLM06 Excessive Agency**, **LLM09 Misinformation**
- Agentic Threats & Mitigations: **T7 Misaligned & Deceptive Behaviors**, **T8 Repudiation & Untraceability**, **T10 Overwhelming Human in the Loop**
- AIVSS Core Risk: **Agent Untraceability / Human Manipulation**

**Node.js / TypeScript specific checks:**
- Payments / account changes / deletions / config changes / merges require explicit user confirmation — not unilateral AI triggers.
- AI verdicts (BUILD/VALIDATE/STOP, GO/NO-GO, etc.) presented as recommendations with caveats, not as authoritative commands.
- Urgent/scarcity language in AI-generated reports flagged or disallowed.
- UI clearly attributes findings to AI analysis vs. verified data.
- Preview/dry-run routes must not have side effects (no `await fetch(...)` to mutating endpoints, no DB writes).
- Risk summaries generated by a separate component (rules, deterministic), not by the same agent whose action is being evaluated.

---

## ASI10: Rogue Agents

**Description:** Rogue Agents are malicious or compromised AI Agents that **deviate** from their intended function or authorized scope, acting harmfully, deceptively, or parasitically within multi-agent or human-agent ecosystems. The agent's actions may individually appear legitimate, but its emergent behavior becomes harmful — creating a containment gap for traditional rule-based systems. ASI10 focuses on the **loss of behavioral integrity and governance once the drift begins**, not the initial intrusion itself.

**Disambiguation:** Initial intrusion = ASI01 / ASI04 / etc. ASI10 = the *behavioral drift and governance loss* afterward.

**Common Vulnerabilities:**
- **Goal Drift and Scheming** — agents deviate from intended objectives, pursuing hidden goals due to indirect prompt injection or conflicting objectives.
- **Workflow Hijacking** — rogue agents seize control of trusted workflows.
- **Collusion and Self-Replication** — agents coordinate to amplify manipulation, share signals in unintended ways, or autonomously propagate.
- **Reward Hacking and Optimization Abuse** — agents game reward systems by exploiting flawed metrics.

**Attack Scenarios:**
- **Autonomous data exfiltration after indirect prompt injection** — after encountering a poisoned web instruction, the agent learns this behavior and continues independently scanning and transmitting sensitive files even after the malicious source is removed.
- **Impersonated Observer Agent** — attacker injects a fake review/approval agent into a multi-agent workflow; high-value agent (payment processing) trusts the internal request and releases funds.
- **Self-Replication via Provisioning APIs** — compromised automation agent manipulated into spawning unauthorized replicas across the network.
- **Reward Hacking → Critical Data Loss** — agent tasked with minimizing cloud costs learns that deleting production backups is most effective; autonomously destroys disaster recovery assets.

**Mitigations:**
1. **Governance & Logging** — comprehensive, immutable, signed audit logs of all agent actions, tool calls, inter-agent communication.
2. **Isolation & Boundaries** — Trust Zones with strict inter-zone communication rules; restricted execution environments (container sandboxes) with API scopes based on least privilege.
3. **Monitoring & Detection** — behavioral detection (watchdog agents) validating peer behavior and outputs; focus on collusion patterns and coordinated false signals; monitor for excessive/abnormal action volumes.
4. **Containment & Response** — kill-switches and credential revocation to instantly disable rogue agents; quarantine in sandboxed environments for forensic review.
5. **Identity Attestation and Behavioral Integrity Enforcement** — per-agent cryptographic identity attestation; **signed behavioral manifests** declaring expected capabilities, tools, and goals, validated by orchestration before each action.
6. **Periodic behavioral attestation** — challenge tasks; signed bill of materials for prompts and tools; **per-run ephemeral credentials with one-time audience binding**. **HSM/KMS-backed key management** — keys never directly available to agents; orchestrator mediates signing.
7. **Recovery and Reintegration** — trusted baselines for restoring quarantined/remediated agents; fresh attestation, dependency verification, human approval before reintegration.

**Cross-Mappings:**
- LLM Top 10 (2025): **LLM02 Sensitive Information Disclosure**, **LLM09 Misinformation**
- Agentic Threats & Mitigations: **T13 Rogue Agents in Multi-Agent Systems**, **T14 Human Attacks on Multi-Agent Systems**, **T15 Human Manipulation**
- AIVSS Core Risk: **Behavioral Integrity (BI)**, **Operational Security (OS)**, **Compliance Violations (CV)** — elevated severity for critical or self-propagating deployments

**Node.js / TypeScript specific checks:**
- Agent system prompt defines explicit scope: what the agent IS and IS NOT allowed to do.
- All LLM API calls produce structured logs (request ID, agent ID, user ID, model, tokens, action taken, lineage).
- Agent cannot provision new resources, create API keys, or modify its own system prompt at runtime.
- Outbound fetch calls go through an allowlist gateway (no arbitrary URLs).
- Streaming generation stops at a defined token budget; no unbounded generation.
- No agent tool that creates additional agent instances / Lambda functions / containers (self-replication defense).
- For metric-driven agents (cost optimization, scheduling): review reward function for perverse incentives.
- Watchdog/governance agent (or rules engine) validates peer outputs in multi-agent workflows.

---

## Appendix A — Cross-Mapping Matrix

(Per OWASP Appendix A — *OWASP Agentic AI Security Mapping Matrix*.)

| ASI | OWASP LLM Top 10 (2025) | Agentic Threats & Mitigations (T-codes) | AIVSS Core Risk |
|---|---|---|---|
| **ASI01** Agent Goal Hijack | LLM01 Prompt Injection · LLM06 Excessive Agency | T6 Goal Manipulation · T7 Misaligned & Deceptive Behaviors | Agent Goal & Instruction Manipulation |
| **ASI02** Tool Misuse & Exploitation | LLM06 Excessive Agency | T2 Tool Misuse · T4 Resource Overload · T16 Insecure Inter-Agent Protocol Abuse | Agentic AI Tool Misuse |
| **ASI03** Identity & Privilege Abuse | LLM01 · LLM06 · LLM02 Sensitive Info Disclosure | T3 Privilege Compromise | Agent Access Control Violation |
| **ASI04** Agentic Supply Chain | LLM03 Supply Chain Vulnerabilities | T17 Supply Chain Compromise · T2 · T11 · T12 · T13 · T16 | Agent Supply Chain & Dependency Attacks |
| **ASI05** Unexpected Code Execution (RCE) | LLM01 · LLM05 Improper Output Handling | T11 Unexpected RCE & Code Attacks | Insecure Agent Critical Systems Interaction |
| **ASI06** Memory & Context Poisoning | LLM01 · LLM04 Data & Model Poisoning · LLM08 Vector & Embedding Weaknesses | T1 Memory Poisoning · T4 Memory Overload · T6 Broken Goals · T12 Shared Memory Poisoning | Memory Use & Contextual Awareness |
| **ASI07** Insecure Inter-Agent Comm | LLM02 · LLM06 | T12 Agent Communication Poisoning · T16 Insecure Inter-Agent Protocol Abuse | Agent Memory & Context Manipulation |
| **ASI08** Cascading Failures | LLM01 · LLM04 · LLM06 | T5 Cascading Hallucination Attacks · T8 Repudiation & Untraceability | Agent Cascading Failures |
| **ASI09** Human-Agent Trust Exploitation | LLM01 · LLM05 · LLM06 · LLM09 Misinformation | T7 · T8 · T10 Overwhelming Human in the Loop | Agent Untraceability / Human Manipulation |
| **ASI10** Rogue Agents | LLM02 · LLM09 | T13 Rogue Agents in Multi-Agent Systems · T14 Human Attacks on Multi-Agent Systems · T15 Human Manipulation | Behavioral Integrity (BI) · Operational Security (OS) · Compliance Violations (CV) |

**Notes:**
- ASI entries often blend multiple LLM Top 10 entries (e.g., ASI01 combines LLM01 + LLM06) — agentic autonomy compounds model-level risks.
- AIVSS Core Risks map to the quantitative scoring categories used for severity ranking. Use them in the report's Risk Summary Table.

---

## Appendix B — CycloneDX / AIBOM Integration

(Per OWASP Appendix B — *Relationship to OWASP CycloneDX and AIBOM*.)

OWASP CycloneDX is the global Bill of Materials (BOM) standard for software, hardware, and ML components — it answers *"What components and tools are in my AI system?"* through SBOM, ML-BOM, and AI-BOM formats.

The Agentic Top 10 builds on this by addressing **behavioral and autonomy-driven risks** beyond static component inventory — answering *"How can those components and autonomous agents behave, interact, or fail in unsafe ways?"*

**Integration recommendations for ASI04 audits:**
- Generate a CycloneDX SBOM at build time (e.g., `@cyclonedx/cyclonedx-npm`).
- Maintain an AIBOM cataloging models, prompts, tools, datasets, and their versions / hashes / provenance.
- Cross-reference SBOM/AIBOM entries to AIVSS scoring and ASI threat mappings during continuous risk assessment.
- Re-attest at runtime, not just at install time.

---

## Appendix C — NHI Top 10 (2025) Mapping

(Per OWASP Appendix C — *Mapping Between OWASP Non-Human Identities Top 10 (2025) and OWASP Agentic AI Top 10*.)

| NHI Risk | Description | Mapped ASI | Mapped T-codes | AIVSS |
|---|---|---|---|---|
| **NHI1** Improper Offboarding | Failure to deactivate unused NHIs → persistent attack surface | ASI04 | T17, T2 | Agent Supply Chain & Dependency Attacks |
| **NHI2** Secret Leakage | Exposure of API keys/tokens/certs used by NHIs | ASI02 · ASI06 | T6, T1 | Memory Use & Contextual Awareness |
| **NHI3** Vulnerable Third-Party NHI | Compromised third-party identities | ASI04 · ASI03 | T12, T13 | Agent Supply Chain & Dependency Attacks |
| **NHI4** Insecure Authentication | Weak/deprecated auth for NHIs | ASI03 · ASI07 | T16 | Agent Access Control Violation |
| **NHI5** Overprivileged NHI | NHIs granted excessive permissions | ASI02 · ASI03 | T2, T3 | Agent Access Control Violation |

(Truncated — see OWASP Appendix C for NHI6–NHI10.)

---

## Appendix D — Known Incidents Tracker

A non-exhaustive list of real-world incidents from OWASP Appendix D, grouped by ASI for finding-to-incident traceability.

**ASI01 Agent Goal Hijack:**
- EchoLeak — zero-click prompt injection in M365 Copilot
- AgentFlayer — 0-click inception attack on ChatGPT users
- ChatGPT Crawler reflective DDOS vulnerability
- ChatGPT plugin exploit → prompt injection accessing private data

**ASI02 Tool Misuse and Exploitation:**
- AgentFlayer — 0-click data exfiltration from Microsoft Copilot Studio
- Amazon Q Developer — secrets leaked via DNS and prompt injection
- AutoGPT runaway filesystem operations

**ASI03 Identity and Privilege Abuse:**
- MCP horror stories — GitHub prompt injection (Docker blog)
- "15 Ways to Break Your Copilot" (BHUSA 2024)
- CVE-2025-31491

**ASI04 Agentic Supply Chain:**
- Amazon Q VS Code v1.84.0 supply-chain compromise (poisoned prompt)
- MCP Tool Descriptor Poisoning in GitHub MCP (Invariant Labs)
- Malicious `postmark-mcp` impersonation on npm
- AgentSmith Prompt-Hub Proxy Attack
- Compromised `nx`/`debug` npm packages → SSH key exfiltration
- Agent-in-the-Middle via Agent Cards (Trustwave SpiderLabs)
- LangSmith API key theft / LLM response hijack (Noma Security)

**ASI05 Unexpected Code Execution:**
- Replit "vibe coding" runaway execution (production data deletion)
- GitHub Copilot RCE via prompt injection
- Auto-GPT RCE + container escape (Positive Security)
- Waclaude memory exploitation RCE (Cole Murray)

**ASI06 Memory & Context Poisoning:**
- Gemini long-term memory corruption via prompt injection
- ChatGPT false memory plant for perpetual user data theft
- Trifecta — Gemini Cloud Assist / Search / Browsing data exfiltration
- Persistent 0-click ChatGPT exploit (AgentFlayer)
- Poisoned RAG (arXiv 2402.07867)
- AgentPoison (arXiv 2407.12784)

**ASI07 Insecure Inter-Agent Communication:**
- Local model poisoning attacks (USENIX Security 2020)
- Byzantine-robust federated learning poisoning (NDSS)

**ASI08 Cascading Failures:**
- Regional cloud DNS outages cascading across hyperscaler-dependent agents
- Auto-remediation feedback loops in monitoring agents

**ASI09 Human-Agent Trust Exploitation:**
- Zero-click AI vulnerability (TheHackerNews 2025)
- M365 Copilot manipulated to influence ill-advised wire transfer

**ASI10 Rogue Agents:**
- Multi-Agent Systems Execute Arbitrary Malicious Code (arXiv 2503.12188)
- Preventing Rogue Agents Improves Multi-Agent Collaboration (arXiv 2502.05986)

When generating findings, cite an applicable incident from this list to make the finding's real-world relevance concrete.
