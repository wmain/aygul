# Pre-Merge Checklist

## ✅ Automated Tests

### 1. Backend Tests
```bash
cd /app/backend && pytest tests/ -v
```
**Expected**: 4/4 tests pass

### 2. TypeScript Check
```bash
cd /app && yarn typecheck
```
**Expected**: No errors

### 3. Build Test
```bash
cd /app && yarn expo export --platform web --output-dir dist
```
**Expected**: Build succeeds

---

## ✅ Critical Manual Tests (5 min)

### Test A: Bundled Audio Works
1. Open http://localhost:3000
2. Select: English + Coffee Shop
3. Click "Generate Lesson"
4. **Verify**: Loads instantly (< 2s)
5. Click Play
6. **Verify**: Audio plays, text syncs correctly

### Test B: API Fallback Works
1. Select: English + Restaurant
2. Click "Generate Lesson"
3. Wait ~30s
4. **Verify**: Lesson generates, audio plays

### Test C: Playback Controls
1. With any lesson:
2. Test: Play, Pause, Replay, Speed, Seek
3. **Verify**: All controls work smoothly

### Test D: No Console Errors
1. Open browser console (F12)
2. Generate and play a lesson
3. **Verify**: No critical errors (analytics CORS ok)

---

## ✅ Sign-Off

```
## Pre-Merge Test Results

Date: _____________
Tester: _____________
Branch: _____________

Automated Tests:
- [ ] Backend tests: PASS
- [ ] TypeScript: PASS
- [ ] Build: PASS

Manual Tests:
- [ ] Bundled audio: PASS
- [ ] API fallback: PASS
- [ ] Playback controls: PASS
- [ ] No errors: PASS

Issues Found: None / [List issues]

Ready to Merge: YES / NO
```
