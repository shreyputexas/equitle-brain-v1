import axios from 'axios';
import logger from '../utils/logger';

export interface SalesforceAccount {
  Id: string;
  Name: string;
  Type?: string;
  Industry?: string;
  AnnualRevenue?: number;
  NumberOfEmployees?: number;
  Phone?: string;
  Website?: string;
  BillingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  Description?: string;
  OwnerId: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceContact {
  Id: string;
  FirstName?: string;
  LastName: string;
  Name: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  Title?: string;
  Department?: string;
  AccountId?: string;
  Account?: {
    Name: string;
  };
  MailingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  Description?: string;
  OwnerId: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount?: number;
  CloseDate: string;
  StageName: string;
  Probability?: number;
  Type?: string;
  LeadSource?: string;
  AccountId?: string;
  Account?: {
    Name: string;
  };
  ContactId?: string;
  Contact?: {
    Name: string;
  };
  Description?: string;
  NextStep?: string;
  ForecastCategoryName?: string;
  OwnerId: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceLead {
  Id: string;
  FirstName?: string;
  LastName: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Company: string;
  Title?: string;
  Industry?: string;
  Status: string;
  LeadSource?: string;
  Rating?: string;
  Address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  Description?: string;
  OwnerId: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceTask {
  Id: string;
  Subject: string;
  Description?: string;
  Status: string;
  Priority: string;
  ActivityDate?: string;
  WhoId?: string;
  WhatId?: string;
  Type?: string;
  OwnerId: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  where?: string;
}

export class SalesforceApiService {
  private static readonly API_VERSION = 'v58.0';

  /**
   * Execute SOQL query
   */
  static async query(
    instanceUrl: string,
    accessToken: string,
    soql: string
  ): Promise<any> {
    try {
      const response = await axios.get(`${instanceUrl}/services/data/${this.API_VERSION}/query`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: { q: soql }
      });

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce query error:', error.response?.data || error);
      throw new Error('Failed to execute Salesforce query');
    }
  }

  /**
   * Get accounts
   */
  static async getAccounts(
    instanceUrl: string,
    accessToken: string,
    options: SalesforceQueryOptions = {}
  ): Promise<SalesforceAccount[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'LastModifiedDate DESC', where } = options;

      let soql = `SELECT Id, Name, Type, Industry, AnnualRevenue, NumberOfEmployees, Phone, Website,
                         BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,
                         Description, OwnerId, CreatedDate, LastModifiedDate
                  FROM Account`;

      if (where) {
        soql += ` WHERE ${where}`;
      }

      soql += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

      const result = await this.query(instanceUrl, accessToken, soql);
      return result.records || [];
    } catch (error: any) {
      logger.error('Salesforce get accounts error:', error);
      throw new Error('Failed to fetch accounts from Salesforce');
    }
  }

  /**
   * Get contacts
   */
  static async getContacts(
    instanceUrl: string,
    accessToken: string,
    options: SalesforceQueryOptions = {}
  ): Promise<SalesforceContact[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'LastModifiedDate DESC', where } = options;

      let soql = `SELECT Id, FirstName, LastName, Name, Email, Phone, MobilePhone, Title, Department,
                         AccountId, Account.Name, MailingStreet, MailingCity, MailingState,
                         MailingPostalCode, MailingCountry, Description, OwnerId, CreatedDate, LastModifiedDate
                  FROM Contact`;

      if (where) {
        soql += ` WHERE ${where}`;
      }

      soql += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

      const result = await this.query(instanceUrl, accessToken, soql);
      return result.records || [];
    } catch (error: any) {
      logger.error('Salesforce get contacts error:', error);
      throw new Error('Failed to fetch contacts from Salesforce');
    }
  }

  /**
   * Get opportunities
   */
  static async getOpportunities(
    instanceUrl: string,
    accessToken: string,
    options: SalesforceQueryOptions = {}
  ): Promise<SalesforceOpportunity[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'LastModifiedDate DESC', where } = options;

      let soql = `SELECT Id, Name, Amount, CloseDate, StageName, Probability, Type, LeadSource,
                         AccountId, Account.Name, ContactId, Contact.Name, Description, NextStep,
                         ForecastCategoryName, OwnerId, CreatedDate, LastModifiedDate
                  FROM Opportunity`;

      if (where) {
        soql += ` WHERE ${where}`;
      }

      soql += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

      const result = await this.query(instanceUrl, accessToken, soql);
      return result.records || [];
    } catch (error: any) {
      logger.error('Salesforce get opportunities error:', error);
      throw new Error('Failed to fetch opportunities from Salesforce');
    }
  }

  /**
   * Get leads
   */
  static async getLeads(
    instanceUrl: string,
    accessToken: string,
    options: SalesforceQueryOptions = {}
  ): Promise<SalesforceLead[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'LastModifiedDate DESC', where } = options;

      let soql = `SELECT Id, FirstName, LastName, Name, Email, Phone, Company, Title, Industry,
                         Status, LeadSource, Rating, Street, City, State, PostalCode, Country,
                         Description, OwnerId, CreatedDate, LastModifiedDate
                  FROM Lead`;

      if (where) {
        soql += ` WHERE ${where}`;
      }

      soql += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

      const result = await this.query(instanceUrl, accessToken, soql);
      return result.records || [];
    } catch (error: any) {
      logger.error('Salesforce get leads error:', error);
      throw new Error('Failed to fetch leads from Salesforce');
    }
  }

  /**
   * Get tasks
   */
  static async getTasks(
    instanceUrl: string,
    accessToken: string,
    options: SalesforceQueryOptions = {}
  ): Promise<SalesforceTask[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'LastModifiedDate DESC', where } = options;

      let soql = `SELECT Id, Subject, Description, Status, Priority, ActivityDate, WhoId, WhatId,
                         Type, OwnerId, CreatedDate, LastModifiedDate
                  FROM Task`;

      if (where) {
        soql += ` WHERE ${where}`;
      }

      soql += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

      const result = await this.query(instanceUrl, accessToken, soql);
      return result.records || [];
    } catch (error: any) {
      logger.error('Salesforce get tasks error:', error);
      throw new Error('Failed to fetch tasks from Salesforce');
    }
  }

  /**
   * Create record
   */
  static async createRecord(
    instanceUrl: string,
    accessToken: string,
    sobjectType: string,
    data: any
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    try {
      const response = await axios.post(
        `${instanceUrl}/services/data/${this.API_VERSION}/sobjects/${sobjectType}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce create record error:', error.response?.data || error);
      throw new Error('Failed to create record in Salesforce');
    }
  }

  /**
   * Update record
   */
  static async updateRecord(
    instanceUrl: string,
    accessToken: string,
    sobjectType: string,
    recordId: string,
    data: any
  ): Promise<void> {
    try {
      await axios.patch(
        `${instanceUrl}/services/data/${this.API_VERSION}/sobjects/${sobjectType}/${recordId}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      logger.error('Salesforce update record error:', error.response?.data || error);
      throw new Error('Failed to update record in Salesforce');
    }
  }

  /**
   * Delete record
   */
  static async deleteRecord(
    instanceUrl: string,
    accessToken: string,
    sobjectType: string,
    recordId: string
  ): Promise<void> {
    try {
      await axios.delete(
        `${instanceUrl}/services/data/${this.API_VERSION}/sobjects/${sobjectType}/${recordId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (error: any) {
      logger.error('Salesforce delete record error:', error.response?.data || error);
      throw new Error('Failed to delete record from Salesforce');
    }
  }

  /**
   * Get record by ID
   */
  static async getRecord(
    instanceUrl: string,
    accessToken: string,
    sobjectType: string,
    recordId: string,
    fields?: string[]
  ): Promise<any> {
    try {
      const params: any = {};
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }

      const response = await axios.get(
        `${instanceUrl}/services/data/${this.API_VERSION}/sobjects/${sobjectType}/${recordId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce get record error:', error.response?.data || error);
      throw new Error('Failed to fetch record from Salesforce');
    }
  }

  /**
   * Get sobject metadata
   */
  static async getSobjectMetadata(
    instanceUrl: string,
    accessToken: string,
    sobjectType: string
  ): Promise<any> {
    try {
      const response = await axios.get(
        `${instanceUrl}/services/data/${this.API_VERSION}/sobjects/${sobjectType}/describe`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Salesforce get sobject metadata error:', error.response?.data || error);
      throw new Error('Failed to fetch sobject metadata from Salesforce');
    }
  }
}

export default SalesforceApiService;