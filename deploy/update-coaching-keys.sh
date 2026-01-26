#!/bin/bash
# Update Coaching OS API keys on the server

cd ~/ongozacyberhub/frontend/nextjs_app || exit 1

cat > .env.production << 'ENVEOF'
# Next.js Environment Variables
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000
NEXT_PUBLIC_FASTAPI_API_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=https://ongozacyberhub.com

# Grok API Configuration (xAI) - Coaching OS
GROK_API_KEY=${GROK_API_KEY}

# Anthropic Claude API Configuration (Claude 3.5 Sonnet) - Coaching OS
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Groq API Configuration (Primary - Llama 3.1 8B) - Fast Inference Fallback
GROQ_API_KEY=${GROQ_API_KEY}

# Groq API Configuration (Secondary - Mixtral 8x7B) - Advanced Fallback
GROQ_API_KEY_SECONDARY=${GROQ_API_KEY_SECONDARY}

# Llama Fallback Endpoint (Ollama)
LLAMA_ENDPOINT=http://localhost:11434
ENVEOF

echo "✅ Updated .env.production with Coaching OS API keys"
echo ""
echo "Verification:"
grep -E "GROK_API_KEY|ANTHROPIC_API_KEY|GROQ_API_KEY|GROQ_API_KEY_SECONDARY" .env.production

