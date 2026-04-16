const { openAiApiKey, openAiRealtimeModel, openAiRealtimeVoice } = require('../utils/config');

function buildDefaultInstruction(language) {
  if (language === 'Hindi') {
    return [
      'आप AskOxy ecommerce voice assistant हैं।',
      'केवल हिंदी में जवाब दें।',
      'केवल backend, MCP, या website-grounded data के आधार पर जवाब दें।',
      'website के बाहर की किसी भी बात का जवाब न दें।',
      'अगर जानकारी उपलब्ध नहीं है, तो बिल्कुल यही बोलें: This information is not available on this website.',
      'अपनी तरफ से product, price, offer, cart, या order details मत बनाइए।',
      'Currency हमेशा Indian Rupees में रखें।',
      'सही MCP tool चुनें और उसी grounded result के आधार पर जवाब दें।'
    ].join(' ');
  }

  if (language === 'Telugu') {
    return [
      'మీరు AskOxy ecommerce voice assistant.',
      'కేవలం తెలుగులో మాత్రమే మాట్లాడండి.',
      'backend, MCP, లేదా website-grounded data ఆధారంగా మాత్రమే సమాధానం ఇవ్వండి.',
      'website కి సంబంధం లేని విషయాలకు సమాధానం ఇవ్వకండి.',
      'సమాచారం అందుబాటులో లేకపోతే, కచ్చితంగా ఇదే చెప్పండి: This information is not available on this website.',
      'మీరు స్వయంగా product, price, offers, cart, లేదా order details ఊహించి చెప్పకండి.',
      'Currency ఎప్పుడూ Indian Rupees లోనే ఉండాలి.',
      'సరైన MCP tool ఎంచుకుని అదే grounded result ఆధారంగా సమాధానం ఇవ్వండి.'
    ].join(' ');
  }

  return [
    'You are AskOxy ecommerce voice assistant.',
    'Speak only in English.',
    'Answer only using backend, MCP, or website-grounded data.',
    'Do not answer anything outside this website.',
    'If data is unavailable, say exactly: This information is not available on this website.',
    'Never invent products, prices, offers, cart items, or order results.',
    'Currency must always be Indian Rupees.',
    'Choose the correct MCP tool and answer only from grounded tool results.'
  ].join(' ');
}

async function getRealtimeToken(req, res) {
  try {
    const language = req.query.language || 'English';
    const instruction = req.query.instruction || buildDefaultInstruction(language);

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: openAiRealtimeModel,
          instructions: instruction,
          audio: {
            output: {
              voice: openAiRealtimeVoice
            }
          }
        }
      })
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `OpenAI token API failed: ${typeof data === 'string' ? data : JSON.stringify(data)}`,
        data: null
      });
    }

    const token = data?.value || null;
    const sessionId = data?.id || null;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI token missing in response',
        data: null
      });
    }

    return res.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        sessionId,
        token,
        client_secret: token,
        language,
        instruction
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Token generation failed',
      data: null
    });
  }
}

module.exports = {
  getRealtimeToken
};
