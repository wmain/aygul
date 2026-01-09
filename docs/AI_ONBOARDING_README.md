# AI Onboarding Documentation

This directory contains documentation designed to help AI coding assistants (Cursor, Claude Code, ChatGPT, etc.) understand and work with this codebase effectively.

## Documentation Files

| File | Purpose | When AI Reads It |
|------|---------|------------------|
| `PROJECT_BRIEF.md` | Business context, vision, features | Understanding what we're building |
| `CLAUDE.md` | Technical conventions, patterns, DO NOTs | Every coding task |
| `docs/MIGRATION_PLAN.md` | Supabase/R2 migration details | Infrastructure changes |
| `.cursor/rules/expo-patterns.mdc` | Expo-specific patterns | React Native development |

---

## Using with Cursor

### Automatic Context

Cursor automatically reads:
- `CLAUDE.md` (if present in root)
- `.cursor/rules/*.mdc` files

These files are injected into every conversation, so the AI knows your conventions.

### Best Practices

1. **Start with context**: When asking about features, reference `PROJECT_BRIEF.md`
2. **For migrations**: Reference `docs/MIGRATION_PLAN.md`
3. **For patterns**: The `.cursor/rules/expo-patterns.mdc` is auto-loaded

### Example Prompts

```
# Good - AI understands context
"Add a new section type called 'pronunciation' following the patterns in CLAUDE.md"

# Good - specific reference
"Implement the Supabase auth flow from docs/MIGRATION_PLAN.md"

# Less effective - no context
"Add auth to the app"
```

---

## Using with Claude Code

### Automatic Context

Claude Code automatically reads `CLAUDE.md` from the project root. This file contains:
- Project overview
- Technical stack
- Coding conventions
- Common mistakes to avoid
- File structure

### Best Practices

1. **Trust CLAUDE.md**: Claude Code will follow these conventions automatically
2. **Reference specific files**: "Look at `src/lib/types.ts` for the domain model"
3. **Use todos**: Claude Code tracks tasks well when you list requirements

### Example Session

```
User: Add a new lesson format called "shadowing"

Claude Code:
- Reads CLAUDE.md (automatic)
- Checks src/lib/types.ts for LessonFormat type
- Adds 'shadowing' to the type
- Updates LESSON_FORMATS array
- Updates LESSON_SEGMENT_CONFIGS
- Follows existing patterns
```

---

## Using with ChatGPT / GPT-4

### Manual Context Required

ChatGPT doesn't auto-read files, so you need to provide context:

1. **Copy relevant sections** from `CLAUDE.md` into your prompt
2. **Or use the GPT API** with file attachments

### Recommended Prompt Template

```markdown
# Context
[Paste relevant section from CLAUDE.md]

# Current Code
[Paste relevant file contents]

# Task
[Your request]

# Constraints
- Follow the patterns shown in the context
- Use TypeScript strict mode
- Use NativeWind for styling
- Use Zustand with selectors
```

---

## Key Documentation Sections

### From CLAUDE.md

**Most Important:**
- Section-Based Caching (core architecture)
- Technical Guidelines (conventions)
- Common Mistakes to Avoid

**Reference When:**
- Adding new section types
- Modifying audio generation
- Working with state management

### From PROJECT_BRIEF.md

**Most Important:**
- Core Script Architecture
- Key Features (Lesson Builder, Player)
- Current Status

**Reference When:**
- Planning new features
- Understanding business requirements
- Prioritizing work

### From MIGRATION_PLAN.md

**Most Important:**
- Supabase Schema SQL
- R2 URL Structure
- Client Setup Code

**Reference When:**
- Setting up Supabase locally
- Implementing new database features
- Configuring storage

---

## Keeping Documentation Updated

### When to Update CLAUDE.md

- New coding patterns established
- New common mistakes discovered
- Tech stack changes
- File structure changes

### When to Update PROJECT_BRIEF.md

- Feature scope changes
- Business model updates
- Sprint focus changes
- Launch target changes

### When to Update MIGRATION_PLAN.md

- Schema changes
- New migration phases
- Timeline updates
- Cost changes

---

## Quick Reference for AI

### The App in One Sentence

A mobile app that teaches languages through AI-generated audio conversations with synchronized subtitles.

### The Core Innovation

Section-based audio caching: each lesson section (welcome, vocabulary, dialogue, etc.) is cached independently, so ElevenLabs is called once per unique section ever.

### Critical Rule

**NEVER skip the cache lookup and call ElevenLabs directly.**

### Files to Read First

1. `src/lib/types.ts` - Domain model
2. `src/lib/dialogue-store.ts` - State management
3. `src/lib/dialogue-service.ts` - Lesson generation

### Tech Stack Summary

- Expo SDK 53 + React Native
- NativeWind (Tailwind for RN)
- Zustand (client state)
- React Query (server state)
- Supabase (backend)
- Cloudflare R2 (audio storage)
- ElevenLabs (audio generation)

---

## Troubleshooting AI Issues

### AI Suggests npm Instead of bun

Add to prompt: "Use bun, not npm or yarn"

### AI Uses Class Components

Add to prompt: "Use functional components only"

### AI Forgets Cache Pattern

Reference: "Follow the 3-tier caching flow in CLAUDE.md"

### AI Uses Wrong Duration Units

Reference: "Audio durations are in MILLISECONDS (2000+), not seconds"

### AI Puts className on LinearGradient

Reference: "LinearGradient, Animated.*, CameraView need style prop, not className"
