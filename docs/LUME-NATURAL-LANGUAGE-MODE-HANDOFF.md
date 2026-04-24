# LUME — Natural Language Evolution Roadmap
### Milestones 7–13: From English Mode to Universal Programming
**Date:** March 7, 2026
**From:** Jason (Trust Layer / DarkWave Ecosystem)
**To:** Lume Agent (lume-lang.org)

---

## CONTEXT

Lume already compiles `.lume` files through the pipeline: **Lexer → Parser → AST → Transpiler → JavaScript**. The existing keywords (`ask`, `think`, `generate`, `show`, `let`, `monitor`, `heal`, `optimize`, `evolve`, `mutate`) proved that natural-language-inspired syntax dramatically reduces friction. Milestones 1–6 are complete. These seven milestones take the language to its ultimate form.

**Milestones 1–6 (COMPLETE):**
1. Core language & compiler
2. AI-native keywords
3. Transpiler to JavaScript
4. npm publish & CLI
5. Lume Academy integration
6. Self-Sustaining Runtime (monitor, heal, optimize, evolve)

---

## MILESTONE 7: ENGLISH MODE

### What It Is

A new compiler mode where the input is plain English sentences. Not "English-like syntax" — actual English. The compiler understands intent from context and resolves it into the existing Lume AST, which then transpiles to JavaScript as normal.

### How It Works

Add a **front-end stage** to the existing compiler pipeline:

```
CURRENT:   Lume Source → Lexer → Parser → AST → Transpiler → JavaScript
NEW:       English Source → Intent Resolver → Lume AST → Transpiler → JavaScript
```

The Intent Resolver is the new component. It sits before the existing pipeline and converts English sentences into Lume AST nodes. The rest of the pipeline is untouched.

### The Intent Resolver — Two Layers

**Layer A: Pattern Matching (fast, offline, no AI needed)**

A dictionary of common English phrases mapped directly to AST nodes. These are deterministic — no ambiguity, no AI call required.

| English Input | Resolves To (Lume AST) |
|---------------|----------------------|
| `get the user's name` | Variable access: `user.name` |
| `show it on the page` | `show` statement |
| `when the button is clicked` | Event listener: `on click` |
| `save this to the database` | `store` operation |
| `ask the AI to summarize this` | `ask` keyword call |
| `repeat this 5 times` | `for` loop, count: 5 |
| `if the user is logged in` | Conditional: `if user.authenticated` |
| `get data from [url]` | `fetch` operation |
| `create a new user with name and email` | Object creation with fields |
| `sort the list by date` | Array sort operation |
| `send an email to [address]` | `generate` + send operation |
| `wait 3 seconds` | `delay(3000)` |
| `connect to the database` | Database connection setup |
| `log the error` | `show` to error stream |

Build this as a growing pattern library. Start with 50-100 common patterns. The patterns should support variable slots (indicated by brackets or context). This layer handles the simple, common operations instantly without any external calls.

**Layer B: AI-Powered Resolution (for complex/ambiguous input)**

When a sentence doesn't match any pattern, pass it to an LLM with the current project context. The AI resolves the intent and returns a Lume AST node.

**What the AI receives:**
1. The English sentence
2. The current project's data model (what variables, types, and structures exist)
3. The current scope (what's available — functions, imports, UI elements)
4. The target context (is this a server file? a UI component? a data operation?)

**What the AI returns:**
A structured Lume AST node — NOT JavaScript. The AI maps English to Lume's existing AST format. The transpiler handles the rest.

**Example flow:**
```
Input:    "get all users who signed up this month and show their names in a list"
Context:  { dataModel: { users: { fields: [name, email, signupDate] } }, scope: "ui-component" }
AI Output: [
  { type: "query", target: "users", filter: { field: "signupDate", op: ">=", value: "startOfMonth()" } },
  { type: "show", format: "list", field: "name" }
]
→ Transpiler converts to JavaScript as normal
```

### File Format

English Mode files use the `.lume` extension with a mode declaration at the top:

```
mode: english

get the user's name and email from the database
if the name is empty, show "No name provided"
otherwise, show "Hello, {name}" on the page

when the submit button is clicked:
  save the form data to the database
  show "Saved!" for 3 seconds
  then redirect to the dashboard
```

The `mode: english` declaration tells the compiler to route through the Intent Resolver instead of the standard Lexer.

### Context Engine

The Intent Resolver needs to understand what's available in the current project. Build a **Context Engine** that:

1. Scans the project's data models (schemas, types, database tables)
2. Tracks declared variables and their types within the current file
3. Knows the available UI elements (if in a UI context)
4. Knows the available API endpoints (if in a server context)
5. Maintains a "what was just mentioned" short-term memory so pronouns and references resolve correctly (e.g., "show **it**" → refers to the last retrieved value)

The Context Engine feeds into both Layer A (pattern matching uses context to fill variable slots) and Layer B (AI resolution uses context to disambiguate).

### Error Handling

When the compiler can't resolve an English sentence:

1. First, try pattern matching (Layer A)
2. If no match, try AI resolution (Layer B)
3. If AI resolution confidence is below threshold (e.g., < 80%), show the user what it thinks they meant and ask for confirmation
4. If completely unresolvable, show a clear error: `"I couldn't understand: [sentence]. Did you mean: [suggestions]?"`

Never silently guess. If there's ambiguity, surface it.

### CLI Usage

```bash
lume build app.lume                  # Standard Lume compilation (unchanged)
lume build app.lume --mode english   # Force English mode (override file declaration)
lume run app.lume                    # Auto-detects mode from file header
```

### Acceptance Criteria

- [ ] `mode: english` file header is recognized by the compiler
- [ ] Layer A pattern library with 50+ common phrases resolves correctly
- [ ] Layer B AI resolution handles complex multi-step sentences
- [ ] Context Engine scans project data models and populates variable slots
- [ ] Pronoun/reference resolution works ("get the user, then show **their** name")
- [ ] Errors are clear and suggest corrections
- [ ] All existing `.lume` files without a mode declaration compile unchanged

---

## MILESTONE 8: MULTILINGUAL MODE

### What It Is

Extend the Intent Resolver to accept input in any human language. French, Spanish, Mandarin, Arabic, Hindi, Japanese, Portuguese, German — any language the AI model understands.

### How It Works

1. **Auto-detect the input language** — no configuration needed
2. **Resolve intent identically regardless of language** — the same program written in French and English produces the same AST and the same JavaScript output
3. **Support mixed-language files** — a developer can write some lines in English and some in Spanish in the same file. Each line is resolved independently.

### Implementation

**Layer A (Pattern Matching):** Expand the pattern library with translations of each pattern. Start with the top 10 languages by developer population:

1. English
2. Mandarin Chinese (中文)
3. Spanish (Español)
4. Hindi (हिन्दी)
5. French (Français)
6. Portuguese (Português)
7. Arabic (العربية)
8. Japanese (日本語)
9. German (Deutsch)
10. Korean (한국어)

Each pattern gets translated versions. The pattern matcher checks all languages in parallel.

**Example — the same pattern in multiple languages:**

| Language | Input | Resolves To |
|----------|-------|-------------|
| English | `get the user's name` | `user.name` |
| French | `obtenir le nom de l'utilisateur` | `user.name` |
| Spanish | `obtener el nombre del usuario` | `user.name` |
| Mandarin | `获取用户的名字` | `user.name` |
| Arabic | `الحصول على اسم المستخدم` | `user.name` |
| Japanese | `ユーザーの名前を取得する` | `user.name` |

Same AST output. Same JavaScript. The language you write in does not affect the compiled result.

**Layer B (AI Resolution):** Already multilingual — LLMs understand all major languages natively. The AI resolution layer requires no changes for multilingual support. Just ensure the context data (data model, scope) is passed in a language-neutral format (field names stay as defined in the project, regardless of what language the instructions are written in).

### File Format

```
mode: natural

obtener todos los usuarios registrados este mes
mostrar sus nombres en una lista

when the delete button is clicked:
  supprimer l'utilisateur sélectionné
  afficher "Utilisateur supprimé" pendant 3 secondes
```

The `mode: natural` declaration enables multilingual mode. `mode: english` restricts to English only (faster pattern matching). Standard `.lume` files without a mode declaration use the existing Lume syntax (unchanged, fully backward compatible).

### Error Messages

Error messages should be returned in the same language the user is writing in. If the input is French, errors are in French. If mixed, default to the language used most in the file.

### Acceptance Criteria

- [ ] `mode: natural` file header enables multilingual input
- [ ] Auto-detection of input language per line (no manual config)
- [ ] Pattern library covers top 10 languages with 50+ patterns each
- [ ] Mixed-language files compile correctly
- [ ] Error messages output in the detected language
- [ ] Identical AST/JS output regardless of input language

---

## MILESTONE 9: VOICE-TO-CODE

### What It Is

Spoken language as compiler input. A developer speaks into a microphone, the speech is transcribed, and the transcription is fed directly into the Intent Resolver from Milestones 7-8. The compiled output is working JavaScript.

### How It Works

```
Voice Input → Speech-to-Text (Whisper / browser API) → Intent Resolver → Lume AST → Transpiler → JavaScript
```

The hard part (understanding what the words mean) is already solved by the Intent Resolver. This milestone adds a transcription front-end.

### Implementation

**Option A: Browser-Based (for the playground / IDE)**
- Use the Web Speech API (`SpeechRecognition`) for real-time transcription in the browser
- A microphone button in the Lume playground/IDE that toggles dictation mode
- Transcribed text appears in the editor in real-time as the user speaks
- User can edit the transcription before compiling, or compile on the fly

**Option B: CLI-Based**
- `lume listen` command starts a microphone session
- Uses OpenAI Whisper (local or API) for high-accuracy transcription
- Transcribed text is saved to a `.lume` file with `mode: natural` header
- User reviews the file and runs `lume build` as normal

**Option C: Mobile (future — ties into React Native ecosystem app)**
- Tap-to-speak interface
- Dictate an entire program while walking
- Review and compile from phone

### Voice-Specific Handling

Speech introduces challenges that typed text doesn't have:

1. **Punctuation** — speech doesn't naturally include colons, brackets, or indentation. The Intent Resolver should infer structure from verbal cues like "when," "if," "then," "next," "inside that," "end," "that's it"
2. **Corrections** — "no wait, I meant..." or "scratch that" should undo the last transcribed line
3. **Pauses** — a long pause (2+ seconds) could indicate a new logical block (like a paragraph break)
4. **Numbers vs words** — "five" and "5" should resolve identically
5. **Variable naming** — when the user says "call it user count," the system creates a variable named `userCount`

### Multilingual Voice

Because Milestone 8 already supports multilingual text, voice input in any language works automatically. Whisper supports 99 languages. A developer in Tokyo speaks Japanese, it transcribes to Japanese text, and the Intent Resolver compiles it.

### Acceptance Criteria

- [ ] Browser-based microphone input works in the Lume playground
- [ ] CLI `lume listen` command starts voice capture and produces a `.lume` file
- [ ] Verbal structural cues ("when," "if," "then") resolve to correct AST structure
- [ ] "Scratch that" / "undo" removes the last transcribed line
- [ ] Pause detection separates logical blocks
- [ ] Voice input in non-English languages produces correct output via Milestone 8

---

## MILESTONE 10: VISUAL CONTEXT AWARENESS

### What It Is

Extend the Context Engine to understand visual layout and UI state. The compiler can resolve spatial and visual references in natural language — "put the form in the center," "make the header blue," "add a sidebar on the left."

### How It Works

The Context Engine (from Milestone 7) already tracks data models and variables. This milestone adds:

1. **UI Element Registry** — the compiler maintains a map of all UI elements in the current project (buttons, forms, headers, lists, modals, etc.) with their positions, styles, and relationships
2. **Spatial Resolution** — phrases like "on the left," "below the header," "next to the search bar" resolve to CSS/layout properties
3. **Style Resolution** — "make it bigger," "change the color to blue," "add some spacing" resolve to specific style changes relative to the current state
4. **Component Awareness** — "add a login form" generates a complete component (input fields, submit button, validation) based on common patterns

### Implementation

**UI Element Registry:**
```
Scans existing project files → builds a map:
{
  elements: [
    { id: "header", type: "nav", position: "top", children: ["logo", "nav-links", "login-button"] },
    { id: "main-content", type: "section", position: "center", children: [] },
    { id: "footer", type: "footer", position: "bottom", children: ["copyright", "links"] }
  ]
}
```

**Natural Language → Layout:**

| Input | Resolves To |
|-------|-------------|
| `put the form in the center of the page` | `display: flex; justify-content: center; align-items: center` on parent container |
| `add a sidebar on the left` | CSS Grid or Flexbox layout with sidebar column |
| `make the header sticky` | `position: sticky; top: 0` |
| `hide the login button when the user is logged in` | Conditional render based on auth state |
| `add some space between the cards` | `gap` property on parent grid/flex container |
| `make the text bigger` | Increase `font-size` relative to current value |

**Component Generation:**

When the user says "add a login form," the compiler generates a full component based on common patterns:
- Email/username input
- Password input
- Submit button
- Basic validation
- Error message display
- Connection to the project's auth system (if one exists in the Context Engine)

This isn't template-based — the Context Engine looks at the current project and generates a component that fits. If the project uses a specific design system, the generated component uses those styles.

### Integration with TrustGen 3D

For projects using TrustGen/Three.js/React Three Fiber, the Visual Context extends to 3D space:

| Input | Resolves To |
|-------|-------------|
| `place the building next to the river` | 3D position calculation relative to existing meshes |
| `make the sky darker` | Environment lighting adjustment |
| `rotate the camera to face the entrance` | Camera transform with lookAt |
| `add trees along the road` | Instanced mesh generation along a path |

### Acceptance Criteria

- [ ] UI Element Registry scans project and maps all visual elements
- [ ] Spatial terms ("left," "center," "above," "below") resolve to correct CSS
- [ ] Style modifications ("bigger," "blue," "more spacing") are relative to current state
- [ ] "Add a [component]" generates contextually appropriate full components
- [ ] 3D spatial resolution works for TrustGen/Three.js projects
- [ ] Changes are non-destructive — existing layout is preserved unless explicitly changed

---

## MILESTONE 11: REVERSE MODE (CODE-TO-LANGUAGE)

### What It Is

Flip the pipeline. Instead of human language → code, take existing code and explain it in plain human language. Any JavaScript, TypeScript, or Lume file can be translated into a natural language explanation in whatever language the user speaks.

### How It Works

```
JavaScript/Lume Source → AST Analysis → Explanation Generator → Plain Language Output
```

### Implementation

**Two output modes:**

**Mode A: Line-by-line annotation**
```
Input (JavaScript):
  const users = await db.query("SELECT * FROM users WHERE active = true");
  const names = users.map(u => u.name);
  console.log(names.join(", "));

Output (English):
  Line 1: Get all active users from the database
  Line 2: Extract just their names into a list
  Line 3: Show all the names separated by commas

Output (Spanish):
  Línea 1: Obtener todos los usuarios activos de la base de datos
  Línea 2: Extraer solo sus nombres en una lista
  Línea 3: Mostrar todos los nombres separados por comas
```

**Mode B: Summary explanation**
```
Input: [entire file]
Output: "This file connects to the database, gets all active users, and displays
         their names as a comma-separated list. It runs when the page loads."
```

### CLI Usage

```bash
lume explain app.js                    # Explain in English (default)
lume explain app.js --lang french      # Explain in French
lume explain app.js --lang japanese    # Explain in Japanese
lume explain app.js --mode summary     # Summary instead of line-by-line
lume explain app.js --mode annotate    # Line-by-line annotations (default)
```

### Use Cases

1. **Learning** — students read code explanations in their native language
2. **Onboarding** — new developers on a project get plain-language explanations of what each file does
3. **Documentation** — auto-generate documentation in any language from the code itself
4. **Code review** — explain what changed in a pull request in plain language
5. **Accessibility** — combined with text-to-speech, code can be *read aloud* as an explanation

### Academy Integration

This transforms Lume Academy instantly. Every code example can be explained in any language. A student in Brazil clicks "Explain in Portuguese" and the code block gets a line-by-line annotation. No translation of course content needed — the code explains itself.

### Acceptance Criteria

- [ ] `lume explain` command produces accurate line-by-line annotations
- [ ] Summary mode produces a coherent paragraph-level explanation
- [ ] Output language follows `--lang` flag or auto-detects from user locale
- [ ] Works on JavaScript, TypeScript, and Lume files
- [ ] Handles complex patterns (async/await, closures, higher-order functions)
- [ ] Explanations are accurate and use everyday language, not jargon

---

## MILESTONE 12: COLLABORATIVE INTENT (MULTI-DEVELOPER, MULTI-LANGUAGE)

### What It Is

Multiple developers write in different human languages on the same project. The compiler merges their contributions at the AST level, which is language-neutral. No merge conflicts caused by language differences.

### How It Works

Because the AST is the same regardless of input language (established in Milestone 8), version control operates on the AST, not on the raw text. Two developers can edit the same logical block — one in English, one in Japanese — and the merge happens at the intent level.

### Implementation

**AST-Level Diffing:**
- Instead of line-by-line text diffs (like Git does today), Lume's version control diffs the AST
- Two changes to the same AST node = actual conflict (requires resolution)
- Two changes to different AST nodes = clean merge (even if the text lines overlap)

**Language-Tagged Source:**
Each line in the source file carries metadata about which language it was written in:
```
mode: natural

# Written by: developer-a (English)
get all active users from the database

# Written by: developer-b (Japanese)
アクティブなユーザーの名前を表示する
```

Both lines produce AST nodes. The compiler doesn't care about the language tags — they're metadata for the developers. The AST diff engine resolves merges.

**Lume Sync Protocol:**
For real-time collaboration (like Google Docs for code):
- Each developer's editor sends intent operations to a central server
- Intent operations are language-neutral AST transformations
- The server merges operations using operational transformation (OT) or CRDTs
- Each developer sees the code in their own language (the server translates the shared AST back to each developer's preferred language)

### Visual Example

Developer A (Dallas, English) and Developer B (Tokyo, Japanese) are working on the same file simultaneously:

**What Developer A sees:**
```
mode: natural
get all active users from the database
show their names in a list
when a name is clicked, show that user's profile
```

**What Developer B sees (same file, same AST, different language):**
```
mode: natural
データベースからすべてのアクティブユーザーを取得する
名前をリストに表示する
名前がクリックされたら、そのユーザーのプロファイルを表示する
```

**What gets compiled (identical for both):**
```javascript
const users = await db.query("SELECT * FROM users WHERE active = true");
renderList(users.map(u => u.name), {
  onClick: (user) => showProfile(user)
});
```

### Acceptance Criteria

- [ ] AST-level diffing produces cleaner merges than text-level diffing
- [ ] Two developers in different languages can edit the same file without language-based conflicts
- [ ] Each developer can view the shared codebase rendered in their preferred language
- [ ] Real-time collaboration syncs intent operations, not text
- [ ] Merge conflicts only occur when two developers modify the same logical operation

---

## MILESTONE 13: ZERO-DEPENDENCY RUNTIME

### What It Is

The ultimate goal: Lume programs written in natural language compile to standalone executables that run without Node.js, without a browser, without any external runtime. One file in, one executable out. Write in English (or any language), get a program that runs anywhere.

### How It Works

```
Natural Language → Intent Resolver → Lume AST → Transpiler → JavaScript → Bundler → Standalone Executable
```

The addition is the final two stages:
1. **Bundler** — tree-shakes and bundles all JavaScript output into a single file with zero imports
2. **Executable Compiler** — compiles the bundled JS into a native binary using a tool like Bun's `bun build --compile`, Deno's `deno compile`, or a custom V8 snapshot

### Implementation

**Stage 1: Single-file JavaScript output**
- The transpiler already outputs JavaScript
- Add a bundler pass that resolves all imports, inlines dependencies, and produces one self-contained `.js` file
- This file can run with `node app.bundle.js` — but still requires Node.js

**Stage 2: Standalone binary**
- Use one of these approaches to produce a native executable:
  - **Bun compile** — `bun build --compile app.bundle.js --outfile app` → produces a single binary
  - **Deno compile** — `deno compile app.bundle.js` → cross-platform binary
  - **pkg** — `pkg app.bundle.js` → Node.js executable wrapper
  - **Custom V8 snapshot** — embed V8 engine + bundled code into a single binary (most independent, most work)
- Output: a single file (`app` on Linux/Mac, `app.exe` on Windows) that runs without any runtime installed

**Stage 3: Cross-compilation**
- `lume build app.lume --target linux` → Linux binary
- `lume build app.lume --target macos` → macOS binary
- `lume build app.lume --target windows` → Windows .exe
- `lume build app.lume --target wasm` → WebAssembly (runs in any browser without a server)

### CLI Usage

```bash
lume build app.lume                         # Standard JS output (unchanged)
lume build app.lume --bundle                # Single-file JS (no external imports)
lume build app.lume --compile               # Standalone binary for current OS
lume build app.lume --compile --target linux # Cross-compile for Linux
lume build app.lume --compile --target wasm  # WebAssembly output
```

### What This Means

Someone writes a program in plain French on their Mac. They run `lume build --compile --target windows` and hand the resulting `.exe` to a Windows user who has never heard of Lume, Node.js, or JavaScript. The program just runs. No installation, no runtime, no dependencies.

This is the full circle:
- **Milestone 7:** Write code in English
- **Milestone 8:** Write code in any language
- **Milestone 9:** Speak code
- **Milestone 10:** Describe what you see
- **Milestone 11:** Code explains itself
- **Milestone 12:** Collaborate across languages
- **Milestone 13:** Ship without dependencies

From thought to working software, in any language, for any platform, with nothing installed.

---

## WHAT NONE OF THIS CHANGES

- The existing Lume syntax (`let`, `ask`, `show`, `think`, etc.) is fully preserved and unchanged
- Standard `.lume` files without a mode declaration compile exactly as they do today
- The Transpiler is untouched — it still receives the same AST format and outputs the same JavaScript
- The self-sustaining features (monitor, heal, optimize, evolve, mutate) are untouched
- npm package structure is unchanged — all milestones are additive features
- Backward compatibility is absolute — nothing breaks

---

## PRIORITY / BUILD ORDER

| Order | Milestone | Dependency | Effort |
|-------|-----------|------------|--------|
| 1st | **M7: English Mode (Layer A only)** | None | Pattern library + Intent Resolver scaffold |
| 2nd | **M7: English Mode (Layer B)** | M7-A | AI integration for complex sentences |
| 3rd | **M8: Multilingual Mode** | M7 | Expand pattern library + auto-detect language |
| 4th | **M9: Voice-to-Code** | M8 | Whisper/Web Speech API front-end |
| 5th | **M11: Reverse Mode** | M7 | AST → explanation generator |
| 6th | **M10: Visual Context** | M7 | UI Element Registry + spatial resolution |
| 7th | **M13: Zero-Dependency Runtime** | M7 | Bundler + binary compilation |
| 8th | **M12: Collaborative Intent** | M8 | AST diffing + real-time sync protocol |

M9 and M11 are the quickest wins after M7-M8 because they reuse the same pipeline in different directions. M10 and M12 are the most architecturally complex. M13 is independent of the natural language features — it can be worked on in parallel.

---

## WHAT SUCCESS LOOKS LIKE

A developer opens a `.lume` file, writes `mode: natural` at the top, and writes their program in plain French. They run `lume build --compile` and get a standalone executable. They hand it to someone who has never coded, on any operating system, and it runs.

A classroom in Mumbai teaches programming in Hindi. A team in São Paulo collaborates in Portuguese with a partner in Berlin writing in German. A solo founder in Dallas speaks their app into existence while driving.

No syntax to memorize. No English requirement. No runtime to install. No language barrier.

That's Lume.

---

## ACADEMY UPDATES NEEDED

Once milestones are implemented, the Lume Academy (on dwtl.io and academy.tlid.io) will need:

1. New track: "Natural Language Programming with Lume" (covers M7-M8)
2. Updated playground to support `mode: english` and `mode: natural` headers
3. Example programs written in multiple languages showing identical output
4. Voice input demo in the playground (M9)
5. "Explain This Code" button on every code example, with language selector (M11)
6. Documentation of the pattern library (all supported phrases, all languages)
7. Certification: **Certified Lume Natural Language Developer (CNLD)**

Trust Layer will handle the Academy content updates. The Lume agent just needs to expose the compiler functionality.

---

## CONTACT

- **Ecosystem owner:** Jason (cryptocreeper94@gmail.com)
- **Trust Layer DB user_id:** 49057269
- **Launch date:** August 23, 2026
- **Lume Academy:** /academy on dwtl.io
- **Lume Language:** lume-lang.org
