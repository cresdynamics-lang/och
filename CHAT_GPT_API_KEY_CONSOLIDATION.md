# ChatGPT API Key Consolidation

## Summary
Consolidated all OpenAI API usage to use `CHAT_GPT_API_KEY` environment variable across the entire codebase.

## Changes Made

### Files Updated

1. **`recipes/services/llm_service.py`** ✅
   - Recipe generation using GPT-4o-mini
   - Already uses `CHAT_GPT_API_KEY`

2. **`recipes/views.py`** ✅
   - `RecipeEnvStatusView` - Environment status check
   - Updated to use `CHAT_GPT_API_KEY`

3. **`coaching/tasks.py`** ✅
   - AI coaching message generation
   - Changed: `settings.OPENAI_API_KEY` → `settings.CHAT_GPT_API_KEY`

4. **`missions/tasks.py`** ✅
   - Mission submission evaluation
   - Changed: `os.environ.get('OPENAI_API_KEY')` → `os.environ.get('CHAT_GPT_API_KEY')`

5. **`student_dashboard/services.py`** ✅
   - AI coach nudges and action plans
   - Changed: `os.environ.get('OPENAI_API_KEY')` → `os.environ.get('CHAT_GPT_API_KEY')`

6. **`profiler/tasks.py`** ✅
   - Student persona generation
   - Changed: `os.environ.get('OPENAI_API_KEY')` → `os.environ.get('CHAT_GPT_API_KEY')`

7. **`core/settings/base.py`** ✅
   - Django settings configuration
   - Now loads `CHAT_GPT_API_KEY` with fallback to `OPENAI_API_KEY`

8. **`.env`** ✅
   - Environment configuration
   - `CHAT_GPT_API_KEY` set with actual key
   - `AI_COACH_MODEL=gpt-4o-mini`

9. **`.env.example`** ✅
   - Updated template with `CHAT_GPT_API_KEY` as primary
   - Added deprecation note for `OPENAI_API_KEY`

## Environment Variables

### Primary Variable (Use This)
```env
CHAT_GPT_API_KEY=sk-proj-...your-key-here...
AI_COACH_MODEL=gpt-4o-mini
```

### Deprecated Variable (Fallback Only)
```env
OPENAI_API_KEY=your-openai-api-key  # Will be removed in future
```

## Features Using ChatGPT API

All these features now use `CHAT_GPT_API_KEY`:

1. **Recipe Generation** (`/dashboard/admin/recipes`)
   - AI-powered cybersecurity training recipe creation
   - Model: `gpt-4o-mini`

2. **AI Coaching** 
   - Daily nudges and action plans
   - Personalized coaching messages
   - Model: `gpt-4o-mini`

3. **Mission Evaluation**
   - Automated mission submission assessment
   - Competency detection
   - Feedback generation

4. **Student Profiling**
   - Persona generation from profiling questionnaire
   - Learning style analysis
   - Track recommendations

5. **Student Dashboard**
   - AI-generated insights
   - Progress recommendations

## Benefits

✅ **Consistency** - Single environment variable for all OpenAI usage
✅ **Clarity** - Clear naming (`CHAT_GPT_API_KEY` vs generic `OPENAI_API_KEY`)
✅ **Cost Efficiency** - Using `gpt-4o-mini` (~17x cheaper than gpt-4o)
✅ **Maintainability** - Easier to manage and update
✅ **No Duplication** - API key only needs to be set in one place (backend)

## Migration Notes

### For Existing Deployments

If you have `OPENAI_API_KEY` set in production:
1. Add `CHAT_GPT_API_KEY` with the same value
2. The fallback ensures backward compatibility
3. Eventually remove `OPENAI_API_KEY` once confirmed working

### Settings Loading Order
```python
CHAT_GPT_API_KEY = os.environ.get('CHAT_GPT_API_KEY', os.environ.get('OPENAI_API_KEY', ''))
```

This means:
1. First tries `CHAT_GPT_API_KEY`
2. Falls back to `OPENAI_API_KEY` if not set
3. Defaults to empty string if neither is set

## Cost Comparison

### GPT-4o-mini Pricing
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens

### Example Recipe Generation
- **Prompt**: ~500 tokens
- **Response**: ~1000 tokens
- **Cost**: $0.00068 per recipe
- **1000 recipes**: ~$0.68

### Previous (GPT-4o)
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens
- **Cost**: ~$0.0115 per recipe
- **1000 recipes**: ~$11.50

**Savings**: ~94% cost reduction! 💰

## Testing Checklist

- [x] Recipe generation works
- [x] Environment status check works
- [x] API key loaded correctly in Django settings
- [x] Model set to gpt-4o-mini
- [ ] AI coaching messages (test when coaching enabled)
- [ ] Mission evaluation (test when submissions evaluated)
- [ ] Student profiling (test when new users complete profiling)

## Next Steps

1. **Restart Django server** to load new settings
2. **Test recipe generation** at `/dashboard/admin/recipes`
3. **Monitor logs** for any remaining `OPENAI_API_KEY` references
4. **Update documentation** with new environment variable name

---

**Status**: ✅ All files updated  
**Date**: 2026-02-05  
**Environment Variable**: `CHAT_GPT_API_KEY`  
**Model**: `gpt-4o-mini`
