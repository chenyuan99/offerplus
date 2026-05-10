# JobGPT Prompt Management Strategy

## Current Issues
- Prompts hardcoded in `prompts.ts` - hard to iterate on
- No version control for prompt changes
- No A/B testing capability
- No feedback tracking on which prompts work best
- Difficult to test prompt changes without redeploying

## Proposed Solution: Multi-Layer Prompt System

### 1. **Prompt Structure** (like Claude's approach)

```
prompts/
├── system/              # Core system prompts
│   ├── base.md
│   ├── why_company.md
│   ├── behavioral.md
│   └── general.md
├── templates/           # User input templates
│   ├── why_company/
│   │   ├── v1_research_interest.md
│   │   ├── v2_values_alignment.md
│   │   └── current.json (points to active version)
│   └── ...
├── examples/            # Few-shot examples
│   ├── why_company_examples.json
│   └── behavioral_examples.json
└── metadata.json        # Versioning, metrics, tags
```

### 2. **Prompt Versioning**

Each prompt version has:
```json
{
  "id": "why_company_research_v1",
  "version": "1.0",
  "mode": "why_company",
  "created": "2026-05-09",
  "author": "user@example.com",
  "description": "Initial research-focused template",
  "performance": {
    "averageRating": 4.2,
    "testCount": 45,
    "successRate": 0.85
  },
  "tags": ["research", "detailed", "structured"],
  "status": "active" | "archived" | "experimental",
  "systemPrompt": "...",
  "userTemplate": "...",
  "constraints": {
    "minTokens": 100,
    "maxTokens": 800,
    "temperature": 0.7
  }
}
```

### 3. **Testing & Feedback System**

Allow users to:
- Rate responses (1-5 stars)
- Mark responses as "regenerate" (this prompt didn't work)
- Provide feedback text
- Compare outputs from different prompt versions

```typescript
interface PromptFeedback {
  promptVersionId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  userId: string;
  feedback?: string;
  mode: JobGPTMode;
  timestamp: number;
}
```

### 4. **Prompt Management UI**

Add to JobGPT:
```
[Current Template: why_company_research_v1] [View alternatives ▼]
  - why_company_research_v1 (active) ★ 4.2/5
  - why_company_research_v0 (archived) ★ 3.8/5
  - why_company_experimental_v2 (experimental) ★ 4.5/5

[Rate this response] ★★★★☆ [Regenerate]
```

### 5. **Prompt Development Workflow**

```
1. Create prompt in isolated environment
2. Test with sample inputs
3. Collect user feedback
4. Mark as "experimental" 
5. When feedback is good (4.0+ rating), promote to "active"
6. Keep old versions as "archived" for comparison
7. Retire very poor versions
```

### 6. **Implementation Phases**

**Phase 1: Core Infrastructure**
- Move prompts to structured format (JSON/YAML)
- Add prompt metadata and versioning
- Create prompt loader service

**Phase 2: Feedback System**
- Add rating/feedback UI
- Store feedback in Supabase
- Calculate prompt metrics

**Phase 3: Testing & Comparison**
- A/B testing interface
- Side-by-side prompt comparison
- Performance analytics dashboard

**Phase 4: Advanced Features**
- Prompt search/discovery
- Community prompt sharing
- Automated prompt optimization suggestions
- Webhook notifications on prompt changes

### 7. **Prompt Composition (like Claude's modular approach)**

Instead of one big template, compose from parts:

```typescript
interface ComposedPrompt {
  systemPrompt: string;
  context: string;        // Background/context
  instruction: string;    // What to do
  constraints: string;    // Output format
  examples?: string;      // Few-shot examples
  guardrails?: string;    // Safety/quality guidelines
}
```

### 8. **Storage Options**

**Option A: Git-based (like current)**
- ✅ Full version history
- ✅ Code review process
- ❌ Can't update without deployment

**Option B: Database-backed**
- ✅ Hot updates
- ✅ Fast iteration
- ✅ User feedback tracking
- ❌ Need migration strategy

**Option C: Hybrid (Recommended)**
- Core prompts in git (reliability)
- User/experimental prompts in Supabase (flexibility)
- Fallback system when database is down

## Quick Wins to Implement Now

1. **Add prompt metadata to current system**
   ```typescript
   interface PromptTemplate {
     // existing fields...
     metadata: {
       version: string;
       lastUpdated: string;
       author: string;
       rating?: number;
       feedbackCount?: number;
     }
   }
   ```

2. **Add feedback collection**
   ```typescript
   interface ResponseFeedback {
     promptId: string;
     rating: number;
     comment?: string;
     userId: string;
   }
   // Save to Supabase
   ```

3. **Add prompt comparison view**
   - Side-by-side comparison of different prompt versions
   - View metrics/ratings for each

4. **Prompt iteration tracking**
   - Git log for prompts.ts shows history
   - Link commit messages to user feedback

## Long-term Vision

- **Prompt Marketplace**: Share templates between projects
- **Prompt Analytics**: Dashboard showing which prompts drive conversions
- **Auto-optimization**: AI suggests prompt improvements based on feedback
- **Multi-language support**: Maintain prompts in multiple languages
- **Prompt Testing Suite**: Automated tests for prompt quality
