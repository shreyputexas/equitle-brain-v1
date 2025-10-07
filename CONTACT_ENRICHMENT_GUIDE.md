# Contact Enrichment Feature

This guide explains how to use the new Contact Enrichment feature in the Data Enrichment tab.

## Overview

The Contact Enrichment feature allows you to upload an Excel file containing contact data and enrich it with comprehensive contact information using Apollo's People Enrichment API. This includes emails, phone numbers, LinkedIn profiles, social media links, and more.

## Features

- **Excel File Upload**: Support for .xlsx, .xls, and .csv files
- **Automatic Field Mapping**: Intelligently maps Excel columns to contact fields
- **Apollo Integration**: Uses Apollo's People Enrichment API (`/people/match`) for data enrichment
- **Comprehensive Results**: Enriches with emails, phones, LinkedIn, social media, and company info
- **Export Results**: Download enriched data as CSV
- **Rate Limiting**: Respects Apollo API rate limits with built-in delays

## How to Use

### 1. Access the Feature

1. Navigate to the **Data Enrichment** page
2. Click on the **Contact Enrichment** tab
3. Configure your Apollo API key if not already done

### 2. Prepare Your Excel File

Your Excel file should contain contact data with headers that can be mapped to:
- **First Name**: `first_name`, `firstname`, `first name`, `given_name`, `given name`
- **Last Name**: `last_name`, `lastname`, `last name`, `surname`, `family_name`, `family name`
- **Email**: `email`, `email_address`, `email address`, `e_mail`
- **Company**: `company`, `organization`, `company_name`, `organization_name`, `employer`
- **Title**: `title`, `job_title`, `job title`, `position`, `role`
- **Phone**: `phone`, `phone_number`, `phone number`, `telephone`, `mobile`, `cell`

#### Sample Excel Structure:
```
First Name | Last Name | Email                | Company    | Title      | Phone
John       | Smith     | john@example.com     | Acme Corp  | CEO        | 555-0123
Jane       | Doe       | jane@techcorp.com    | TechCorp   | CTO        | 555-0456
Mike       | Johnson   | mike@startup.io      | StartupIO  | Founder    | 555-0789
```

### 3. Upload and Enrich

1. **Upload File**: Drag and drop your Excel file or click to browse
2. **Start Enrichment**: Click "Enrich Contacts" to begin processing
3. **Monitor Progress**: Watch the progress bar and status updates
4. **View Results**: See enriched data in the results table

### 4. Export Results

1. Click **"Download CSV"** to export all enriched data
2. The CSV includes both original and enriched data
3. Columns include: Original data, Enriched emails, phones, LinkedIn, social media, etc.

## Enriched Data Fields

The enrichment process adds the following information:

### Contact Information
- **Name**: Full contact name
- **Email**: Verified email address
- **Phone**: Sanitized phone number
- **Title**: Current job title
- **Company**: Current company name
- **LinkedIn**: LinkedIn profile URL
- **Location**: City and state
- **Photo**: Profile photo URL

### Social Media
- **LinkedIn**: LinkedIn profile
- **Twitter**: Twitter profile
- **GitHub**: GitHub profile
- **Facebook**: Facebook profile

### Company Information
- **Industry**: Company industry
- **Employee Count**: Company size
- **Company Domain**: Company website

## API Integration

### Apollo People Enrichment API

The feature uses Apollo's People Enrichment API endpoint:
- **Endpoint**: `POST /api/v1/people/match`
- **Input**: Contact identifiers (name, email, company, phone)
- **Output**: Comprehensive contact data with email reveal

### Rate Limiting

- Built-in 1-second delay between API calls
- Respects Apollo's rate limits
- Handles API errors gracefully

## File Format Support

### Supported Formats
- **Excel**: .xlsx, .xls
- **CSV**: .csv
- **Size Limit**: 10MB maximum

### Column Mapping

The system automatically maps Excel columns to contact fields:

| Excel Column | Mapped To | Description |
|--------------|-----------|-------------|
| `first_name`, `firstname`, `first name` | First Name | Contact's first name |
| `last_name`, `lastname`, `last name` | Last Name | Contact's last name |
| `email`, `email_address` | Email | Contact's email address |
| `company`, `organization` | Company | Company name |
| `title`, `job_title`, `position` | Title | Job title/position |
| `phone`, `phone_number`, `mobile` | Phone | Phone number |

## Error Handling

### Common Issues

1. **Invalid File Format**: Only Excel and CSV files are supported
2. **Missing Data**: Files must contain at least names or emails
3. **API Errors**: Apollo API errors are logged and displayed
4. **Rate Limiting**: Built-in delays prevent rate limit issues

### Troubleshooting

- **No Results**: Check that your Excel file has proper headers
- **API Errors**: Verify your Apollo API key is valid and has sufficient credits
- **File Upload Issues**: Ensure file is under 10MB and in supported format

## Sample Files

A sample CSV file is provided at `sample-contacts.csv` with example data for testing.

## Technical Details

### Backend Implementation

- **Route**: `/api/data-enrichment/contact-enrich`
- **Method**: POST
- **File Processing**: Uses xlsx library for Excel parsing
- **API Integration**: Apollo Service with People Enrichment method

### Frontend Implementation

- **Component**: DataEnrichment.tsx
- **Tab**: Contact Enrichment tab
- **State Management**: React hooks for file handling and results
- **UI Components**: Material-UI components for file upload and results display

## Best Practices

1. **File Preparation**: Use clear, descriptive column headers
2. **Data Quality**: Ensure contact names and companies are accurate
3. **Batch Size**: Process files with reasonable numbers of contacts (10-100)
4. **API Credits**: Monitor your Apollo API usage and credits
5. **Results Review**: Always review enriched data for accuracy

## Comparison with Other Tabs

| Feature | File Enrichment | Organization Enrichment | Contact Enrichment | Contact Search |
|---------|----------------|------------------------|-------------------|----------------|
| **Purpose** | General contact enrichment | Company data enrichment | Individual contact enrichment | Search for new contacts |
| **Input** | Excel with contacts | Excel with companies | Excel with contacts | Search criteria |
| **API Used** | Apollo People Search | Apollo Organization Enrichment | Apollo People Enrichment | Apollo People Search |
| **Output** | Enriched contact data | Company information | Enriched contact data | New contact discoveries |
| **Use Case** | Bulk contact enrichment | Company research | Individual contact verification | Lead generation |

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review server logs for API errors
3. Verify Apollo API key configuration
4. Ensure file format and structure are correct
