/* =====================================================================
   Market Assistant — configuration
   ---------------------------------------------------------------------
   The chatbot works out of the box with NO key ("local" mode): it reads
   the live catalogue, offers, your cart and your orders from the store
   API and answers with a built-in shopping engine.

   To make it fully AI-powered, pick a provider and paste an API key:

     provider: 'gemini'     → free key at https://aistudio.google.com/apikey
     provider: 'anthropic'  → key at https://console.anthropic.com

   ⚠ The key sits in this browser file, so anyone who can open the site
   can see it. That's fine for a local demo / presentation; for a public
   website the call should go through a server instead.
   ===================================================================== */
window.MARKET_AI = {
    provider: 'local',          // 'local' | 'gemini' | 'anthropic'
    apiKey: '',                 // paste your key here
    model: '',                  // optional; defaults: gemini-2.5-flash / claude-haiku-4-5-20251001
    assistantName: 'Market Assistant'
};
