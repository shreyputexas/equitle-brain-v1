import logger from '../utils/logger';

/**
 * In-memory store for phone numbers received via webhook
 * Key: person_id or enrichment_request_id
 * Value: phone numbers array
 */
const phoneNumberStore = new Map<string, {
  phone_numbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }>;
  timestamp: number;
  person_id?: string;
  person_name?: string;
}>();

/**
 * Clean up old entries (older than 1 hour)
 */
function cleanupOldEntries() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of phoneNumberStore.entries()) {
    if (value.timestamp < oneHourAgo) {
      phoneNumberStore.delete(key);
    }
  }
}

// Clean up every 30 minutes
setInterval(cleanupOldEntries, 30 * 60 * 1000);

export class ApolloWebhookService {
  /**
   * Store phone numbers received from Apollo webhook
   */
  static storePhoneNumbers(
    identifier: string,
    phoneNumbers: Array<{
      raw_number: string;
      sanitized_number: string;
      type: string;
    }>,
    personId?: string,
    personName?: string
  ): void {
    phoneNumberStore.set(identifier, {
      phone_numbers: phoneNumbers,
      timestamp: Date.now(),
      person_id: personId,
      person_name: personName
    });

    logger.info('Stored phone numbers from webhook', {
      identifier,
      personId,
      personName,
      phoneCount: phoneNumbers.length
    });
  }

  /**
   * Get phone numbers for a person (by ID or name)
   */
  static getPhoneNumbers(identifier: string): Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }> | null {
    const entry = phoneNumberStore.get(identifier);
    if (entry) {
      // Check if entry is still valid (less than 1 hour old)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (entry.timestamp > oneHourAgo) {
        return entry.phone_numbers;
      } else {
        phoneNumberStore.delete(identifier);
      }
    }
    return null;
  }

  /**
   * Get phone numbers by person ID
   */
  static getPhoneNumbersByPersonId(personId: string): Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }> | null {
    for (const [key, value] of phoneNumberStore.entries()) {
      if (value.person_id === personId) {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (value.timestamp > oneHourAgo) {
          return value.phone_numbers;
        } else {
          phoneNumberStore.delete(key);
        }
      }
    }
    return null;
  }

  /**
   * Generate webhook URL for Apollo
   */
  static getWebhookUrl(): string {
    const baseUrl = process.env.BACKEND_URL || 
                   process.env.BASE_URL || 
                   `http://localhost:${process.env.PORT || 4001}`;
    
    // Remove trailing slash
    const cleanUrl = baseUrl.replace(/\/$/, '');
    
    return `${cleanUrl}/api/apollo/webhook/phone-numbers`;
  }
}

