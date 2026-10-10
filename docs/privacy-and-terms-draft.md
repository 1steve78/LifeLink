# LifeLink Privacy, Terms and Consent — Draft

**Status:** product and privacy review completed against the current repository and official Indian DPDP materials on 10 October 2026. This remains a draft, not legal advice or an approved notice. Qualified Indian counsel must review it before public launch. Product decisions below are defaults; code enforcement and vendor/backup details still need verification.

## Privacy notice draft

LifeLink helps requesters coordinate blood needs with potential nearby donors. It is a connector, not a medical authority. A hospital or licensed blood bank decides medical compatibility and donor eligibility.

### Information we collect

- Account: name and sign-in information; role; donor blood group, coarse location, availability and last-donation date when needed for matching.
- Request: blood group, units, urgency, hospital/area, required-by time, supporting requisition document and the minimum contact/verification information necessary to coordinate and review the request.
- Safety and operation: verification outcomes, moderation decisions, status changes, pledges/notifications, security logs and consent version/time.

We do not need a patient's name, direct phone number or exact address on public pages. Seekers cannot browse donor profiles. Donor location and distance are not disclosed to seekers; nearby availability is shown only as an aggregate where appropriate.

### Why we use it

We use information to authenticate accounts, validate and review requests, identify eligible nearby donors using deterministic rules, send relevant alerts, coordinate updates, prevent abuse, and maintain a minimal safety/audit record. If a supporting document is sent to an AI provider for extraction or risk signals, we request separate consent first. AI output is not a final approval or medical decision.

### Sharing and contact

Public request pages, if enabled, may show only blood group, units, urgency, hospital or area, live status and expiry. Never publish patient names, personal contact details, exact addresses, requester identities or donor identities. Contact remains masked or in-app and is available only to the people authorized for that coordination; temporary reveals are removed when a request closes.

We do not sell personal data or blood. We do not scrape or automatically read Facebook or WhatsApp groups. A user may choose to share a LifeLink link or forward a message to an official LifeLink bot if that feature is later introduced.

### Retention, access and deletion

**Selected retention defaults (pending implementation and legal review):**

- Private supporting document images: delete within 30 days after a final moderation decision. If no decision is made, delete within 30 days after the request is cancelled or expires.
- Closed, rejected, cancelled or fulfilled request and linked coordination data: delete or irreversibly anonymize within 90 days of closure. Non-identifying aggregate counts may be retained.
- Minimal moderation/security audit entries: retain for up to 12 months after the event. Abuse-report reason, status and target reference: retain for up to 12 months after resolution; null the reporter identity when an account is deleted. A documented legal hold may extend a specific record only as long as necessary.
- Application/security logs: retain for 30 days and redact personal fields. Incident-specific records may be retained up to 12 months when needed for investigation.
- Verified account deletion request: remove personal account/profile/contact data and private documents from active systems within 30 days, after closing active requests. Backups may retain data until the configured provider backup cycle expires; confirm the actual cycle and explain it before launch.

Users can request a JSON export or account deletion from Account Controls; export requires recent authentication. Account deletion removes account-linked data from active systems, subject to the narrowly defined audit/report exception above. These periods are product choices, not statutory safe harbors. Do not claim a period is being met until automated cleanup, backup behavior and deletion workflows are verified. A narrow record may be retained only for a documented safety, fraud-response or legal purpose and within the limits above.

### Security and urgent needs

LifeLink uses access controls and private document storage, but no internet service can promise perfect security. For an immediate emergency, contact the hospital or blood bank directly while using LifeLink; do not wait for an app response.

## Terms draft

- Use LifeLink only for genuine coordination. False, duplicate, harassing or commercial requests may be removed and accounts may be suspended after review.
- Selling or buying blood through LifeLink is prohibited.
- Donations and medical screening must take place at a hospital or licensed blood bank, never at a private address.
- LifeLink does not provide medical advice, determine donor eligibility, guarantee a match, or guarantee that a request will be fulfilled. Clinical staff make those decisions.
- Users must provide accurate information they are authorized to share and must not post another person's sensitive information unnecessarily.
- Contact details and donor identities must not be copied, published or used outside the authorized coordination.
- Urgent cases must contact the hospital or blood bank directly.
- Reports and moderation may lead to request removal or account suspension after human review. Users can export their account data or request account deletion through Account Controls; the limited audit/report exceptions and retention periods in the privacy notice apply.

## Consent text draft

**Account consent:** “I confirm that I am at least 18 years old if registering as a donor. I have read the LifeLink privacy notice and agree to the current terms and consent version shown here.”

**Document processing consent:** “I agree that LifeLink may process this hospital document to extract request details and produce review signals. Automated analysis can be wrong; a moderator reviews the request before it is shared with donors. I understand the document is stored privately under the retention period in the privacy notice.”

**Urgent-care notice:** “LifeLink is a coordination service, not a medical service. For an immediate emergency, contact the hospital or blood bank directly while your request is reviewed.”

## Decisions required before publication

- Name and contact details of the data fiduciary/service operator and the privacy/grievance contact; configure a monitored email/address.
- Confirm actual Supabase, NVIDIA NIM and other processor locations, retention, subprocessors and contractual terms. Never send a document to NIM until any required separate consent is recorded.
- Confirm backup retention/restore behavior and verify deletion from active storage and database.
- Implement and verify cleanup jobs for documents, closed request data, audit/report records and operational logs.
- Have qualified Indian counsel review the notice, terms, consent, age policy, medical coordination language and applicable Indian privacy, consumer, health-data and platform obligations.

## Product review notes (10 October 2026)

- The draft aligns with the project rules: no public patient identity or contact, no donor directory, coarse aggregate map only, masked/in-app contact, no sale of blood, and no automated medical or final approval decision.
- The selected first pilot is the Kolkata metropolitan area, with English and Bengali. This is an operational scope decision; requests should be accepted only where moderators and clinical escalation instructions are available.
- The Digital Personal Data Protection Act, 2023 has phased commencement. The official commencement notification schedules the Act's main operational provisions for 18 months after 13 November 2025; the notified DPDP Rules, 2025 also have phased commencement. Counsel should check the applicable provisions and any later amendments at launch. See the [official India Code Act](https://www.indiacode.nic.in/indiacode/handle/123456789/22037?view_type=browse), [commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf), and [DPDP Rules notification](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf).

**Review outcome:** internal product/privacy consistency review complete; **legal review not completed**. This draft must not be represented as counsel-approved.

