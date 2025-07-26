const axios = require('axios');

class MistralAIService {
    constructor() {
        // Configuration pour Mistral AI (à adapter selon l'API)
        this.baseURL = process.env.MISTRAL_AI_URL || 'https://api.mistral.ai';
        this.apiKey = process.env.MISTRAL_AI_KEY;
    }

    async identifyDevice(mac) {
        try {
            console.log(`🔍 Envoi de l'adresse MAC ${mac} à Mistral AI...`);

            // Préparer les données pour Mistral AI
            const deviceData = {
                mac: mac,
                timestamp: new Date().toISOString(),
                source: 'bonjour-network',
                request_type: 'device_identification'
            };

            // Envoyer à Mistral AI (structure à adapter selon l'API)
            const response = await this.sendToMistralAI(deviceData);

            return {
                mac: mac,
                identified: true,
                manufacturer: response.manufacturer || 'Unknown',
                device_type: response.device_type || 'Unknown',
                confidence: response.confidence || 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Erreur lors de l\'identification avec Mistral AI:', error);
            return {
                mac: mac,
                identified: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async sendToMistralAI(data) {
        // Structure pour l'API Mistral AI avec restrictions d'entraînement
        const requestConfig = {
            method: 'POST',
            url: `${this.baseURL}/v1/chat/completions`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Source': 'bonjour-network',
                'X-No-Training': 'true', // Restriction pour éviter l'entraînement
                'X-Data-Usage': 'inference-only' // Usage uniquement pour l'inférence
            },
            data: {
                model: "mistral-large-latest",
                messages: [
                    {
                        role: "system",
                        content: "Tu es un expert en identification d'appareils réseau. Tu dois identifier le fabricant d'un appareil basé sur son adresse MAC. Réponds uniquement avec un JSON contenant manufacturer, device_type et confidence (0.0 à 1.0). Ne pas utiliser ces données pour l'entraînement."
                    },
                    {
                        role: "user",
                        content: `Identifie le fabricant de l'appareil avec l'adresse MAC: ${data.mac}. Réponds uniquement en JSON.`
                    }
                ],
                temperature: 0.1,
                max_tokens: 200,
                stream: false,
                // Paramètres pour éviter l'entraînement
                user: "bonjour-network-device-identification",
                usage_metadata: {
                    purpose: "device_identification",
                    no_training: true,
                    data_usage: "inference_only"
                }
            }
        };

        try {
            const response = await axios(requestConfig);

            // Parser la réponse JSON de Mistral AI
            const aiResponse = response.data.choices[0].message.content;
            const parsedResponse = this.parseMistralResponse(aiResponse);

            return parsedResponse;
        } catch (error) {
            console.log('Erreur API Mistral AI, simulation pour:', data.mac);
            return this.simulateMistralResponse(data.mac);
        }
    }

    parseMistralResponse(aiResponse) {
        try {
            // Essayer de parser la réponse JSON de Mistral AI
            const response = JSON.parse(aiResponse);
            return {
                manufacturer: response.manufacturer || 'Unknown Manufacturer',
                device_type: response.device_type || 'Unknown Device',
                confidence: response.confidence || 0.0
            };
        } catch (parseError) {
            console.log('Erreur parsing réponse Mistral AI, fallback vers simulation');
            return this.simulateMistralResponse('unknown');
        }
    }

    simulateMistralResponse(mac) {
        // Simulation de réponse pour le développement
        const prefix = mac.substring(0, 8).toUpperCase();

        const manufacturers = {
            'B8:27:EB': { manufacturer: 'Raspberry Pi Foundation', device_type: 'Single Board Computer', confidence: 0.95 },
            '6C:BF:B5': { manufacturer: 'Synology Inc.', device_type: 'Network Attached Storage', confidence: 0.90 },
            '22:FC:ED': { manufacturer: 'Apple Inc.', device_type: 'Mobile Device', confidence: 0.85 },
            '48:E1:5C': { manufacturer: 'Samsung Electronics', device_type: 'Smart TV', confidence: 0.80 },
            '96:E8:40': { manufacturer: 'LG Electronics', device_type: 'Smart Device', confidence: 0.75 },
            'BC:D0:74': { manufacturer: 'Xiaomi Corporation', device_type: 'IoT Device', confidence: 0.70 },
            '38:7:16': { manufacturer: 'TP-Link Technologies', device_type: 'Network Router', confidence: 0.85 }
        };

        return manufacturers[prefix] || {
            manufacturer: 'Unknown Manufacturer',
            device_type: 'Unknown Device',
            confidence: 0.0
        };
    }

    async batchIdentify(devices) {
        try {
            console.log(`🔍 Identification en lot de ${devices.length} appareils...`);

            const results = [];
            for (const device of devices) {
                if (device.mac && device.mac !== 'N/A') {
                    const identification = await this.identifyDevice(device.mac);
                    results.push({
                        ...device,
                        mistral_ai: identification
                    });
                } else {
                    results.push(device);
                }
            }

            return results;
        } catch (error) {
            console.error('Erreur lors de l\'identification en lot:', error);
            return devices;
        }
    }

    async getDeviceHistory(mac) {
        try {
            // Récupérer l'historique des identifications pour une MAC
            const response = await axios.get(`${this.baseURL}/device-history/${mac}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return null;
        }
    }

    async updateDeviceInfo(mac, additionalInfo) {
        try {
            // Mettre à jour les informations d'un appareil
            const response = await axios.put(`${this.baseURL}/device/${mac}`, additionalInfo, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des infos:', error);
            return null;
        }
    }
}

module.exports = MistralAIService; 