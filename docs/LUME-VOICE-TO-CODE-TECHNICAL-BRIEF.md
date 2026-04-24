LUME: VOICE-TO-CODE IN AN AI-NATIVE PROGRAMMING LANGUAGE
COMPLETE TECHNICAL BRIEF FOR ACADEMIC PAPER AUTHORSHIP

================================================================================
1. ABSTRACT SUMMARY
================================================================================

Lume is an AI-native programming language that accepts natural English as valid source code. Unlike all existing programming languages, Lume's compilation pipeline is architected to tolerate imprecise, informal, and ambiguous input — making it the first language where voice-to-code is architecturally natural rather than an external integration. This document provides the full technical specification of the language, the voice-to-code pipeline, the compiler architecture, and the theoretical contributions suitable for academic publication.

================================================================================
2. PROBLEM STATEMENT
================================================================================

2.1 The Syntax Barrier

All mainstream programming languages (Python, JavaScript, Rust, C++, Java, etc.) require exact syntactic conformity. A single missing semicolon, mismatched bracket, or incorrect keyword breaks compilation entirely. This imposes a "cognitive distance" — the mental gap between what a developer intends and what they must type to express that intent in conformant syntax.

2.2 Voice Input is Structurally Incompatible with Traditional Languages

Speech-to-text engines produce imperfect transcriptions characterized by:
- Homophones — "write" vs "right", "for" vs "four"
- Filler words — "um", "uh", "like", "you know"
- Run-on sentences — no punctuation or line breaks in continuous speech
- Stuttering/repetition — "get get the name"
- Spoken punctuation — "period" instead of "."
- Informal phrasing — "grab the user's name" instead of getUserName()

No traditional compiler can process any of these. Prior voice-to-code systems (e.g., Talon, Serenade, GitHub Copilot Voice) work by mapping voice commands to IDE actions or code templates — they are editor integrations, not compiler features. The compiler itself never sees voice input.

2.3 The Thesis

If a programming language is designed from the ground up to accept imprecise natural language as valid source code, then voice-to-code becomes a natural extension of the existing compilation pipeline rather than an external bolt-on. Lume is that language.

================================================================================
3. LANGUAGE DESIGN
================================================================================

3.1 Dual-Mode Compilation

Lume supports two input modes:

Standard Mode — Traditional programming syntax:

    let name = "World"
    show "Hello, {name}!"

    to greet(person)
      show "Hello, {person}!"
    end

English Mode — Natural English as source code:

    mode: english

    get the user's name from the database
    show it on the screen
    if the name is empty
      show "Please enter your name"
    save the result to the profile

The mode is detected automatically by the first line of the file. Both modes produce identical AST representations and compile to the same JavaScript output.

3.2 English Mode Syntax

English Mode has no formal grammar in the traditional sense (no BNF, no CFG). Instead, it uses a pattern library of 34+ regex-based patterns that map natural English phrases to Abstract Syntax Tree (AST) node types:

    Pattern Category    | Example Input              | AST Node
    --------------------|----------------------------|------------------------------------------
    Variable Access     | "get the user's name"      | VariableAccess { target: "user_name" }
    Show/Display        | "show it on the screen"    | ShowStatement { value: "it", target: "screen" }
    Create              | "create a new task"        | CreateOperation { target: "task" }
    Delete              | "delete the old records"   | DeleteOperation { target: "old_records" }
    Update              | "update the price to 50"   | UpdateOperation { target: "price", value: "50" }
    Store/Save          | "save the data to disk"    | StoreOperation { value: "data", target: "disk" }
    Conditional         | "if the count is zero"     | IfStatement { condition: "count is zero" }
    Loop                | "for each item in the cart"| ForEachLoop { item: "item", collection: "cart" }
    Math                | "add 10 to the total"      | BinaryExpression { op: "+", left: "total", right: "10" }
    AI Call             | "ask the AI to summarize"  | AskExpression { prompt: "summarize" }

The pattern library handles article stripping ("the", "a", "an"), pronoun resolution ("it", "that"), possessive normalization ("user's" to "user"), and slug conversion (multi-word names to snake_case identifiers).

3.3 The Tolerance Chain (7-Layer Fallback)

When a line of English input doesn't match any pattern directly, it passes through a 7-layer resolution chain:

1. Exact Pattern Match — Direct regex match from the 34-pattern library
2. Fuzzy Pattern Match — Levenshtein distance <= 2 from a known pattern
3. Auto-Correct — Spelling correction using a domain-specific dictionary of ~500 programming terms
4. Context Engine — Uses surrounding lines to disambiguate (pronoun resolution, type inference)
5. Temporal Resolver — Resolves time-relative references ("the previous result", "the last item")
6. i18n Pattern Library — Multilingual pattern matching (Spanish, French, German, Japanese, etc.)
7. AI Resolver (Layer B) — Falls back to an LLM (GPT-4o-mini) for intent classification when all deterministic layers fail

Each layer reports a confidence score (0.0–1.0). The first layer to exceed the confidence threshold (default 0.85) produces the AST node. This is logged for deterministic reproducibility via compile-lock files.

================================================================================
4. VOICE-TO-CODE ARCHITECTURE
================================================================================

4.1 Pipeline Extension (Not Replacement)

The voice pipeline adds two preprocessing stages before the existing compilation pipeline. Nothing after the "Text Input" stage changes:

    Standard text pipeline:
      Text Input -> Auto-Correct -> Intent Resolver (Tolerance Chain) -> Security Check -> AST -> Transpiler -> JavaScript

    Voice pipeline:
      Audio -> Speech-to-Text Engine -> Transcription Cleanup -> Text Input -> [same as above]

This is the key architectural contribution: voice-to-code requires zero changes to the compiler core. The Transcription Cleanup Layer produces output that is indistinguishable from typed text by the time it reaches the Intent Resolver.

4.2 Transcription Cleanup Layer

The Transcription Cleanup Layer is a 7-step pipeline that normalizes speech-to-text artifacts:

Step 1: Stutter/Repeat Collapse
  - Input: "get get the users name"
  - Output: "get the users name"
  - Algorithm: Regex \b(\w+)(\s+\1)+\b replaced with $1

Step 2: Spoken Punctuation Conversion
  - 12 patterns: "period" becomes ".", "new line" becomes line break, "comma" becomes ",", "question mark" becomes "?", "exclamation mark" becomes "!", "colon" becomes ":", "semicolon" becomes ";", "open paren" becomes "(", "close paren" becomes ")", "open quote" becomes double-quote, "close quote" becomes double-quote, "quote" becomes double-quote
  - Post-processing: removes whitespace before punctuation ("data ." becomes "data.")

Step 3: Filler Word Stripping
  - 20 filler words/phrases: um, uh, like, you know, basically, so, well, right, okay, ok, let me think, hmm, er, ah, actually, i guess, sort of, kind of, honestly, literally
  - Multi-word fillers stripped first (greedy), then single-word
  - Preserves word when it has syntactic meaning (not just verbal padding)

Step 4: Context-Aware Homophone Resolution
  - 10 homophone pairs with context rules:

    Pair                       | Context -> Resolution
    ---------------------------|--------------------------------------------------
    write / right              | file/data/save -> "write"; direction/correct -> "right"
    new / knew                 | create/build/make -> "new"; past/before -> "knew"
    for / four                 | each/loop/iterate -> "for"; number/count -> "four"
    their / there / they're    | name/email/profile -> "their"; is/exists -> "there"
    two / to / too             | number/count -> "two"; much/also -> "too"; default -> "to"
    no / know                  | not/never/stop -> "no"; if/check/determine -> "know"
    by / buy                   | sort/filter/group -> "by"; purchase/cart -> "buy"
    sea / see                  | ocean/water -> "sea"; show/display/check -> "see"
    mail / male                | email/send/message -> "mail"; gender -> "male"
    wait / weight              | second/pause/delay -> "wait"; heavy/measure -> "weight"

  - Resolution algorithm: scan the full instruction for context keywords. First matching context rule determines the chosen word. If no context matches, fall back to a default (the more common programming-domain word).

Step 5: Number Word Conversion
  - Cardinal numbers: zero through ninety, plus hundred, thousand, million
  - Compound numbers: "twenty three" becomes 23 (tens + ones)
  - Informal quantities: "a couple" becomes 2, "a few" becomes 3, "several" becomes 5, "a dozen" becomes 12

Step 6: Variable Name Extraction
  - Detects spoken naming patterns: "call it user count", "name it total price", "store it as final result"
  - Converts to camelCase: "user count" becomes userCount, "total price" becomes totalPrice
  - 6 detection patterns covering call/name/store/save/put naming idioms

Step 7: Structural Cue Parsing
  - Block-starting cues: "when", "if", "for each", "for every", "repeat", "while", "inside that"
  - Block-ending cues: "end", "that's it", "done", "finished", "stop", "close"
  - Sequential cues: "then", "next", "after that", "once that's done", "and then"
  - Produces indent/dedent markers for the final .lume file

4.3 Run-On Sentence Splitting

Voice input has no line breaks. The splitter detects instruction boundaries using two methods:

Method A: Conjunction Splitting
  Splits on: "and then", "and also", "after that", "then", "next", "also"

Method B: Action Verb Detection
  40 action verbs are recognized: get, fetch, show, display, create, make, build, save, store, delete, remove, send, update, set, add, sort, filter, find, load, read, write, push, pull, check, validate, toggle, reset, swap, return, throw, navigate, redirect, log, print, render, insert, append, modify, patch, increment, decrement, repeat, monitor, track, alert, notify, try.

  When a new action verb appears after an established first instruction (>=2 words accumulated), the splitter creates a new instruction boundary.

  Example: "get the users name from the database and then show it on the screen" becomes ["get the users name from the database", "show it on the screen"]

4.4 Verbal Correction Handling

During interactive voice sessions, developers can correct mistakes using natural speech:

    Correction Phrase          | Action
    ---------------------------|--------------------------------------------
    "scratch that"             | Undo last instruction
    "no, I mean..."            | Replace last instruction with what follows
    "actually, make that..."   | Replace last instruction
    "wait,"                    | Replace last instruction
    "sorry,"                   | Replace last instruction
    "I meant..."               | Replace last instruction
    "not that,"                | Replace last instruction
    "correction:"              | Replace last instruction
    "no, wait"                 | Replace last instruction

================================================================================
5. CLI INTERFACE
================================================================================

5.1 lume voice — Interactive Voice Coding

    $ lume voice
      ✦ Lume Voice — Interactive Voice-to-Code
      Engine: system · Language: en-US
      Mode: Batch (compile at end)

      1> get all the users from the database
      [transcribed] get all the users from the database ✓
      2> filter the ones who signed up this month
      [transcribed] filter the ones who signed up this month ✓
      3> show their names and email addresses
      [transcribed] show their names and email addresses ✓
      4> compile

      ✦ 3 instructions captured. Compiling...
      ✓ Saved voice-session-001.lume
      ✓ Compiled -> voice-session-001.js

5.2 CLI Flags

    Flag                  | Description
    ----------------------|----------------------------------------------------
    --live                | Compile each instruction immediately after transcription
    --review              | Display all instructions for review/editing before compiling
    --output <file>       | Save transcription to named .lume file
    --engine whisper      | Use OpenAI Whisper API (higher accuracy, requires API key)

5.3 Session Voice Commands

    Command                                           | Action
    --------------------------------------------------|-----------------------------
    compile / done / compile that / build it / run it  | End session, compile
    undo / delete last / scratch that                  | Remove last instruction
    delete line N                                      | Remove specific instruction
    start over / clear / reset                         | Clear all instructions
    read it back / what do I have                      | List all captured instructions
    pause / hold on / stop listening                   | Pause recording
    continue / resume / keep going                     | Resume recording

5.4 Voice Configuration File (.lume/voice-config.json)

    {
      "voice": {
        "enabled": true,
        "engine": "system",
        "language": "en-US",
        "pause_threshold_ms": 1500,
        "filler_words": ["um", "uh", "like", "you know", "basically", "actually"],
        "compile_commands": ["compile", "compile that", "done", "build it", "run it"],
        "cancel_commands": ["start over", "clear", "reset"],
        "undo_commands": ["delete last", "undo", "scratch that", "remove last"],
        "readback_commands": ["read it back", "read back", "what do I have"],
        "pause_commands": ["pause", "hold on", "stop listening"],
        "resume_commands": ["continue", "resume", "keep going"]
      }
    }

================================================================================
6. WEB PLAYGROUND INTEGRATION
================================================================================

The Lume web playground (/playground) includes a browser-based microphone button using the Web Speech API (SpeechRecognition / webkitSpeechRecognition).

Implementation:
  - continuous: true — keeps listening until stopped
  - interimResults: true — shows real-time transcription during speech
  - Client-side cleanup pipeline runs on each final transcript (stutter collapse, filler stripping, spoken punctuation, auto-insert into editor)
  - No server roundtrip required — transcription and cleanup happen entirely in-browser
  - Visual feedback: pulsing CSS animation on mic button during recording

Sandbox vs Live modes:
  - Sandbox mode — Compiles and executes entirely in-browser using the 34-pattern Pattern Library and a client-side AST executor that simulates 30+ node types
  - Live mode — Sends code to the backend server for full compilation using all 15 milestones, then executes in a sandboxed Node.js VM (3-second timeout, no filesystem access)

================================================================================
7. THEORETICAL CONTRIBUTIONS
================================================================================

7.1 Cognitive Distance Minimization

Traditional programming requires translating intent through multiple abstraction layers:

    Thought -> Algorithm Design -> Syntax Selection -> Typing -> Debug Syntax Errors -> Compile

Lume with voice reduces this to:

    Thought -> Speaking -> Compile

The cognitive distance between "what the developer wants" and "what the compiler receives" approaches zero. This is enabled by the Tolerance Chain absorbing the variability that voice input introduces.

7.2 Deterministic Compilation of Non-Deterministic Input

A fundamental challenge: speech input is non-deterministic (the same phrase may be transcribed differently by different engines, at different times, with different accents). Lume addresses this through:
  - Compile-lock files — Cache the resolution of each line (which layer resolved it, with what confidence), enabling identical recompilation from the same source
  - Security certificates — SHA-256 hash of input + output, proving the compilation chain is unmodified
  - Layer A / Layer B separation — Deterministic pattern matching (Layer A) is preferred; AI resolution (Layer B) is only used as fallback, and its results are cached

7.3 Error Tolerance as a Design Principle

Traditional compilers are designed to reject invalid input. Lume's compiler is designed to accept imperfect input and resolve intent through progressive fallback. This inversion makes the compiler fundamentally compatible with noisy input sources (voice, handwriting OCR, chat messages, informal specification documents).

7.4 Accessibility as Architecture

Voice-to-code is typically framed as a convenience feature. In Lume, it is an architectural consequence:
  - Developers with RSI can code without typing
  - Developers with mobility impairments can code with voice alone
  - Developers who think better verbally can speak their logic naturally
  - No syntax to memorize — natural language is the syntax

================================================================================
8. IMPLEMENTATION METRICS
================================================================================

    Component                    | Lines of Code | File
    -----------------------------|---------------|--------------------------------------
    Voice Input Processor        | 549           | src/intent-resolver/voice-input.js
    Voice Config Loader          | 70            | src/intent-resolver/voice-config.js
    CLI Voice Command            | 190           | bin/lume.js (within 1,020-line CLI)
    Playground Mic Integration   | 65            | website/src/pages/PlaygroundPage.jsx
    Pattern Library              | 34 patterns   | src/intent-resolver/pattern-library.js
    Intent Resolver (full)       | ~1,200        | src/intent-resolver/index.js + sub-modules
    Auto-Correct Layer           | ~300          | src/intent-resolver/auto-correct.js
    Fuzzy Matcher                | ~200          | src/intent-resolver/fuzzy-matcher.js
    Lexer                        | ~400          | src/lexer.js
    Parser                       | ~800          | src/parser.js
    Transpiler                   | ~821          | src/transpiler.js
    Total compiler               | ~12,000+      | All source files

    Metric                       | Value
    -----------------------------|-------
    Compiler milestones          | 15
    Test suite                   | 552+ tests
    Pattern Library patterns     | 34+
    Homophone pairs              | 10
    Filler words                 | 20
    Spoken punctuation patterns  | 12
    Action verbs (splitter)      | 40
    Correction phrase triggers   | 9
    Number word mappings         | 30+
    Voice commands               | 17

================================================================================
9. RELATED WORK AND DIFFERENTIATION
================================================================================

    System                   | Approach                                  | Lume Difference
    -------------------------|-------------------------------------------|----------------------------------------------
    Talon                    | Voice commands mapped to IDE actions       | Lume compiles voice at the language level, not the IDE level
    Serenade                 | Voice-to-code templates for Python/JS     | Lume uses intent resolution, not templates — handles arbitrary phrasing
    GitHub Copilot Voice     | LLM-generated code from voice             | Lume uses deterministic pattern matching first (Layer A), LLM only as fallback (Layer B)
    Apple Dictation / Dragon | General dictation into text editor         | No programming-domain awareness; Lume's cleanup layer is programming-specific
    Scratch / Blockly        | Visual programming for beginners          | Block-based, not voice-based; limited to simple programs
    NLP compilers (research) | NL to code via LLM                        | Non-deterministic, no security guarantees; Lume provides compile-lock + certificates

Lume's differentiation: voice-to-code is a compiler feature, not an IDE plugin. The compiler itself is designed to accept imprecise input. No prior work integrates voice input at the compiler pipeline level with deterministic reproducibility guarantees.

================================================================================
10. SUGGESTED PAPER STRUCTURE
================================================================================

1. Introduction — The syntax barrier; cognitive distance; why voice fails with traditional languages
2. Background — Speech-to-text state of the art; prior voice coding tools; natural language programming research
3. Language Design — Lume dual-mode compilation; English Mode pattern library; the Tolerance Chain
4. Voice-to-Code Architecture — Transcription Cleanup Layer (7 steps); run-on splitting; homophone resolution; verbal corrections
5. Implementation — CLI (lume voice); Web Speech API integration; compile-lock determinism
6. Evaluation — Pattern recognition accuracy on transcribed speech vs typed input; cognitive distance measurements; accessibility case studies
7. Discussion — Limitations (accent variation, domain-specific jargon, ambiguity); future work (streaming compilation, multi-speaker)
8. Conclusion — Voice-to-code as architectural consequence, not bolt-on feature

================================================================================
11. KEY CLAIMS FOR THE PAPER
================================================================================

1. Lume is the first programming language where voice-to-code is architecturally native — not an IDE extension, but a compiler pipeline feature.

2. The Transcription Cleanup Layer + Tolerance Chain together absorb all speech-to-text noise — homophones, fillers, run-ons, stuttering, spoken punctuation — producing clean AST nodes identical to those from typed input.

3. Deterministic reproducibility is maintained despite non-deterministic voice input, via compile-lock caching and Layer A/B separation.

4. The same error tolerance that enables English Mode also enables voice input — these are not separate features but the same architectural principle applied to different input sources.

5. Cognitive distance between developer intent and compiled output approaches zero when combining natural language syntax with voice input.

================================================================================
12. REPOSITORY AND DEPLOYMENT
================================================================================

Source: github.com/cryptocreeper94-sudo/lume
Language: JavaScript (Node.js)
Backend: Express.js + PostgreSQL on Render
Frontend: React (Vite) on Vercel
Live API: https://lume-api-m8o0.onrender.com
Version: 0.8.0
License: Open source
