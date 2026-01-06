# Comprehensive Test Plan

## Automated Tests

### Backend Tests
Location: `/app/backend/tests/`

**Run Backend Tests:**
```bash
cd /app/backend
pytest tests/ -v
```

**Test Coverage:**
- ✅ Health endpoint
- ✅ Audio cache stats endpoint
- ✅ Section audio generation
- ✅ Cache hit/miss behavior
- ✅ Legacy TTS endpoint
- ✅ Legacy dialogue endpoint

---

## Manual Testing Checklist

### 1. expo-audio Migration Tests

#### Test 1.1: No Deprecation Warnings
- [ ] Open browser console
- [ ] Navigate to app
- [ ] Check for absence of `[expo-av]` deprecation warnings
- [ ] **Expected**: No console warnings about expo-av

#### Test 1.2: Audio Playback Works
- [ ] Generate any lesson
- [ ] Click play button
- [ ] **Expected**: Audio plays without errors

---

### 2. Bundled Audio Tests (Development Mode)

#### Test 2.1: English Coffee Shop Bundled Audio
- [ ] Ensure `appMode` is set to 'development' in dev settings
- [ ] Select Language: English
- [ ] Select Location: Coffee Shop
- [ ] Click "Generate Lesson"
- [ ] **Expected**:
  - Lesson loads in ~500ms (instant)
  - No API calls to ElevenLabs or OpenAI for audio
  - Audio plays correctly
  - All 7 sections present (Welcome, Vocabulary, Slow, Breakdown, Natural, Quiz, Cultural)

#### Test 2.2: API Fallback for Non-Bundled Lessons
- [ ] Select Language: English
- [ ] Select Location: Restaurant (not bundled)
- [ ] Click "Generate Lesson"
- [ ] **Expected**:
  - Takes 30+ seconds (API generation)
  - Lesson generates successfully
  - Audio plays correctly
  - Falls back to live API gracefully

#### Test 2.3: Different Language Fallback
- [ ] Select Language: Spanish
- [ ] Select Location: Coffee Shop
- [ ] Click "Generate Lesson"
- [ ] **Expected**:
  - Uses live API (not bundled)
  - Lesson generates in Spanish
  - Audio plays correctly

---

### 3. Audio Playback Tests

#### Test 3.1: Basic Playback Controls
- [ ] Generate a lesson
- [ ] Click Play button
- [ ] **Expected**: Audio starts playing, button changes to Pause icon
- [ ] Click Pause button
- [ ] **Expected**: Audio pauses, button changes to Play icon
- [ ] Click Play again
- [ ] **Expected**: Audio resumes from pause point

#### Test 3.2: Line Highlighting
- [ ] Play a lesson
- [ ] Observe text highlighting as audio plays
- [ ] **Expected**:
  - Current line is highlighted/emphasized
  - Highlighting advances as audio progresses
  - Text and audio are synchronized

#### Test 3.3: Replay Functionality
- [ ] Play a lesson partway through
- [ ] Click Replay button (circular arrow)
- [ ] **Expected**:
  - Lesson restarts from beginning
  - Audio plays from start
  - Auto-scroll re-enables

#### Test 3.4: Speed Control
- [ ] Play a lesson
- [ ] Click speed button (1x)
- [ ] **Expected**: Changes to 0.75x
- [ ] Click again
- [ ] **Expected**: Changes to 0.5x
- [ ] Click again
- [ ] **Expected**: Changes back to 1x
- [ ] **Verify**: Audio playback speed adjusts accordingly

#### Test 3.5: Auto-Scroll Toggle
- [ ] Play a lesson
- [ ] Manually scroll up/down
- [ ] **Expected**: Auto-scroll disables (icon dims)
- [ ] Click auto-scroll button (crosshair icon)
- [ ] **Expected**: Auto-scroll re-enables, scrolls to current line

#### Test 3.6: Line Clicking/Seeking
- [ ] Play a lesson
- [ ] Click on a different dialogue line
- [ ] **Expected**:
  - Playback jumps to that line
  - Audio for that line plays
  - Auto-scroll remains disabled (user navigated manually)

#### Test 3.7: Progress Bar Seeking
- [ ] Play a lesson
- [ ] Click/tap on progress bar
- [ ] **Expected**:
  - Playback jumps to that position
  - Correct dialogue line highlights
  - Audio plays from that point

---

### 4. UI/UX Tests

#### Test 4.1: Section Headers
- [ ] Generate a lesson
- [ ] Verify all section types display correctly:
  - [ ] Welcome (cyan)
  - [ ] Vocabulary (purple)
  - [ ] Slow Dialogue (blue)
  - [ ] Breakdown (amber)
  - [ ] Natural Speed (green)
  - [ ] Quiz (red)
  - [ ] Cultural Note (pink)

#### Test 4.2: Vocabulary Cards
- [ ] Navigate to Vocabulary section
- [ ] **Expected**: Words displayed as flashcards
- [ ] Click expand arrow on a card
- [ ] **Expected**: Shows pronunciation, translation, example

#### Test 4.3: Quiz Flashcards
- [ ] Navigate to Quiz section
- [ ] **Expected**: Questions displayed as flashcards
- [ ] Click expand arrow
- [ ] **Expected**: Shows answer (flip animation)

#### Test 4.4: Transcript Toggle
- [ ] Find a section with transcript toggle (Vocabulary, Breakdown, Quiz)
- [ ] Click microphone icon (right side of section header)
- [ ] **Expected**: Shows literal spoken dialogue instead of cards
- [ ] Click card icon (left side)
- [ ] **Expected**: Returns to card view

---

### 5. Character Selection Tests

#### Test 5.1: Default Characters
- [ ] Start new lesson
- [ ] Verify default characters are selected
- [ ] Generate lesson
- [ ] **Expected**: Lesson generates with default voices

#### Test 5.2: Custom Characters (API Mode)
- [ ] Select Language: Spanish (forces API mode)
- [ ] Generate lesson
- [ ] **Expected**: Lesson generates with live API
- [ ] Note: Character customization fully works with API

---

### 6. Performance Tests

#### Test 6.1: Bundled Audio Load Time
- [ ] Clear browser cache
- [ ] Select English + Coffee Shop
- [ ] Note start time
- [ ] Click "Generate Lesson"
- [ ] Note end time
- [ ] **Expected**: Loads in under 2 seconds

#### Test 6.2: API Audio Load Time
- [ ] Select English + Restaurant
- [ ] Note start time
- [ ] Click "Generate Lesson"
- [ ] Note end time
- [ ] **Expected**: Takes 20-40 seconds (normal for API generation)

---

### 7. Error Handling Tests

#### Test 7.1: Missing API Keys
- [ ] Remove OpenAI API key from environment
- [ ] Try to generate lesson
- [ ] **Expected**: Falls back to mock dialogue gracefully

#### Test 7.2: Network Interruption
- [ ] Start generating API-based lesson
- [ ] Disable network midway
- [ ] **Expected**: Shows error, doesn't crash app

---

### 8. Cross-Browser Tests

#### Test 8.1: Chrome/Edge
- [ ] Test all playback features in Chrome/Edge
- [ ] **Expected**: All features work correctly

#### Test 8.2: Firefox
- [ ] Test all playback features in Firefox
- [ ] **Expected**: All features work correctly

#### Test 8.3: Safari
- [ ] Test all playback features in Safari
- [ ] **Expected**: All features work correctly

---

## Regression Tests

### Test R.1: After Any Code Change
- [ ] Run backend tests: `cd /app/backend && pytest tests/ -v`
- [ ] Generate English + Coffee Shop lesson (bundled)
- [ ] Verify audio plays and synchronizes correctly
- [ ] Generate English + Restaurant lesson (API)
- [ ] Verify audio generates and plays correctly
- [ ] Test all playback controls
- [ ] Check browser console for errors

---

## Test Results Log

### Test Run: [DATE]
**Tester**: [NAME]
**Environment**: Web Preview / Production
**Branch**: main

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | No Deprecation Warnings | ⬜ Pass / ⬜ Fail | |
| 1.2 | Audio Playback Works | ⬜ Pass / ⬜ Fail | |
| 2.1 | Bundled Audio Instant Load | ⬜ Pass / ⬜ Fail | |
| 2.2 | API Fallback | ⬜ Pass / ⬜ Fail | |
| 3.1 | Play/Pause Controls | ⬜ Pass / ⬜ Fail | |
| 3.2 | Line Highlighting | ⬜ Pass / ⬜ Fail | |
| 3.3 | Replay Function | ⬜ Pass / ⬜ Fail | |
| 3.4 | Speed Control | ⬜ Pass / ⬜ Fail | |
| 3.5 | Auto-Scroll Toggle | ⬜ Pass / ⬜ Fail | |
| 3.6 | Line Clicking | ⬜ Pass / ⬜ Fail | |
| 3.7 | Progress Bar Seeking | ⬜ Pass / ⬜ Fail | |

---

## Known Issues

### Non-Critical Issues:
1. **CORS Warning from vibecodeapp.com**: Analytics service, does not affect functionality
2. **Section-based audio**: Backend infrastructure built but not integrated (feature disabled)

### Future Enhancements:
1. Add more bundled lessons (Spanish, French, additional locations)
2. Implement section-based audio for better performance
3. Add S3 storage for production scaling
4. Implement cache cleanup/expiration
