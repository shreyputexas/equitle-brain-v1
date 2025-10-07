# Organization Enrichment Feature

This guide explains how to use the new Organization Enrichment feature in the Data Enrichment tab.

## Overview

The Organization Enrichment feature allows you to upload an Excel file containing organization data and enrich it with comprehensive company information using Apollo's Organization Enrichment API. This includes LinkedIn links, phone numbers, emails, industry information, employee counts, and more.

## Features

- **Excel File Upload**: Support for .xlsx, .xls, and .csv files
- **Automatic Field Mapping**: Intelligently maps Excel columns to organization fields
- **Apollo Integration**: Uses Apollo's Organization Enrichment API for data enrichment
- **Comprehensive Results**: Enriches with LinkedIn, phone, email, industry, employee count, and more
- **Export Results**: Download enriched data as CSV
- **Rate Limiting**: Respects Apollo API rate limits with built-in delays

## How to Use

### 1. Access the Feature

1. Navigate to the **Data Enrichment** page
2. Click on the **Organization Enrichment** tab
3. Configure your Apollo API key if not already done

### 2. Prepare Your Excel File

Your Excel file should contain organization data with headers that can be mapped to:
- **Company Name**: `company`, `organization`, `company_name`, `organization_name`, `name`
- **Website/Domain**: `domain`, `website`, `url`, `company_website`, `website_url`
- **Industry**: `industry`, `sector`, `business_type`
- **Location**: `location`, `city`, `address`, `headquarters`

#### Sample Excel Structure:
```
Company          | Website        | Industry    | Location
Apollo.io        | apollo.io      | Software    | San Francisco
Salesforce       | salesforce.com | Software    | San Francisco
Microsoft        | microsoft.com  | Technology  | Redmond
```

### 3. Upload and Enrich

1. **Upload File**: Drag and drop your Excel file or click to browse
2. **Start Enrichment**: Click "Enrich Organizations" to begin processing
3. **Monitor Progress**: Watch the progress bar and status updates
4. **View Results**: See enriched data in the results table

### 4. Export Results

1. Click **"Download CSV"** to export all enriched data
2. The CSV includes both original and enriched data
3. Columns include: Company, Website, LinkedIn, Phone, Email, Industry, Employee Count, etc.

## Enriched Data Fields

The enrichment process adds the following information:

### Basic Information
- **Name**: Official company name
- **Website**: Company website URL
- **LinkedIn**: LinkedIn company page
- **Phone**: Company phone number
- **Email**: Company email (if available)

### Business Information
- **Industry**: Company industry/sector
- **Employee Count**: Estimated number of employees
- **Description**: Company description
- **Headquarters**: Company headquarters address
- **Revenue**: Annual revenue (if available)
- **Founded Year**: Year company was founded

### Social Media
- **LinkedIn**: LinkedIn company page
- **Twitter**: Twitter profile
- **Facebook**: Facebook page

## API Integration

### Apollo Organization Enrichment API

The feature uses Apollo's Organization Enrichment API endpoint:
- **Endpoint**: `POST /api/v1/organizations/enrich`
- **Input**: Domain name
- **Output**: Comprehensive organization data

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

The system automatically maps Excel columns to organization fields:

| Excel Column | Mapped To | Description |
|--------------|-----------|-------------|
| `company`, `organization`, `company_name` | Company Name | Organization name |
| `domain`, `website`, `url` | Website | Company website/domain |
| `industry`, `sector` | Industry | Business sector |
| `location`, `city`, `address` | Location | Company location |

## Error Handling

### Common Issues

1. **Invalid File Format**: Only Excel and CSV files are supported
2. **Missing Data**: Files must contain at least company names or domains
3. **API Errors**: Apollo API errors are logged and displayed
4. **Rate Limiting**: Built-in delays prevent rate limit issues

### Troubleshooting

- **No Results**: Check that your Excel file has proper headers
- **API Errors**: Verify your Apollo API key is valid and has sufficient credits
- **File Upload Issues**: Ensure file is under 10MB and in supported format

## Sample Files

A sample CSV file is provided at `sample-organizations.csv` with example data for testing.

## Technical Details

### Backend Implementation

- **Route**: `/api/data-enrichment/organization-enrich`
- **Method**: POST
- **File Processing**: Uses xlsx library for Excel parsing
- **API Integration**: Apollo Service with organization enrichment method

### Frontend Implementation

- **Component**: DataEnrichment.tsx
- **Tab**: Organization Enrichment tab
- **State Management**: React hooks for file handling and results
- **UI Components**: Material-UI components for file upload and results display

## Best Practices

1. **File Preparation**: Use clear, descriptive column headers
2. **Data Quality**: Ensure company names and domains are accurate
3. **Batch Size**: Process files with reasonable numbers of organizations (10-100)
4. **API Credits**: Monitor your Apollo API usage and credits
5. **Results Review**: Always review enriched data for accuracy

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review server logs for API errors
3. Verify Apollo API key configuration
4. Ensure file format and structure are correct
