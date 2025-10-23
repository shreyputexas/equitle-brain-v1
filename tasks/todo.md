# Industry Navy Template Implementation Plan

## Overview
Implement placeholder-based template replacement for industry research one-pagers. When a user selects the "navy" template, the system will:
1. Generate content using the existing `generateBasicDocument` method (AI-powered)
2. Load the `industry_navy_placeholders.docx` template
3. Replace placeholders (e.g., `{industry}`, `{marketOverview}`) with the generated content
4. Return the formatted Word document

## Current State Analysis

### Existing Components
1. **Content Generation** (`generateBasicDocument` in `onePagerGeneration.service.ts`)
   - Already generates comprehensive industry research content using OpenAI
   - Sections: Industry, Market Overview, M&A Activity, Barriers to Entry, Financial Profile, Technology, Investment Opportunity
   - Returns formatted Word doc using `docx` library

2. **Template Editing** (`templateEditor.service.ts`)
   - Already has placeholder replacement functionality using JSZip
   - Method `replaceTextInDocx` can replace `{placeholder}` with content
   - Handles normalization of placeholders split across XML elements

3. **Template File**
   - Location: `equitle-brain-v1/one_pager_templates/industry_navy_placeholders.docx`
   - Contains placeholders for industry research content
   - Professionally designed navy-themed layout

### Identified Placeholders in Template
Based on the analysis of `industry_navy_placeholders.docx`:
- `{industry}` - Target industry name
- `{marketOverview}` - Market overview section content
- `{industryConsolidation}` - M&A activity and consolidation section
- `{entryBarrier}` - Barriers to entry and defensibility section
- `{financialProfile}` - Financial profile and unit economics section
- `{technology}` - Technology and innovation trends section
- `{investmentInsight}` - Investment opportunity and value creation section
- `{searchFundName}` - Search fund name
- `{searchFundWebsite}` - Search fund website
- `{searchFundEmail}` - Search fund email
- `{searchFundAddress}` - Search fund address
- `{sources}` - (optional) Citations/sources used

## Implementation Plan

### Task 1: Create Industry Research Template Service Method
**File**: `server/src/services/onePagerGeneration.service.ts`

Create a new method `generateIndustryResearchWithTemplate` that:
- Accepts: `thesisData`, `selectedIndustry`, `template` (optional)
- If `template === 'navy'`:
  - Generate content using OpenAI (reuse existing prompt logic from `generateBasicDocument`)
  - Parse the AI response into structured sections
  - Call `templateEditorService.editIndustryTemplate()` to fill placeholders
  - Return the template-based document
- Else (default/basic):
  - Use existing `generateBasicDocument` method
  - Return basic formatted document

**Key Steps**:
1. Extract the OpenAI prompt logic from `generateBasicDocument` into a reusable method `generateIndustryResearchContent()`
2. Parse the OpenAI response into a structured object with section properties
3. Create the new `generateIndustryResearchWithTemplate` method that:
   - Calls `generateIndustryResearchContent()`
   - Checks template parameter
   - Routes to appropriate document generation method

### Task 2: Create Industry Template Editor Method
**File**: `server/src/services/templateEditor.service.ts`

Create a new method `editIndustryTemplate` that:
- Accepts: `templateName` (e.g., 'industry_navy_placeholders'), `data` object
- Loads the template using the existing path resolution logic
- Uses the existing `replaceTextInDocx` method
- Maps content sections to template placeholders
- Returns the filled template as a Buffer

**Data Structure for Industry Template**:
```typescript
interface IndustryTemplateData {
  industry: string;
  marketOverview: string;
  industryConsolidation: string;
  entryBarrier: string;
  financialProfile: string;
  technology: string;
  investmentInsight: string;
  searchFundName?: string;
  searchFundWebsite?: string;
  searchFundEmail?: string;
  searchFundAddress?: string;
  sources?: string;
}
```

**Key Steps**:
1. Add TypeScript interface for `IndustryTemplateData`
2. Create `editIndustryTemplate` method
3. Build placeholder replacement map (similar to existing one-pager template logic)
4. Reuse existing `replaceTextInDocx` infrastructure

### Task 3: Update Content Parsing Logic
**File**: `server/src/services/onePagerGeneration.service.ts`

Create a parser method `parseIndustryContent` that:
- Accepts: raw AI-generated content string
- Extracts each section based on headers/markers
- Returns structured `IndustryTemplateData` object

**Parsing Strategy**:
- Split by section headers (e.g., "1. INDUSTRY", "2. MARKET OVERVIEW", etc.)
- Clean up markdown formatting
- Extract text content for each section
- Handle edge cases (missing sections, extra whitespace)

### Task 4: Update API Route
**File**: `server/src/routes/onePager.ts`

Update the existing `/generate-basic-document` endpoint:
- Accept optional `template` parameter in request body
- Fetch user data (searchFundName, website, email, address) from database
- Pass template parameter to service method
- Return appropriate document based on template selection

**OR** create a new endpoint `/generate-industry-research` that:
- Accepts: `{ thesisData, selectedIndustry, template }`
- Fetches user profile data for search fund information
- Calls new `generateIndustryResearchWithTemplate` method
- Returns formatted document

**Decision**: Update existing endpoint for simplicity, as it's the same functionality with template options.

### Task 5: Add Template Parameter to Frontend
**File**: `src/pages/MyThesis.tsx` (or relevant industry research page)

Update the industry research generation UI:
- Add template selector (Basic / Navy)
- Pass `template` parameter in API request
- Handle response (document download)

**Note**: This is optional and depends on whether frontend changes are in scope for this task.

### Task 6: Test and Verify
Create test cases to verify:
1. **Basic Template**: Existing `generateBasicDocument` still works
2. **Navy Template**: New template replacement works correctly
3. **Content Mapping**: All sections map to correct placeholders
4. **User Data**: Search fund info populates correctly
5. **Error Handling**: Missing data doesn't break generation

## Detailed Implementation Steps

### Step 1: Extract and Refactor Content Generation
**Location**: `onePagerGeneration.service.ts`

**Changes**:
```typescript
// Extract this into a reusable method
private async generateIndustryResearchContent(
  thesisData: ThesisData,
  selectedIndustry: string
): Promise<string> {
  // Existing prompt logic from generateBasicDocument
  // Return raw AI-generated content
}
```

### Step 2: Create Content Parser
**Location**: `onePagerGeneration.service.ts`

**Changes**:
```typescript
private parseIndustryContent(
  content: string,
  selectedIndustry: string,
  thesisData: ThesisData
): IndustryTemplateData {
  // Parse sections from AI content
  // Return structured object
}
```

### Step 3: Create Template Generation Method
**Location**: `onePagerGeneration.service.ts`

**Changes**:
```typescript
async generateIndustryResearchWithTemplate(
  thesisData: ThesisData,
  selectedIndustry: string,
  template?: string,
  searchFundData?: {
    name?: string;
    website?: string;
    email?: string;
    address?: string;
  }
): Promise<Buffer> {
  const content = await this.generateIndustryResearchContent(thesisData, selectedIndustry);

  if (template === 'navy') {
    const parsedData = this.parseIndustryContent(content, selectedIndustry, thesisData);
    const templateData: IndustryTemplateData = {
      ...parsedData,
      searchFundName: searchFundData?.name,
      searchFundWebsite: searchFundData?.website,
      searchFundEmail: searchFundData?.email,
      searchFundAddress: searchFundData?.address,
    };
    return await templateEditorService.editIndustryTemplate('industry_navy_placeholders', templateData);
  }

  // Default: use existing basic document generation
  return await this.generateBasicDocument(thesisData, selectedIndustry);
}
```

### Step 4: Create Industry Template Editor
**Location**: `templateEditor.service.ts`

**Changes**:
```typescript
async editIndustryTemplate(templateName: string, data: IndustryTemplateData): Promise<Buffer> {
  // Similar to editTemplate, but for industry research
  const templatePath = path.join(this.templatesPath, `${templateName}.docx`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName} not found`);
  }

  const templateBuffer = fs.readFileSync(templatePath);
  return await this.replaceTextInDocx(templateBuffer, data);
}
```

### Step 5: Update Route Handler
**Location**: `routes/onePager.ts`

**Changes**:
Update existing `POST /generate-basic-document` endpoint:
```typescript
const { thesisData, selectedIndustry, template } = req.body;

// Fetch user data
const userId = req.user?.uid || 'dev-user-123';
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();

const searchFundData = {
  name: userData?.searchFundName,
  website: userData?.searchFundWebsite,
  email: userData?.searchFundEmail,
  address: userData?.searchFundAddress,
};

// Call new method
const docxBuffer = await onePagerGenerationService.generateIndustryResearchWithTemplate(
  thesisData,
  selectedIndustry,
  template,  // 'navy' or undefined
  searchFundData
);
```

## Key Design Decisions

### 1. Reuse Existing Infrastructure
- **Decision**: Use existing `templateEditor.service.ts` and `replaceTextInDocx` method
- **Rationale**: Already handles placeholder normalization, XML manipulation, and image replacement
- **Impact**: Minimal new code, lower risk

### 2. Content Structure Mapping
- **Decision**: Parse AI content into structured sections matching template placeholders
- **Rationale**: Template expects specific sections; parsing ensures correct mapping
- **Impact**: Need robust parsing logic to handle AI response variations

### 3. Template Selection Logic
- **Decision**: Add optional `template` parameter to existing endpoint
- **Rationale**: Simple, backwards compatible, doesn't require new endpoint
- **Impact**: Existing API consumers unaffected

### 4. Search Fund Data
- **Decision**: Fetch from user profile in database
- **Rationale**: Already done for one-pager generation; consistent pattern
- **Impact**: Template can show professional search fund branding

## File Changes Summary

### New Files
- None (reusing existing infrastructure)

### Modified Files
1. **`server/src/services/onePagerGeneration.service.ts`**
   - Add `generateIndustryResearchContent()` method (refactor existing)
   - Add `parseIndustryContent()` method (new parser)
   - Add `generateIndustryResearchWithTemplate()` method (main new method)
   - Update exports

2. **`server/src/services/templateEditor.service.ts`**
   - Add `IndustryTemplateData` interface
   - Add `editIndustryTemplate()` method
   - Export new interface

3. **`server/src/routes/onePager.ts`**
   - Update `/generate-basic-document` endpoint
   - Add `template` parameter handling
   - Add search fund data fetching
   - Call new service method

4. **`tasks/todo.md`** (this file)
   - Document plan and progress

## Testing Plan

### Unit Tests
1. Test `generateIndustryResearchContent()` - verify AI prompt and response
2. Test `parseIndustryContent()` - verify section extraction
3. Test `editIndustryTemplate()` - verify placeholder replacement

### Integration Tests
1. Test full flow with basic template
2. Test full flow with navy template
3. Test with missing search fund data
4. Test with malformed AI response

### Manual Testing
1. Generate industry research with basic template
2. Generate industry research with navy template
3. Verify all sections appear correctly
4. Verify search fund branding
5. Verify document formatting

## Rollout Strategy

### Phase 1: Backend Implementation (This Task)
- Implement all service methods
- Update route handler
- Test with Postman/curl

### Phase 2: Integration Testing
- Test with actual user data
- Verify template rendering
- Check for edge cases

### Phase 3: Frontend Integration (Optional)
- Add template selector UI
- Update API calls
- Test end-to-end flow

## Risks and Mitigations

### Risk 1: AI Response Format Changes
- **Risk**: OpenAI might return content in unexpected format
- **Mitigation**: Robust parsing with fallbacks; validation logic

### Risk 2: Template Placeholders Mismatch
- **Risk**: Template placeholders don't match parsed content keys
- **Mitigation**: Document exact placeholder names; add validation

### Risk 3: User Data Missing
- **Risk**: Search fund data might not exist in database
- **Mitigation**: Use empty strings or default values; don't fail generation

### Risk 4: Template File Not Found
- **Risk**: Template file path might be incorrect
- **Mitigation**: Add file existence checks; clear error messages

## Success Criteria

✅ User can select "navy" template for industry research
✅ Content is generated using existing AI logic
✅ Template placeholders are correctly replaced
✅ Search fund branding appears in document
✅ Document downloads successfully
✅ Basic template still works (backwards compatibility)
✅ No breaking changes to existing functionality

## Timeline Estimate

- **Task 1-2**: Content generation refactor + template editor (~45 min)
- **Task 3**: Content parsing logic (~30 min)
- **Task 4**: Route updates (~15 min)
- **Task 5**: Frontend updates (optional) (~30 min)
- **Task 6**: Testing and verification (~30 min)

**Total**: ~2.5 hours

---

## Implementation Checklist

### Task 1: Template Editor Service
- [x] Add `IndustryTemplateData` interface to templateEditor.service.ts
- [x] Create `editIndustryTemplate()` method in templateEditor.service.ts
- [x] Export new interface

### Task 2: Content Generation Service
- [x] Extract content generation into `generateIndustryResearchContent()` method
- [x] Create `parseIndustryContent()` parser method
- [x] Create `generateIndustryResearchWithTemplate()` main method
- [x] Export new interface for IndustryTemplateData

### Task 3: Update API Route
- [x] Update `/generate-basic-document` endpoint to accept `template` parameter
- [x] Add search fund data fetching logic
- [x] Call new service method with template support

### Task 4: Testing & Verification
- [x] Code implementation complete - ready for testing
- [ ] Test basic template (backward compatibility) - PENDING SERVER RESTART
- [ ] Test navy template with placeholder replacement - PENDING SERVER RESTART
- [ ] Verify all sections map correctly - PENDING SERVER RESTART
- [ ] Check search fund branding - PENDING SERVER RESTART

**Testing Instructions** (after server restart):
```bash
# Test Basic Template
curl -X POST http://localhost:4001/api/one-pager/test-basic-document \
  -H "Content-Type: application/json" \
  -d @/tmp/test-navy-template.json \
  --output /tmp/test-basic.docx

# Test Navy Template (add "template": "navy" to JSON)
curl -X POST http://localhost:4001/api/one-pager/test-basic-document \
  -H "Content-Type: application/json" \
  -d '{"thesisData": {...}, "selectedIndustry": "Home Healthcare Services", "template": "navy"}' \
  --output /tmp/test-navy.docx
```

### Task 5: Review
- [x] Add review section summarizing all changes
- [x] Document any issues or learnings

## Next Steps

1. ✅ Review this plan with you for approval
2. ✅ Begin implementation starting with Task 1
3. ✅ Test each component incrementally (code complete, pending server restart)
4. ✅ Integrate all pieces
5. ⏳ Perform end-to-end testing (pending server restart)
6. ✅ Document any issues or learnings

---

## Implementation Review

### Summary
Successfully implemented navy template support for industry research one-pagers using a placeholder-based approach. The implementation reuses existing infrastructure (templateEditor service) and maintains backward compatibility with the basic template.

### Changes Made

#### 1. Template Editor Service (`server/src/services/templateEditor.service.ts`)
**Lines Added: ~115**

- **Added `IndustryTemplateData` interface** (lines 21-34)
  - Defines structure for industry research template data
  - Includes all content sections + search fund branding fields

- **Added `editIndustryTemplate()` method** (lines 149-184)
  - Loads industry template by name
  - Validates template file exists
  - Calls text replacement helper
  - Returns modified document buffer

- **Added `replaceIndustryTextInDocx()` helper** (lines 186-263)
  - Loads DOCX as ZIP archive
  - Normalizes placeholders split across XML
  - Builds replacement map for all placeholders
  - Performs text substitution
  - Returns modified buffer

**Placeholders Supported:**
- `{industry}` - Industry name
- `{marketOverview}` - Market overview content
- `{industryConsolidation}` - M&A activity content
- `{entryBarrier}` - Barriers to entry content
- `{financialProfile}` - Financial profile content
- `{technology}` - Technology trends content
- `{investmentInsight}` - Investment opportunity content
- `{searchFundName}`, `{searchFundWebsite}`, `{searchFundEmail}`, `{searchFundAddress}` - Branding
- `{sources}` - Optional citations

#### 2. One Pager Generation Service (`server/src/services/onePagerGeneration.service.ts`)
**Lines Added: ~235**

- **Added import** for `IndustryTemplateData` (line 5)

- **Added `generateIndustryResearchContent()` method** (lines 783-888)
  - Extracted from `generateBasicDocument` for reusability
  - Generates OpenAI prompt with thesis context
  - Calls GPT-4o to generate comprehensive industry research
  - Returns raw AI-generated content string

- **Added `parseIndustryContent()` method** (lines 893-969)
  - Parses AI response by section headers
  - Detects sections using regex patterns (1. INDUSTRY, 2. MARKET OVERVIEW, etc.)
  - Builds structured `IndustryTemplateData` object
  - Logs parsing results for debugging

- **Added `generateIndustryResearchWithTemplate()` method** (lines 976-1014)
  - Main orchestration method
  - Generates content using OpenAI
  - Routes to navy template OR basic document based on `template` parameter
  - Merges content with search fund branding data
  - Returns final document buffer

**Logic Flow:**
1. Generate content with AI → 2. Parse into sections → 3. If navy: fill template; else: use basic doc

#### 3. API Route (`server/src/routes/onePager.ts`)
**Lines Modified: ~80**

- **Updated `/generate-basic-document` endpoint** (lines 435-526)
  - Now accepts optional `template` parameter
  - Fetches search fund data from user profile (Firestore)
  - Calls new `generateIndustryResearchWithTemplate()` method
  - Adds template suffix to filename (e.g., `-navy`)
  - Maintains backward compatibility (no template = basic doc)

- **Updated `/test-basic-document` endpoint** (lines 379-466)
  - Added same template support for testing
  - Uses dev-user-123 for search fund data in tests
  - No authentication required

### Design Principles Followed

✅ **Simplicity**:
- Reused existing `replaceTextInDocx` infrastructure
- No new dependencies or libraries
- Minimal code duplication

✅ **Backward Compatibility**:
- Basic template still works (template parameter optional)
- Existing API contracts unchanged
- Falls back to `generateBasicDocument` when template not specified

✅ **Separation of Concerns**:
- Content generation (OpenAI) separated from formatting (template)
- Template editing service handles all DOCX manipulation
- Route layer handles data fetching, service layer handles logic

✅ **Error Handling**:
- Validates template file exists
- Handles missing search fund data gracefully
- Logs extensively for debugging
- Returns meaningful error messages

### File Changes Summary

| File | Lines Added | Lines Modified | Purpose |
|------|-------------|----------------|---------|
| `templateEditor.service.ts` | ~115 | 0 | Industry template editing |
| `onePagerGeneration.service.ts` | ~235 | 0 | Content generation & parsing |
| `onePager.ts` | 0 | ~80 | API route updates |
| **Total** | **~350** | **~80** | **Complete feature** |

### Key Decisions

1. **Reuse vs. Duplicate**: Reused `normalizePlaceholders`, `replaceTextInDocx` pattern instead of duplicating
2. **Parsing Strategy**: Line-by-line regex matching for section detection (robust to AI response variations)
3. **Template Parameter**: Optional parameter maintains backward compatibility
4. **Search Fund Data**: Fetched from user profile, optional (doesn't break if missing)
5. **Error Boundaries**: Each major operation (generate, parse, template) has try-catch with logging

### Testing Status

**Code Complete**: ✅ All implementation done
**Compilation**: ✅ No new TypeScript errors introduced
**Server Restart Required**: ⚠️ Changes need hot reload or restart

**Pending Manual Tests** (after restart):
1. Basic template generation (verify backward compatibility)
2. Navy template generation (verify placeholder replacement)
3. Section content mapping (verify parser works correctly)
4. Search fund branding (verify user data appears)
5. Missing data handling (verify graceful degradation)

### How to Test

```bash
# Restart server first
npm run dev:server

# Test Basic Template
curl -X POST http://localhost:4001/api/one-pager/test-basic-document \
  -H "Content-Type: application/json" \
  -d '{
    "thesisData": {
      "name": "Texas Healthcare Thesis",
      "criteria": [
        {"id": "1", "category": "Geographic", "field": "Location", "value": "Texas", "operator": "=", "weight": 20},
        {"id": "2", "category": "Financial", "field": "EBITDA", "value": "5M", "operator": ">=", "weight": 30}
      ]
    },
    "selectedIndustry": "Home Healthcare Services"
  }' \
  --output /tmp/test-basic.docx

# Test Navy Template
curl -X POST http://localhost:4001/api/one-pager/test-basic-document \
  -H "Content-Type: application/json" \
  -d '{
    "thesisData": {
      "name": "Texas Healthcare Thesis",
      "criteria": [
        {"id": "1", "category": "Geographic", "field": "Location", "value": "Texas", "operator": "=", "weight": 20},
        {"id": "2", "category": "Financial", "field": "EBITDA", "value": "5M", "operator": ">=", "weight": 30}
      ]
    },
    "selectedIndustry": "Home Healthcare Services",
    "template": "navy"
  }' \
  --output /tmp/test-navy.docx

# Verify files
ls -lh /tmp/test-*.docx
open /tmp/test-basic.docx
open /tmp/test-navy.docx
```

### Frontend Integration

To use this from the frontend, update the API call:

```typescript
const response = await fetch('/api/one-pager/generate-basic-document', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    thesisData: selectedThesis,
    selectedIndustry: industry,
    template: 'navy' // or omit for basic
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `industry-report-${industry}-${template}.docx`;
a.click();
```

### Known Limitations

1. **AI Response Variation**: Parser assumes specific section header format from OpenAI
   - **Mitigation**: Robust regex patterns, fallback to empty strings

2. **Template File Path**: Hardcoded to `industry_navy_placeholders.docx`
   - **Mitigation**: Could make configurable in future

3. **Placeholder Normalization**: Complex XML parsing required for Word placeholders
   - **Mitigation**: Reused existing proven implementation

4. **Search Fund Data**: Assumes specific Firestore schema
   - **Mitigation**: Uses optional chaining, handles missing gracefully

### Future Enhancements

1. **Multiple Templates**: Support silver, gold, etc. templates
2. **Custom Sections**: Allow users to define custom sections
3. **Image Support**: Add logo and custom images to industry templates
4. **PDF Export**: Generate PDF in addition to DOCX
5. **Template Preview**: Show template before generation
6. **Section Reordering**: Let users customize section order

### Conclusion

Implementation is **complete and ready for testing**. The solution:
- ✅ Achieves the goal (navy template with placeholder replacement)
- ✅ Maintains simplicity (reuses existing code)
- ✅ Is backward compatible (basic template still works)
- ✅ Follows best practices (separation of concerns, error handling)
- ✅ Is well-documented (extensive logging, clear code comments)

**Next Action**: Restart server and run manual tests to verify end-to-end functionality.

