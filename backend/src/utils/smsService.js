const https = require('https');

/**
 * Normalizes Ethiopian phone numbers into international format (+251...)
 * e.g. 0912345678 -> +251912345678
 *      0712345678 -> +251712345678
 */
const formatEthiopianPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.toString().trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('+251')) return cleaned;
  if (cleaned.startsWith('251')) return `+${cleaned}`;
  if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
    return `+251${cleaned.substring(1)}`;
  }
  return cleaned;
};

/**
 * Sends an SMS message via AfroMessage API (https://app.afromessage.com/)
 * 
 * Required ENV:
 *   AFROMESSAGE_API_TOKEN = Your Bearer token from AfroMessage dashboard
 * 
 * Optional ENV:
 *   AFROMESSAGE_SENDER       = Your approved sender name (if configured)
 *   AFROMESSAGE_IDENTIFIER_ID = Your identifier ID (if configured)
 * 
 * @param {string} to - Recipient phone number (e.g. 0912345678 or +251912345678)
 * @param {string} message - Message text to send
 * @returns {Promise<{success: boolean, simulated: boolean, data?: any, error?: string}>}
 */
const sendSms = async (to, message) => {
  const token = process.env.AFROMESSAGE_API_TOKEN || process.env.AFROMESSAGE_TOKEN;
  const sender = process.env.AFROMESSAGE_SENDER;
  const identifierId = process.env.AFROMESSAGE_IDENTIFIER_ID;
  const formattedPhone = formatEthiopianPhone(to);

  // If no API key is provided or is placeholder, return simulated status
  if (!token || token.trim() === '' || token.includes('your_afromessage_token')) {
    console.warn(
      `[AfroMessage] AFROMESSAGE_API_TOKEN is not configured. Simulated SMS to ${formattedPhone}: "${message}"`
    );
    return {
      success: true,
      simulated: true,
      phone: formattedPhone,
      message: 'Simulated SMS dispatch (token not configured yet)'
    };
  }

  const queryParams = new URLSearchParams({
    to: formattedPhone,
    message: message,
  });
  if (sender) queryParams.set('sender', sender);
  if (identifierId) queryParams.set('from', identifierId);

  const requestUrl = `https://api.afromessage.com/api/send?${queryParams.toString()}`;

  // Use global fetch if available (Node 18+), fallback to https
  if (typeof fetch === 'function') {
    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(`[AfroMessage HTTP ${response.status}] Failed:`, data);
        return {
          success: false,
          simulated: false,
          status: response.status,
          error: data.message || `HTTP ${response.status}`,
          phone: formattedPhone
        };
      }

      if (data.acknowledge === 'error' || data.status === 'error') {
        const errorMsg = data.response?.errors?.[0] || 'AfroMessage rejected SMS delivery';
        console.warn(`[AfroMessage Delivery Warning] ${formattedPhone}: ${errorMsg}`);
        return {
          success: false,
          simulated: false,
          error: errorMsg,
          data,
          phone: formattedPhone
        };
      }

      console.log(`[AfroMessage] SMS successfully sent to ${formattedPhone}:`, data);
      return {
        success: true,
        simulated: false,
        data,
        phone: formattedPhone
      };
    } catch (err) {
      console.error(`[AfroMessage] Request error to ${formattedPhone}:`, err.message);
      return {
        success: false,
        simulated: false,
        error: err.message,
        phone: formattedPhone
      };
    }
  }

  // Fallback for older Node.js environments using native https module
  return new Promise((resolve) => {
    const req = https.get(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(rawData); } catch (e) { parsed = { raw: rawData }; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (parsed.acknowledge === 'error' || parsed.status === 'error') {
              const errorMsg = parsed.response?.errors?.[0] || 'AfroMessage rejected SMS delivery';
              console.warn(`[AfroMessage Delivery Warning] ${formattedPhone}: ${errorMsg}`);
              resolve({ success: false, simulated: false, error: errorMsg, data: parsed, phone: formattedPhone });
            } else {
              console.log(`[AfroMessage] SMS successfully sent to ${formattedPhone}:`, parsed);
              resolve({ success: true, simulated: false, data: parsed, phone: formattedPhone });
            }
          } else {
            console.error(`[AfroMessage HTTP ${res.statusCode}] Failed:`, parsed);
            resolve({ success: false, simulated: false, error: parsed.message || `HTTP ${res.statusCode}`, phone: formattedPhone });
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`[AfroMessage] Network error:`, err.message);
      resolve({ success: false, simulated: false, error: err.message, phone: formattedPhone });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, simulated: false, error: 'Connection timed out', phone: formattedPhone });
    });
  });
};

module.exports = {
  formatEthiopianPhone,
  sendSms,
};
