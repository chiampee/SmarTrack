# Chrome Web Store - Data Usage Form Answers

## Section 1: What user data do you plan to collect from users now or in the future?

### ✅ CHECK THESE BOXES:

#### 1. ✅ **Personally identifiable information**
**Justification:**
- Email address collected via Auth0 for user authentication and account management
- Optional display name for user profile personalization
- This is necessary for user accounts, authentication, and providing personalized service

#### 2. ✅ **Authentication information**
**Justification:**
- Auth0 authentication tokens stored locally in browser storage for session management
- These tokens enable users to remain logged in across browser sessions
- Passwords are handled entirely by Auth0 (Google OAuth), not stored by our extension
- Token storage is necessary for seamless user experience and offline capability

#### 3. ✅ **Location** (IP address only)
**Justification:**
- IP addresses are automatically collected by our backend server for API requests (standard web server logging)
- We do NOT collect GPS coordinates or precise location data
- IP addresses are used for security (fraud prevention, rate limiting) and are not used to determine geographic location
- This is standard practice for web services and necessary for API security

#### 4. ✅ **Website content**
**Justification:**
- When a user explicitly clicks "Save" on a webpage, we extract and store:
  - Page title
  - Page description
  - Page metadata (Open Graph tags, article metadata)
  - Extracted text content (for AI summarization)
- This content is ONLY collected from pages the user explicitly chooses to save
- We do NOT access or store content from pages the user does not save
- This is the core functionality of the extension - saving web content to the user's knowledge library

### ❌ DO NOT CHECK THESE BOXES:

#### ❌ **Health information**
- We do not collect any health-related data

#### ❌ **Financial and payment information**
- SmarTrack is a free service with no payment processing
- We do not collect any financial information

#### ❌ **Personal communications**
- We do not access emails, texts, or chat messages

#### ❌ **Web history**
- We explicitly do NOT track browsing history
- We only save pages that users explicitly choose to save by clicking the extension icon
- Our privacy policy states: "We do NOT track your browsing history or pages you don't save"

#### ❌ **User activity**
- We do not monitor network activity, clicks, mouse position, scroll, or keystroke logging
- We only collect basic aggregate analytics (page views, feature usage) which is anonymized and not tied to individual user activity patterns

---

## Section 2: Certifications

### ✅ CHECK ALL THREE BOXES:

#### ✅ **Certification 1: "I do not sell or transfer user data to third parties, apart from the approved use cases"**

**Justification:**
- SmarTrack does not sell user data to any third parties
- We do not transfer user data to data brokers or advertising networks
- The only data transfers are:
  - **Auth0 (Google)**: For authentication services (approved use case - authentication provider)
  - **Backend API**: User's own data is stored on our secure backend for the user's access (not a third-party transfer, it's our own infrastructure)
- Our privacy policy explicitly states: "We Never: Sell your data to third parties" and "We do not sell personal information"

#### ✅ **Certification 2: "I do not use or transfer user data for purposes that are unrelated to my item's single purpose"**

**Justification:**
- SmarTrack's single purpose is: **Enabling users to save, organize, and retrieve web content in a searchable knowledge library**
- All data collection and usage is directly related to this purpose:
  - **Email address**: Required for user authentication and account management
  - **Auth tokens**: Required for secure API access to user's saved content
  - **Saved page content**: The core feature - storing content users choose to save
  - **IP addresses**: Required for API security and rate limiting (standard web service practice)
- We do NOT use data for:
  - Advertising or marketing
  - Building user profiles for third parties
  - Training AI models on user content (our privacy policy explicitly states this)
  - Any purpose unrelated to the knowledge management functionality

#### ✅ **Certification 3: "I do not use or transfer user data to determine creditworthiness or for lending purposes"**

**Justification:**
- SmarTrack is a free knowledge management tool with no financial services
- We do not collect financial information
- We do not assess creditworthiness
- We do not provide lending services
- This certification is straightforward as our service has no financial component

---

## Summary Checklist

### Data Types to Check:
- ✅ Personally identifiable information
- ✅ Authentication information  
- ✅ Location (IP address only)
- ✅ Website content

### Data Types NOT to Check:
- ❌ Health information
- ❌ Financial and payment information
- ❌ Personal communications
- ❌ Web history
- ❌ User activity

### Certifications:
- ✅ All three certifications must be checked

---

## Important Notes for Reviewers

1. **Transparency**: Our privacy policy (https://smar-track.vercel.app/privacy) clearly documents all data collection practices and aligns with these disclosures.

2. **Minimal Data Collection**: We collect only the minimum data necessary for the extension's core functionality.

3. **User Control**: Users can delete their account and all data at any time. All data is user-specific and isolated.

4. **No Tracking**: We explicitly do NOT track browsing history, user activity patterns, or any data from pages users don't explicitly save.

5. **Security**: All data is encrypted in transit (HTTPS) and at rest, stored on secure cloud infrastructure.

6. **Single Purpose Compliance**: All data collection directly supports the single purpose of enabling users to save and organize web content.
