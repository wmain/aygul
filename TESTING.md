# Testing Guide for Language Learning App

## Quick Test

**Before any Git commit, run this quick sanity check:**

```bash
# 1. Backend tests
cd /app/backend && pytest tests/ -v

# 2. TypeScript check
cd /app && yarn typecheck

# 3. Build test
cd /app && yarn expo export --platform web --output-dir dist

# 4. Manual smoke test
# - Open http://localhost:3000
# - Generate English + Coffee Shop lesson
# - Click Play and verify audio works
# - Check console for errors
```

---

## Full Test Suite

See [TEST_PLAN.md](/app/TEST_PLAN.md) for comprehensive testing checklist.

---

## Running Tests

### Backend Unit Tests

```bash
cd /app/backend

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_audio_cache_api.py -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Frontend Type Checking

```bash
cd /app

# Check for TypeScript errors
yarn typecheck

# Check for linting issues  
yarn lint
```

### Integration Tests

**Test API Endpoints:**
```bash
# Health check
curl http://localhost:8001/api/health

# Cache stats
curl http://localhost:8001/api/audio/cache/stats

# Generate section audio
curl -X POST http://localhost:8001/api/audio/section/generate \
  -H "Content-Type: application/json" \
  -d '{
    "section_type": "test",
    "language": "en",
    "location": "test",
    "speaker_a": "maria",
    "speaker_b": "jordan",
    "dialogue_lines": [{"text": "Test", "speakerId": 1}]
  }'
```

---

## Test Scenarios

### Critical Path Tests (Must Pass)

1. **Bundled Audio Path** ✅
   - English + Coffee Shop → Instant load → Audio plays

2. **API Fallback Path** ✅
   - English + Restaurant → API generation → Audio plays

3. **Basic Playback** ✅
   - Play → Pause → Resume → Works correctly

### User Acceptance Tests

1. **First-Time User**
   - Open app → Select language → Generate lesson → Play → Complete
   - Should be intuitive and error-free

2. **Returning User**
   - Generate same lesson again → Should load quickly (cached)

3. **Advanced User**
   - Use all playback controls → Speed, seeking, replay
   - All should work smoothly

---

## Performance Benchmarks

| Scenario | Target | Current |
|----------|--------|----------|
| Bundled lesson load | < 2s | ~500ms ✅ |
| API lesson generation | < 60s | ~30-40s ✅ |
| Audio playback start | < 1s | < 500ms ✅ |
| Page load (initial) | < 3s | ~2s ✅ |

---

## Browser Compatibility

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ✅ Tested | Primary development browser |
| Firefox | Latest | ⚠️ Not Tested | Should work but verify |
| Safari | Latest | ⚠️ Not Tested | May need polyfills |
| Edge | Latest | ⚠️ Not Tested | Chromium-based, likely works |

---

## Testing Environments

### Development (Local)
- URL: http://localhost:3000
- Backend: http://localhost:8001
- Database: MongoDB local

### Preview (Emergent Platform)
- URL: https://offlinepal-1.preview.emergentagent.com
- Backend: Same domain/api
- Database: MongoDB in cluster

### Production (Future)
- TBD

---

## Bug Reporting Template

```markdown
### Bug Report

**Title**: [Brief description]

**Environment**:
- Browser: [Chrome/Firefox/Safari] [Version]
- URL: [Preview/Production]
- Date: [YYYY-MM-DD]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Console Errors**:
```
[Paste any console errors]
```

**Screenshots/Video**:
[Attach if available]

**Severity**: Critical / High / Medium / Low
```

---

## Test Automation (Future)

### Recommended Tools:
- **E2E Testing**: Playwright for web, Detox for React Native
- **Unit Testing**: Jest for frontend components
- **API Testing**: Pytest for backend (already implemented)
- **Visual Regression**: Percy or Chromatic

### Future Test Coverage Goals:
- Backend: 80%+ coverage
- Frontend: 60%+ coverage for critical paths
- E2E: All critical user journeys automated
