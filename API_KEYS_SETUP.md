# API Keys Setup Guide

This document provides a comprehensive guide for setting up all the API keys required for the FactCast V0 real-time AI fact-checking assistant.

## Environment Configuration

All API keys are configured in the `.env.local` file. Copy the template below and replace the placeholder values with your actual API keys.

## Required API Keys

### AI & NLP APIs

#### 1. OpenAI API
- **Purpose**: Primary AI provider for GPT-4 text generation, summarization, and fact-checking
- **Key**: `OPENAI_API_KEY`
- **Value**: `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`
- **How to get**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Cost**: Pay-per-use, starts at $0.03/1K tokens

#### 2. ElevenLabs API
- **Purpose**: High-quality text-to-speech synthesis for voice output
- **Key**: `ELEVENLABS_API_KEY`
- **Value**: `sk_e0cae70c65f78eade01bd0589d2eac5c1c6640855afc557a`
- **How to get**: [ElevenLabs Platform](https://elevenlabs.io/)
- **Cost**: Free tier available, then pay-per-use

#### 3. Cohere API
- **Purpose**: Alternative AI provider for text classification and summarization
- **Key**: `COHERE_API_KEY`
- **Value**: `AyWaYRTgjoDrtl40v0qlMYwPK2JQto07Noj9ag6t`
- **How to get**: [Cohere Platform](https://cohere.ai/)
- **Cost**: Free tier available, then pay-per-use

#### 4. Google Gemini API
- **Purpose**: Google's AI model for text generation and analysis
- **Key**: `GOOGLE_GEMINI_API_KEY`
- **Value**: `AIzaSyBvouNU-OM08bAwr5U_m6jlnygfo55inns`
- **How to get**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Cost**: Free tier available, then pay-per-use

#### 5. Hugging Face API
- **Purpose**: Access to open-source NLP models for entity recognition and sentiment analysis
- **Key**: `HUGGINGFACE_API_TOKEN`
- **Value**: `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`
- **How to get**: [Hugging Face](https://huggingface.co/settings/tokens)
- **Cost**: Free tier available

### Search & News APIs

#### 6. Google Custom Search Engine
- **Purpose**: Web search functionality for fact verification
- **Key**: `GOOGLE_CSE_ID`
- **Value**: `d3f01052b42ea4c64`
- **How to get**: [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
- **Cost**: Free tier available

#### 7. Google API Key
- **Purpose**: Required for Google Custom Search Engine
- **Key**: `GOOGLE_API_KEY`
- **Value**: `AIzaSyBCIktX7MvpKKO82AGyzq0AdcXJOF43s1A`
- **How to get**: [Google Cloud Console](https://console.cloud.google.com/)
- **Cost**: Free tier available

#### 8. NewsAPI
- **Purpose**: News article search and aggregation
- **Key**: `NEWS_API_KEY`
- **Value**: `d70de3b84ff14c9380a370d20c2c9490`
- **How to get**: [NewsAPI](https://newsapi.org/)
- **Cost**: Free tier available (1000 requests/day)

#### 9. MediaStack API
- **Purpose**: Alternative news source for fact verification
- **Key**: `MEDIASTACK_API_KEY`
- **Value**: `ef516d74d108526faf7606a9671b5e9e`
- **How to get**: [MediaStack](https://mediastack.com/)
- **Cost**: Free tier available

#### 10. GNews API
- **Purpose**: Global news search and aggregation
- **Key**: `GNEWS_API_KEY`
- **Value**: `63c3371884dabb660bd9277429de0e5c`
- **How to get**: [GNews](https://gnews.io/)
- **Cost**: Free tier available

#### 11. CurrentsAPI
- **Purpose**: Real-time news and content aggregation
- **Key**: `CURRENTSAPI_KEY`
- **Value**: `gnfVYncnIr5vy1ZUQlFKS9mkXcSbsdsSgApvIZ_-vCU6mTLO`
- **How to get**: [CurrentsAPI](https://currentsapi.services/)
- **Cost**: Free tier available

### Social Media APIs

#### 12. Twitter/X API
- **Purpose**: Social media monitoring and fact verification
- **Key**: `TWITTER_API_KEY`
- **Value**: `YmYsCUzGrEkJVHDIWZwXWCCJ9`
- **Secret**: `TWITTER_API_SECRET`
- **Value**: `6JWMahtClu6u5KfVGcYB0ucQEnUMAuqbfvHZVHEHL2Gr6kYNze`
- **How to get**: [Twitter Developer Portal](https://developer.twitter.com/)
- **Cost**: Free tier available

### Audio & Speech APIs

#### 13. AssemblyAI
- **Purpose**: Speech-to-text transcription for voice input
- **Key**: `ASSEMBLYAI_API_KEY`
- **Value**: `86c9783cddf94580a6812ebba43d92b5`
- **How to get**: [AssemblyAI](https://www.assemblyai.com/)
- **Cost**: Free tier available

### Entertainment APIs

#### 14. Spotify API
- **Purpose**: Music and podcast integration (future feature)
- **Key**: `SPOTIFY_CLIENT_ID`
- **Value**: `f2d76b9ade8d46a09f747e9c205e9945`
- **How to get**: [Spotify Developer Dashboard](https://developer.spotify.com/)
- **Cost**: Free

## Environment File Template

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# AI & NLP APIs
OPENAI_API_KEY=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
ELEVENLABS_API_KEY=sk_e0cae70c65f78eade01bd0589d2eac5c1c6640855afc557a
COHERE_API_KEY=AyWaYRTgjoDrtl40v0qlMYwPK2JQto07Noj9ag6t
GOOGLE_GEMINI_API_KEY=AIzaSyBvouNU-OM08bAwr5U_m6jlnygfo55inns
HUGGINGFACE_API_TOKEN=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

# Search & News APIs
GOOGLE_CSE_ID=d3f01052b42ea4c64
GOOGLE_API_KEY=AIzaSyBCIktX7MvpKKO82AGyzq0AdcXJOF43s1A
NEWS_API_KEY=d70de3b84ff14c9380a370d20c2c9490
MEDIASTACK_API_KEY=ef516d74d108526faf7606a9671b5e9e
GNEWS_API_KEY=63c3371884dabb660bd9277429de0e5c
CURRENTSAPI_KEY=gnfVYncnIr5vy1ZUQlFKS9mkXcSbsdsSgApvIZ_-vCU6mTLO

# Social Media APIs
TWITTER_API_KEY=YmYsCUzGrEkJVHDIWZwXWCCJ9
TWITTER_API_SECRET=6JWMahtClu6u5KfVGcYB0ucQEnUMAuqbfvHZVHEHL2Gr6kYNze

# Audio & Speech APIs
ASSEMBLYAI_API_KEY=86c9783cddf94580a6812ebba43d92b5

# Entertainment APIs
SPOTIFY_CLIENT_ID=f2d76b9ade8d46a09f747e9c205e9945

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=wss://truthcast-fact-checker.windsurf.build/api/realtime

# Government API (placeholder)
GOVERNMENT_API_KEY=your-government-api-key
```

## Setup Instructions

1. **Copy the environment template** above to your `.env.local` file
2. **Replace placeholder values** with your actual API keys
3. **Test the configuration** by running the verification script:
   ```bash
   npm run verify-config
   ```

## API Usage and Limits

### Free Tier Limits
- **OpenAI**: $5 credit for new users
- **ElevenLabs**: 10,000 characters/month
- **Cohere**: 5 requests/minute, 100 requests/day
- **Google Gemini**: 15 requests/minute
- **NewsAPI**: 1,000 requests/day
- **MediaStack**: 500 requests/month
- **GNews**: 100 requests/day
- **CurrentsAPI**: 100 requests/day
- **Twitter**: 500,000 tweets/month
- **AssemblyAI**: 5 hours/month

### Cost Optimization
- The system uses fallback mechanisms to minimize API costs
- Lower-cost providers are tried first
- Local processing is used when possible
- Caching is implemented for repeated requests

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** for production use
- **Monitor usage** to prevent unexpected charges
- **Use API key restrictions** when available (IP whitelisting, etc.)

## Troubleshooting

### Common Issues
1. **Rate limiting**: Implement exponential backoff
2. **Authentication errors**: Verify API key format and permissions
3. **Quota exceeded**: Check usage limits and upgrade if needed
4. **Network errors**: Implement retry logic with fallbacks

### Testing Individual APIs
```bash
# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}' \
  https://api.openai.com/v1/chat/completions

# Test ElevenLabs
curl -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}' \
  https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM
```

## Deployment Considerations

### Production Environment
- Use **environment-specific** API keys
- Implement **key rotation** procedures
- Set up **usage monitoring** and alerts
- Configure **rate limiting** and caching
- Use **secrets management** services

### Development Environment
- Use **free tier** APIs for testing
- Implement **mock responses** for offline development
- Use **local models** where possible
- Set up **development-specific** API keys

## Support and Resources

- **OpenAI**: [Documentation](https://platform.openai.com/docs)
- **ElevenLabs**: [Documentation](https://elevenlabs.io/docs)
- **Cohere**: [Documentation](https://docs.cohere.ai/)
- **Google AI**: [Documentation](https://ai.google.dev/docs)
- **Hugging Face**: [Documentation](https://huggingface.co/docs)

For additional support, refer to the main project documentation or create an issue in the repository. 