export const onRequestGet = async (ctx) => {
  const { env } = ctx;
  
  return new Response(JSON.stringify({
    availableKeys: Object.keys(env || {}),
    hasOpenAI: !!env.OPENAI_API_KEY,
    openAIKeyLength: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.length : 0,
    allEnvVars: env
  }), {
    headers: {
      'content-type': 'application/json'
    }
  });
}