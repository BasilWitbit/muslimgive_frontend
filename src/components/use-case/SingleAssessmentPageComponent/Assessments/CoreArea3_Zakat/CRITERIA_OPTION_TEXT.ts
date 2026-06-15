export const CRITERIA_OPTION_TEXT: Record<string, Record<string, string>> = {
  // ===== SECTION 1: MANDATORY METRICS (M1-M6) =====
  "M1.1": {
    "strong": "Explicitly stated, policy clearly commits to distributing within one lunar year (hawl)",
    "moderate": "Implied or referenced indirectly but not explicitly stated as a firm policy commitment",
    "needs_improvement": "Distribution timeframe mentioned but hawl not referenced or commitment is vague",
    "concern": "No mention of distribution timeframe"
  },
  "M1.2": {
    "strong": "Specific distribution window disclosed (e.g., 'within 30-90 days', 'quarterly', or similar concrete timeframe)",
    "moderate": "General timeframe mentioned but vague, uses terms like 'as soon as possible' or 'regularly' without specifics",
    "needs_improvement": "Timeline disclosed for some fund types or programmes only, not across all Zakat collected",
    "concern": "No specific timeline disclosed"
  },
  "M2.1": {
    "strong": "Explicitly states whether admin fees are or are not deducted from Zakat, with reference to the 12.5% classical limit",
    "moderate": "Mentions fees exist but does not clearly state whether they are deducted from Zakat specifically",
    "needs_improvement": "Acknowledges admin fees are taken from Zakat but does not specify percentage or reference classical fiqh limit",
    "concern": "No disclosure of whether admin fees are deducted from Zakat"
  },
  "M2.2": {
    "strong": "Exact percentage or flat fee amount disclosed (must be ≤ 12.5%)",
    "moderate": "Fees mentioned but exact percentage or amount is unclear or unspecified",
    "needs_improvement": "Range given rather than exact figure, or amount disclosed but exceeds 12.5%",
    "concern": "No percentage or amount disclosed"
  },
  "M2.3": {
    "strong": "Explicitly states '0% admin fees from Zakat' where applicable",
    "moderate": "States admin costs are covered by another fund but provides no proof or supporting detail",
    "needs_improvement": "Implies zero fees are charged but does not state this explicitly",
    "concern": "No mention of fee status where 0% may apply"
  },
  "M3.1": {
    "strong": "Separate Zakat bank account(s) disclosed and verified (e.g., account number or bank statement reference provided)",
    "moderate": "Claims separate account exists but no account number or verification detail provided",
    "needs_improvement": "Separate account referenced in policy only, with no operational evidence",
    "concern": "No mention of a separate Zakat bank account"
  },
  "M3.2": {
    "strong": "Financial statements clearly show Zakat as a separate fund with its own line items",
    "moderate": "Financial statements mention Zakat funds but segregation is not clearly demonstrated",
    "needs_improvement": "Zakat referenced in financial statements but not segregated from general income/expenditure",
    "concern": "Financial statements show no segregation of Zakat funds"
  },
  "M3.3": {
    "strong": "Audit trail or auditor's note confirms Zakat was never mixed with general funds",
    "moderate": "Claims separation but no audit trail or third-party verification provided",
    "needs_improvement": "Internal records reference separation but no independent audit trail exists",
    "concern": "No audit trail, or audit confirms funds were mixed"
  },
  "M4.1": {
    "strong": "All 8 Qur'anic categories explicitly named and listed",
    "moderate": "References 'eligible recipients' or 'the poor' without naming all 8 categories",
    "needs_improvement": "Lists some but not all 8 categories",
    "concern": "No categories listed or disclosed"
  },
  "M4.2": {
    "strong": "Nisab threshold for recipients explicitly defined",
    "moderate": "Mentions eligibility criteria but nisab threshold is unclear or only partially described",
    "needs_improvement": "Nisab referenced but not defined with any specificity",
    "concern": "No mention of nisab threshold for recipients"
  },
  "M5.1": {
    "strong": "Complete fund flow chain explained: Donor Charity (as wakil/agent) → Eligible recipient, with ownership transfer at each stage disclosed",
    "moderate": "Distribution described but the charity's role as wakil/agent is not mentioned or the chain is only partially explained",
    "needs_improvement": "Donor-to-charity stage described but charity-to-recipient transfer is absent or ambiguous",
    "concern": "No fund flow chain disclosed"
  },
  "M5.2": {
    "strong": "Explicitly confirms recipients receive unrestricted cash or assistance enabling full ownership (tamlik tamm)",
    "moderate": "Describes in-kind distribution without explaining tamlik compliance, or ownership transfer is unclear",
    "needs_improvement": "Mentions ownership transfer but does not confirm it is full and unrestricted",
    "concern": "No mention of tamlik or full ownership transfer to recipients"
  },
  "M6.1": {
    "strong": "Cost or percentage of fundraising campaigns explicitly disclosed",
    "moderate": "Mentions fundraising activities but cost or percentage not disclosed",
    "needs_improvement": "Fundraising costs partially disclosed (e.g., for some campaigns only)",
    "concern": "No fundraising cost disclosure"
  },
  "M6.2": {
    "strong": "Clearly shows fundraising is covered by general donations and explicitly states Zakat is not used for fundraising",
    "moderate": "Unclear whether Zakat is used for fundraising, no explicit confirmation either way",
    "needs_improvement": "Confirms Zakat is not used but does not show what covers fundraising costs instead",
    "concern": "Zakat used for fundraising, or no disclosure at all"
  },

  // ===== SECTION 2: ZAKAT DONATION POLICY (P1-P5) =====
  "P1.1": {
    "strong": "Zakat policy accessible directly from main menu or homepage",
    "moderate": "Policy exists online but requires extensive searching, multiple clicks, or is not available online at all",
    "needs_improvement": "Policy accessible online but not prominent, requires more than one click from homepage",
    "concern": "No publicly accessible Zakat policy found"
  },
  "P1.2": {
    "strong": "Clearly and explicitly labeled 'Zakat Policy' with straightforward navigation",
    "moderate": "Policy exists but is unlabeled, generically titled, or buried in FAQS",
    "needs_improvement": "Policy found but label is ambiguous (e.g., 'Donation Policy' covering Zakat among other things)",
    "concern": "Policy not labeled or identifiable as a Zakat policy"
  },
  "P2.1": {
    "strong": "Policy explicitly covers eligibility criteria, distribution process, and timelines",
    "moderate": "Policy covers some of these elements but at least one is missing or vague",
    "needs_improvement": "Policy mentions these areas superficially without sufficient detail",
    "concern": "No written policy covering these elements exists"
  },
  "P2.2": {
    "strong": "Policy explicitly covers admin fees, fund separation, and Shari ah basis",
    "moderate": "Policy covers some of these elements but at least one is missing or vague",
    "needs_improvement": "Policy mentions these areas superficially without sufficient detail",
    "concern": "No written policy covering these elements exists"
  },
  "P2.3": {
    "strong": "Document is professionally formatted, clear headings, structured sections, readable layout",
    "moderate": "Policy exists but formatting is inconsistent, informal, or difficult to navigate",
    "needs_improvement": "Policy content present but presented as unformatted plain text or disorganised",
    "concern": "No written policy document exists"
  },
  "P3.1": {
    "strong": "Policy contains specific examples and local context unique to the organisation's operations",
    "moderate": "Policy is largely generic template language with minimal organisation-specific detail",
    "needs_improvement": "Policy references organisation by name but content is otherwise generic",
    "concern": "Policy is entirely generic or appears copied from another source"
  },
  "P3.2": {
    "strong": "Named personnel, roles, or internal structures explicitly referenced in the policy",
    "moderate": "Roles referenced but personnel unnamed (e.g., 'our Shari ah committee' without names)",
    "needs_improvement": "Generic reference to a board or team without any named structure",
    "concern": "No personnel or organisational structures referenced in policy"
  },
  "P4.1": {
    "strong": "Explicitly states cash is the preferred form per figh and explains acceptable forms",
    "moderate": "Accepts Zakat without specifying form preferences",
    "needs_improvement": "Mentions cash is accepted but does not address figh preference or other forms",
    "concern": "No Zakat donation form rules disclosed"
  },
  "P4.2": {
    "strong": "In-kind Zakat acceptance explicitly addressed with Shari ah justification provided",
    "moderate": "Accepts in-kind Zakat without any Shari ah justification or clarification",
    "needs_improvement": "In-kind acceptance mentioned but Shari ah basis not addressed",
    "concern": "No in-kind Zakat policy disclosed"
  },
  "P4.3": {
    "strong": "Clearly specifies whether Zakat goes to 'most needed' by default or donor can designate a category",
    "moderate": "Accepts Zakat without clarifying donor designation options",
    "needs_improvement": "Addresses designation vaguely without clear rules",
    "concern": "No donor designation rules disclosed"
  },
  "P5.1": {
    "strong": "Clear process described for verifying recipient need and assessing nisab eligibility",
    "moderate": "Mentions vetting exists but process for need verification and nisab assessment is not described",
    "needs_improvement": "Need verification mentioned at a high level but nisab assessment process absent",
    "concern": "No vetting or need verification process disclosed"
  },
  "P5.2": {
    "strong": "Documentation requirements for Zakat applicants explicitly outlined",
    "moderate": "Mentions documentation is required but does not specify what is needed",
    "needs_improvement": "Documentation referenced vaguely without any specifics",
    "concern": "No documentation requirements disclosed"
  },
  "P5.3": {
    "strong": "Process explicitly balances fraud prevention with safeguards for recipient dignity",
    "moderate": "Process described but is overly burdensome, creating barriers to legitimate recipients",
    "needs_improvement": "Anti-fraud measures referenced but no mention of dignity safeguards",
    "concern": "No consideration of fraud prevention or recipient dignity"
  },

  // ===== SECTION 3: ELIGIBLE CATEGORIES (E1-E5) =====
  "E1.1": {
    "strong": "All 8 categories named and listed explicitly",
    "moderate": "References '8 categories' or 'Qur'an recipients' without listing them individually",
    "needs_improvement": "Lists some but not all 8 categories",
    "concern": "No categories disclosed"
  },
  "E1.2": {
    "strong": "Each category listed with both Arabic name and English description",
    "moderate": "Categories listed in English only or Arabic only, without both",
    "needs_improvement": "Some categories include both Arabic and English, others do not",
    "concern": "No Arabic names or descriptions provided"
  },
  "E1.3": {
    "strong": "Only the 8 Qur'an categories are listed, no additions",
    "moderate": "At Assessor's Discretion",
    "needs_improvement": "One or more non-Qur'an categories added alongside the 8, without scholarly justification",
    "concern": "Non-Qur'an categories used in place of or in addition to the 8 without any basis"
  },
  "E2.1": {
    "strong": "Each category defined with clear grounding in classical figh",
    "moderate": "Definitions present but vague or rely on modern interpretations without Shari ah basis",
    "needs_improvement": "Some categories defined per classical fiqh, others not",
    "concern": "No definitions provided or definitions contradict classical figh"
  },
  "E2.2": {
    "strong": "Contemporary application explained for each category",
    "moderate": "Contemporary application mentioned for some categories but not all",
    "needs_improvement": "Contemporary application referenced vaguely without per-category breakdown",
    "concern": "No contemporary application explained"
  },
  "E2.3": {
    "strong": "Concrete example(s) provided showing how classical definitions apply in modern context",
    "moderate": "Example provided but does not clearly bridge classical and contemporary application",
    "needs_improvement": "Example present but superficial or applied to only one category",
    "concern": "No examples provided"
  },
  "E3.1": {
    "strong": "Impact report or disclosure shows distribution broken down by category with percentages or amounts",
    "moderate": "General statement 'distributed to eligible recipients' with no category breakdown",
    "needs_improvement": "Some distribution data provided but presented as aggregate only",
    "concern": "No distribution breakdown of any kind disclosed"
  },
  "E3.2": {
    "strong": "Breakdown accounts for all 8 Qur'an categories",
    "moderate": "Breakdown provided but covers only some categories",
    "needs_improvement": "Breakdown provided for 4 or fewer categories",
    "concern": "No breakdown by Qur'an category disclosed"
  },
  "E3.3": {
    "strong": "Explicitly explains why certain categories were unused in the reporting period",
    "moderate": "Breakdown exists but unused categories are omitted without explanation",
    "needs_improvement": "Mentions that not all categories are used but no category-specific explanation given",
    "concern": "No acknowledgment of unused categories"
  },
  "E4.1": {
    "strong": "Case examples or explicit criteria provided showing how recipients are matched to Qur'an categories",
    "moderate": "Claims compliance but no examples or matching criteria provided",
    "needs_improvement": "Examples provided for one or two categories only",
    "concern": "No evidence of recipient-to-category matching"
  },
  "E4.2": {
    "strong": "Nisab verification process described for Fuqara/Masakin and debt verification for Gharimin",
    "moderate": "Verification mentioned for one group but not the other",
    "needs_improvement": "Verification referenced but not described in any detail for either group",
    "concern": "No nisab or debt verification process disclosed"
  },
  "E4.3": {
    "strong": "Policy or examples make clear that recipients are assessed against classical fiqh definitions",
    "moderate": "Claims compliance but no evidence that classical definitions are applied in practice",
    "needs_improvement": "Classical definitions referenced but no process described for ensuring recipients fit them",
    "concern": "No reference to classical definitions in recipient selection"
  },
  "E5.1": {
    "strong": "Annual Shari ah Board review of category classifications explicitly stated",
    "moderate": "Shari ah compliance claimed without a named board, documented process, or review frequency",
    "needs_improvement": "Board exists and reviews classifications but frequency is unstated or less than annually",
    "concern": "No Shari ah Board review of category classifications disclosed"
  },
  "E5.2": {
    "strong": "Written approval or fatwa obtained for contemporary applications, documented and referenced",
    "moderate": "Shari ah compliance claimed without documented written approval or fatwa",
    "needs_improvement": "Fatwa or approval mentioned but not documented or publicly available",
    "concern": "No written approval or fatwa disclosed"
  },
  "E5.3": {
    "strong": "Specific madhab or scholarly consensus explicitly referenced for rulings",
    "moderate": "Shari ah compliance claimed without naming a specific madhab or scholars",
    "needs_improvement": "Scholarly input referenced vaguely without specifying a madhab or named consensus",
    "concern": "No madhab or scholarly consensus referenced"
  },

  // ===== SECTION 4: TRANSPARENCY FULFILMENT (T1-T7) =====
  "T1.1": {
    "strong": "Registered with the relevant authority (CRA, IRS, Charity Commission, or equivalent)",
    "moderate": "Registered but registration details are outdated or unclear",
    "needs_improvement": "At Assessor's Discretion",
    "concern": "Not registered or registration has lapsed"
  },
  "T1.2": {
    "strong": "Registration number publicly displayed on website or materials",
    "moderate": "Registered but registration number not publicly displayed",
    "needs_improvement": "Registration number present but difficult to locate",
    "concern": "Registration number not displayed"
  },
  "T1.3": {
    "strong": "Annual filings current, most recent submission is within the required period",
    "moderate": "Filings exist but are outdated or missing for recent years",
    "needs_improvement": "Filings current for some years but gaps exist",
    "concern": "No annual filings on record"
  },
  "T1.4": {
    "strong": "Annual filings publicly accessible (e.g., on regulator's website or charity's own site)",
    "moderate": "Filings exist but are not publicly accessible without a direct request",
    "needs_improvement": "Some filings publicly accessible but not consistently",
    "concern": "Annual filings not accessible to the public"
  },
  "T1.5": {
    "strong": "Zakat treatment under local law explicitly clarified (e.g., tax treatment, regulatory classification)",
    "moderate": "Registered but Zakat-specific legal treatment not addressed",
    "needs_improvement": "Local law mentioned generally without addressing Zakat specifically",
    "concern": "No mention of Zakat treatment under local law"
  },
  "T2.1": {
    "strong": "Mission statement or prominent section explicitly explains Zakat is collected to fulfill the fardh (obligatory) duty of donors",
    "moderate": "Mentions accepting Zakat among other donations without explaining its unique obligatory status",
    "needs_improvement": "Zakat's obligatory nature acknowledged but not clearly framed as fulfilling the donor's fardh",
    "concern": "No mention of Zakat's religious purpose or obligation"
  },
  "T2.2": {
    "strong": "Explicitly states distribution follows Qur'an mandate (9:60) to 8 eligible categories",
    "moderate": "Mentions Zakat categories without referencing the Qur'an mandate or verse",
    "needs_improvement": "References Qur'an basis without specifying 9:60 or the 8 categories",
    "concern": "No reference to Qur'an mandate or eligible categories"
  },
  "T3.1": {
    "strong": "Explicitly states Zakat is available to eligible individuals regardless of age",
    "moderate": "General statement 'serves all in need' without explicitly confirming minors are eligible",
    "needs_improvement": "Minors mentioned as beneficiaries in passing but eligibility not explicitly confirmed",
    "concern": "No mention of Zakat eligibility for minors"
  },
  "T3.2": {
    "strong": "Specific services provided to minors listed (e.g., food aid, education support, medical assistance)",
    "moderate": "Minors mentioned as beneficiaries but no specific services described",
    "needs_improvement": "Services listed generally without specifying which apply to minors",
    "concern": "No services for minors mentioned"
  },
  "T4.1": {
    "strong": "Formal Shari ah Board established with a written mandate publicly referenced or available",
    "moderate": "Informal consultation with scholar(s), no formal board structure or written mandate",
    "needs_improvement": "Board referenced but written mandate not disclosed or confirmed",
    "concern": "No Shari ah Advisory Board disclosed"
  },
  "T4.2": {
    "strong": "Board mandate explicitly includes advising on Zakat policy",
    "moderate": "Board exists but its mandate does not explicitly include Zakat policy advice",
    "needs_improvement": "Board mentioned as advising on Shari ah matters generally, without specifying Zakat policy",
    "concern": "No board mandate disclosed"
  },
  "T4.3": {
    "strong": "Mandate explicitly includes reviewing annual distribution and auditing for figh compliance",
    "moderate": "Board reviews distribution but figh compliance audit is not mentioned",
    "needs_improvement": "Annual review referenced without specifying distribution or figh compliance scope",
    "concern": "No annual review or figh compliance audit disclosed"
  },
  "T4.4": {
    "strong": "Mandate explicitly includes approving contemporary applications of Zakat rulings",
    "moderate": "Board advises generally but approval of contemporary applications not mentioned",
    "needs_improvement": "Contemporary applications referenced without board approval process",
    "concern": "No approval process for contemporary applications disclosed"
  },
  "T4.5": {
    "strong": "Board meets at least quarterly, explicitly stated",
    "moderate": "Board meets but frequency is less than quarterly or not disclosed",
    "needs_improvement": "Meeting frequency referenced vaguely (e.g., 'regularly') without confirmation of quarterly schedule",
    "concern": "No meeting schedule disclosed"
  },
  "T5.1": {
    "strong": "All board members named publicly",
    "moderate": "States 'Shari ah Board exists' without naming any members",
    "needs_improvement": "Some members named but not all",
    "concern": "No board members named"
  },
  "T5.2": {
    "strong": "Credentials listed for each member (e.g., qualification, institution) with bios demonstrating figh expertise",
    "moderate": "Members named but no credentials or bios provided",
    "needs_improvement": "Some credentials listed but insufficient to verify figh expertise",
    "concern": "No credentials or bios available"
  },
  "T6.1": {
    "strong": "Names and roles of organisational leadership publicly displayed",
    "moderate": "Generic titles listed without names or unclear who holds each role",
    "needs_improvement": "Some names listed but roles not specified",
    "concern": "No governing board members listed"
  },
  "T6.2": {
    "strong": "Clear accountability structure demonstrated, key roles and oversight bodies identified (e.g., Executive Director, Board of Directors, Finance Committee)",
    "moderate": "Names listed but governance or accountability structure is unclear",
    "needs_improvement": "Structure referenced but key oversight roles absent or unnamed",
    "concern": "No accountability structure demonstrated"
  },
  "T7.1": {
    "strong": "Annual external financial audit by a certified firm conducted and publicly available",
    "moderate": "Internal audit only or external audit not publicly available",
    "needs_improvement": "External audit referenced but it is unclear whether it is publicly available",
    "concern": "No audit conducted or disclosed"
  },
  "T7.2": {
    "strong": "Separate Shari ah audit or compliance report produced and publicly available",
    "moderate": "Financial audit exists but no Shari ah review or compliance report",
    "needs_improvement": "Shari ah review referenced but report is not publicly available",
    "concern": "No Shari ah audit or compliance report disclosed"
  },

  // ===== SECTION 5: CHARITY SERVICES EXTRA (C1-C4) =====
  "C1.1": {
    "strong": "Calculator covers all common asset types: cash, gold/silver, business inventory, and investments",
    "moderate": "Links to third-party calculator only, no own calculator available",
    "needs_improvement": "Calculator available but covers only some asset types (e.g., cash only)",
    "concern": "No Zakat calculator available"
  },
  "C1.2": {
    "strong": "Calculator is clearly presented and easy to use without specialist knowledge",
    "moderate": "Calculator available but overly complex, requires expertise to use",
    "needs_improvement": "Interface functional but confusing or poorly designed",
    "concern": "No usable calculator interface"
  },
  "C2.1": {
    "strong": "Real-time support available via chat, phone, or video call with knowledgeable staff (ideally Shari ah-trained)",
    "moderate": "Email-only support or generic contact form, no Zakat-specific real-time assistance",
    "needs_improvement": "Live support available but not Zakat-specific",
    "concern": "No live Zakat support available"
  },
  "C2.2": {
    "strong": "Support explicitly confirmed as available during peak seasons (Ramadan, Dhul Hijjah)",
    "moderate": "Support available but peak season availability not disclosed",
    "needs_improvement": "Peak season mentioned but no confirmation of enhanced availability",
    "concern": "No mention of peak season availability"
  },
  "C3.1": {
    "strong": "Comprehensive resource library including articles, nisab updates, figh Q&A, video tutorials, and printable guides",
    "moderate": "Brief FAQ section or single article only, not a comprehensive resource library",
    "needs_improvement": "Educational content present but limited to one or two formats (e.g., articles only)",
    "concern": "No Zakat education resources available"
  },
  "C3.2": {
    "strong": "Content explicitly stated as reviewed for Shari ah accuracy",
    "moderate": "Content available but no indication of Shari ah review",
    "needs_improvement": "Shari ah review mentioned generally without specifying which content has been reviewed",
    "concern": "No Shari ah review of content disclosed"
  },
  "C4.1": {
    "strong": "FAQ comprehensively addresses nisab thresholds, hawl calculation, debt deduction, and joint assets",
    "moderate": "FAQ exists but is generic or minimal, does not address these practical topics",
    "needs_improvement": "FAQ covers some of these topics but omits others (e.g., covers nisab but not debt deduction)",
    "concern": "No FAQ section available"
  },
  "C4.2": {
    "strong": "FAQ explicitly addresses Zakat on behalf of children and madhab differences",
    "moderate": "FAQ exists but does not address these specific topics",
    "needs_improvement": "One of the two topics addressed but not both",
    "concern": "No FAQ section available"
  }
};