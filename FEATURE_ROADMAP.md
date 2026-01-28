# MBA Copilot - Feature Implementation Plan

## ✅ **Currently Implemented Features**

### Core Functionality
- ✓ Live audio transcription with WebSocket
- ✓ Auto-save every 10 seconds
- ✓ AI-powered concept extraction (every 15s)
- ✓ Auto-generated suggested questions (every 60s)
- ✓ Knowledge graph with visual concept mapping
- ✓ AI doubt console with context-aware answers
- ✓ Session management and persistence

### UI/UX Enhancements
- ✓ 3D audio visualizer with wave effects
- ✓ Collapsible suggested questions
- ✓ Expandable modals for all panels
- ✓ Smart back navigation (mini mode)
- ✓ AI context save indicator
- ✓ Color-coded concept types (formula, example, trend, concept)
- ✓ Always-visible keyword labels on graph nodes
- ✓ Proper markdown rendering (asterisks removed)

---

## 🎯 **Planned Features (Non-Bloat)**

### Phase 1: Smart Learning Aids (High Priority)
**Status: Ready to implement**

1. **Live Progress Tracker** ⚡
   - Component created: `LiveStats.tsx`
   - Shows: Duration, word count, concepts, study time saved
   - Location: Below header, above transcript
   - Impact: Motivational, shows value

2. **Smart Notifications** 🔔
   - Component created: `SmartNotifications.tsx`
   - Subtle toasts for: New concepts, new questions, auto-save
   - Auto-dismiss after 5 seconds
   - Impact: User awareness without distraction

3. **Quick Actions on Transcript** 📌
   - "Mark for Review" button on each turn
   - "Add to Flashcards" for key segments
   - Highlight important formulas automatically
   - Impact: Active learning, better retention

### Phase 2: Study Tools (Medium Priority)

4. **Auto-Flashcards Generator** 🎴
   - Generate from discovered concepts
   - Front: Keyword, Back: Explanation
   - Export to Anki/CSV
   - Impact: Spaced repetition study

5. **Focus Mode** 🎯
   - Keyboard shortcut: `F` key
   - Hides all panels except transcript
   - Minimal distraction
   - Impact: Better concentration

6. **Session Summary Export** 📄
   - PDF export with:
     - Full transcript
     - All concepts with definitions
     - Suggested questions
     - Knowledge graph visualization
   - Impact: Offline study material

### Phase 3: Advanced Features (Low Priority)

7. **Formula Renderer** 🧮
   - Detect LaTeX/math notation
   - Render beautifully with KaTeX
   - Impact: Better math comprehension

8. **Multi-Language Support** 🌍
   - Hinglish detection
   - Code-switching handling
   - Impact: Better for Indian MBA students

9. **Session Analytics** 📊
   - Weekly/monthly stats
   - Concept mastery tracking
   - Study patterns
   - Impact: Long-term learning insights

---

## 🚫 **Features to AVOID (Bloat)**

- ❌ Social sharing
- ❌ Gamification badges
- ❌ Multiple themes
- ❌ Custom fonts
- ❌ Animation preferences
- ❌ Too many export formats
- ❌ Video recording
- ❌ Screen sharing
- ❌ Collaborative features

---

## 📋 **Implementation Priority**

### Immediate (This Session)
1. Add LiveStats component to header
2. Add SmartNotifications for concept/question discoveries
3. Add duration tracker useEffect

### Next Session
4. Implement "Mark for Review" on transcript
5. Add Focus Mode toggle
6. Create flashcard generator

### Future
7. Formula rendering with KaTeX
8. Session summary PDF export
9. Analytics dashboard

---

## 🎨 **Design Principles**

1. **Minimal Cognitive Load**
   - Features should reduce mental effort, not add to it
   - Default to hidden, reveal on demand

2. **Progressive Disclosure**
   - Advanced features behind expand buttons
   - Simple interface by default

3. **Performance First**
   - No feature should slow down transcription
   - Async operations for heavy tasks

4. **Mobile-Friendly**
   - Responsive design
   - Touch-friendly buttons
   - Readable on small screens

---

## 📊 **Success Metrics**

- Session completion rate > 90%
- Average concepts discovered per session > 10
- User returns within 7 days > 70%
- Export usage > 30%

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
