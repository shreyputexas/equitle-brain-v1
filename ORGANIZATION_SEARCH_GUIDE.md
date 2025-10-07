# Organization Search Feature

This guide explains how to use the new Organization Search feature in the Data Enrichment page.

## Overview

The Organization Search feature allows you to find businesses based on specific criteria using Apollo's Organization Search API. You can search for companies by industry, location, revenue, growth rate, employee count, and other financial metrics to get detailed company information including CEO names, websites, emails, phone numbers, revenue, growth, EBITDA, and location.

## Features

- **Advanced Search Criteria**: Search by industry, subindustry, location, revenue, EBITDA, growth rate, employee count, founded year, and keywords
- **Comprehensive Results**: Get detailed company information including CEO, revenue, growth, EBITDA, funding, and contact details
- **Apollo Integration**: Uses Apollo's Organization Search API for accurate, up-to-date company data
- **Financial Analysis**: Automatic calculation of average revenue, employee count, and industry distribution
- **Rate Limiting**: Built-in delays to respect Apollo API limits
- **Export Ready**: Results can be downloaded as CSV for further analysis

## How to Use

### 1. Access the Feature

1. Navigate to the **Data Enrichment** page
2. Click on the **Search** tab
3. Select **Organization Search** from the dropdown
4. Configure your Apollo API key if not already done

### 2. Enter Search Criteria

Fill out the search form with your criteria:

#### Required Fields
- **Industries**: Target industries (comma-separated)
  - Example: `Technology, Healthcare, Finance`
  - Example: `SaaS, Fintech, MedTech`

#### Optional Fields
- **Subindustries**: Specific subindustries or focus areas
  - Example: `SaaS, Fintech, MedTech`
  - Example: `AI, Machine Learning, Blockchain`

- **Location**: Geographic location criteria
  - Example: `San Francisco, New York, Remote`
  - Example: `California, Texas, Remote`

- **Revenue**: Revenue range criteria
  - Example: `$1M-$10M`
  - Example: `$10M+`

- **EBITDA**: Minimum EBITDA requirements
  - Example: `$500K-$5M`
  - Example: `$1M+`

- **Growth Rate**: Annual growth rate
  - Example: `20%+`
  - Example: `10%-50%`

- **Employee Count**: Company size range
  - Example: `10-100`
  - Example: `100-500`

- **Founded Year**: Year range when founded
  - Example: `2015-2020`
  - Example: `2020+`

- **Keywords**: Additional keywords to refine search
  - Example: `AI, Machine Learning, Blockchain`
  - Example: `Sustainability, Green Tech`

- **Number of Organizations to Find**: Maximum organizations to return (1-100)

### 3. Search and View Results

1. Click **"Search Organizations"** to start the search
2. Monitor progress with the loading indicator
3. View results in the comprehensive results table
4. Review summary statistics including average revenue and employee count

## Search Results Data

The search returns comprehensive organization data including:

### Basic Information
- **Company Name**: Official company name
- **Website**: Company website URL
- **Industry**: Primary industry classification
- **Location**: City, state, and country
- **Description**: Company description and overview

### Leadership Information
- **CEO Name**: Chief Executive Officer name
- **CEO Contact**: CEO email and phone (when available)
- **LinkedIn**: Company LinkedIn profile

### Financial Information
- **Revenue**: Annual revenue (formatted as $1M, $10B, etc.)
- **EBITDA**: Earnings Before Interest, Taxes, Depreciation, and Amortization
- **Growth Rate**: Year-over-year growth percentage
- **Funding**: Total funding raised
- **Last Funding Date**: Most recent funding round date
- **Founded Year**: Year the company was founded

### Contact Information
- **Phone**: Company phone number
- **Email**: General company email
- **LinkedIn**: Company LinkedIn profile URL

### Operational Information
- **Employee Count**: Number of employees
- **Company Size**: Size classification (startup, mid-size, enterprise)
- **Headquarters**: Main office location

## API Integration

### Apollo Organization Search API

The feature uses Apollo's Organization Search API:
- **Endpoint**: `POST /api/v1/mixed_people/search`
- **Input**: Search criteria (industry, location, financial metrics, etc.)
- **Output**: Comprehensive organization data with financial and contact information

### Rate Limiting

- Built-in 500ms delay between organization detail requests
- Respects Apollo's rate limits
- Handles API errors gracefully

## Search Criteria Examples

### Technology Startups
```
Industries: Technology, Software
Subindustries: SaaS, Fintech, AI
Location: San Francisco, New York, Remote
Revenue: $1M-$10M
Employee Count: 10-100
Founded Year: 2015-2020
Keywords: AI, Machine Learning
```

### Healthcare Companies
```
Industries: Healthcare, Biotechnology
Subindustries: MedTech, Digital Health
Location: Boston, San Diego, Remote
Revenue: $5M-$50M
Growth Rate: 20%+
Keywords: Telemedicine, Diagnostics
```

### Finance Companies
```
Industries: Finance, Banking
Subindustries: Fintech, InsurTech
Location: New York, London, Remote
Revenue: $10M+
Employee Count: 50-500
Keywords: Blockchain, Cryptocurrency
```

## Results Analysis

### Summary Statistics
- **Total Organizations Found**: Number of companies matching criteria
- **Average Revenue**: Mean revenue across all found companies
- **Average Employee Count**: Mean employee count across all found companies
- **Top Industries**: Most common industries in results

### Data Quality
- **Complete Data**: Organizations with full financial and contact information
- **Partial Data**: Organizations with some missing information
- **Basic Data**: Organizations with minimal information available

## Best Practices

### Search Optimization
1. **Start Broad**: Begin with general industry and location criteria
2. **Refine Gradually**: Add specific criteria to narrow results
3. **Use Keywords**: Include relevant keywords for better targeting
4. **Limit Results**: Start with 10-20 organizations to test criteria

### Data Quality
1. **Verify Information**: Cross-reference important data points
2. **Check Recency**: Ensure data is current and relevant
3. **Validate Contacts**: Verify contact information before outreach
4. **Review Financials**: Confirm financial data accuracy

### Rate Limiting
1. **Batch Searches**: Process searches in reasonable batches
2. **Monitor API Usage**: Keep track of Apollo API credits
3. **Respect Limits**: Don't exceed Apollo's rate limits
4. **Plan Ahead**: Schedule searches during off-peak hours

## Comparison with Other Features

| Feature | Purpose | Input | Output | API Used |
|---------|---------|-------|--------|----------|
| **Contact Enrichment** | Enrich existing contact data | Excel file with contacts | Enhanced contact information | Apollo People Enrichment |
| **Organization Enrichment** | Enrich existing company data | Excel file with companies | Enhanced company information | Apollo Organization Enrichment |
| **Contact Search** | Find new contacts | Search criteria | New contact discoveries | Apollo People Search |
| **Organization Search** | Find new companies | Search criteria | New company discoveries | Apollo Organization Search |

## Technical Implementation

### Frontend Structure
- **Main Tabs**: Enrichment vs Search
- **Sub Tabs**: Contact vs Organization
- **Search Form**: Comprehensive criteria input form
- **Results Display**: Table with detailed organization information
- **Summary Stats**: Key metrics and statistics

### Backend Implementation
- **Route**: `/api/data-enrichment/search-organizations`
- **Method**: POST
- **Processing**: Apollo API integration with data enrichment
- **Rate Limiting**: Built-in delays and error handling

### Data Processing
- **Search**: Apollo Organization Search API
- **Enrichment**: Additional organization details
- **Statistics**: Revenue, employee, and industry analysis
- **Formatting**: Data formatting and presentation

## Troubleshooting

### Common Issues

1. **No Results Found**
   - Check search criteria specificity
   - Try broader industry terms
   - Verify location spelling
   - Check Apollo API credits

2. **Incomplete Data**
   - Some organizations may have limited public information
   - Financial data may not be available for private companies
   - Contact information may be restricted

3. **API Errors**
   - Verify Apollo API key is valid and active
   - Check API credit balance
   - Ensure rate limits are not exceeded
   - Review server logs for specific errors

### Error Messages

- **"Apollo API key is required"**: Configure your API key in settings
- **"At least Industries or Subindustries must be provided"**: Add required search criteria
- **"No organizations found matching criteria"**: Try broader search terms
- **"Failed to search organizations"**: Check API key and credits

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review server logs for API errors
3. Verify Apollo API key configuration
4. Ensure search criteria are properly formatted
5. Check Apollo API credit balance

## Future Enhancements

Potential improvements for the Organization Search feature:
- **Advanced Filters**: More granular search criteria
- **Saved Searches**: Save and reuse search criteria
- **Export Options**: Multiple export formats (Excel, PDF)
- **Integration**: Connect with CRM systems
- **Analytics**: Search performance and result analysis
- **Alerts**: Notifications for new matching organizations
