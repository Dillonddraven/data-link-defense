/* Original formative practice, aligned to the ISC2 outline; not exam items. */
(function (root) {
  'use strict';
  const DOMAINS = {1:'Security and Risk Management',2:'Asset Security',3:'Security Architecture and Engineering',4:'Communication and Network Security'};
  const missions = {1:'Council • Set the rules of defense',2:'Archive • Protect the information lifecycle',3:'Citadel • Engineer trustworthy systems',4:'Mesh • Secure the paths between systems'};
  const QUESTION_BANK = [];
  // Each row pairs EVERY option with its rationale. Rotation varies answer positions.
  function q(domain, concept, prompt, options, boss = false) {
    const index = QUESTION_BANK.filter(x => x.domain === domain).length;
    const answer = options[0][0];
    const rationales = Object.fromEntries(options);
    const rotated = options.map(x => x[0]);
    // Swap the boss slot with one earlier slot; retain four answers per position/domain.
    const position = boss ? domain-1 : index===domain-1 ? 3 : index%4;
    for (let i=0;i<position;i++) rotated.unshift(rotated.pop());
    QUESTION_BANK.push({ id:`d${domain}-${index+1}`, domain, domainName:DOMAINS[domain], concept,
      type:'choice', prompt, options:rotated, answer, rationales, explanation:rationales[answer],
      mission:boss ? 'BLACKOUT • Restore the regional emergency network' : missions[domain],
      level:boss ? 3 : 2, scenario:true, boss });
  }
  q(1,'ethics','A manager asks you to hide a vulnerability that could endanger the public. What is the BEST response?',[
    ['Escalate through appropriate channels and prioritize public safety','Protecting society and the public good takes priority over concealing a danger for an employer; use lawful reporting channels.'],
    ['Keep silent because loyalty to the employer comes first','Loyal service does not override the ethical duty to protect society and the public good.'],
    ['Publish exploit details immediately without coordination','Uncoordinated disclosure may increase harm; responsible escalation is the better first response.'],
    ['Alter the report to show a lower severity','Misrepresenting risk violates honesty and prevents informed decisions.']]);
  q(1,'CIA integrity','An attacker silently changes bank transfer amounts without reading customer records. Which CIA objective is MOST directly violated?',[
    ['Integrity','Unauthorized modification violates integrity: information must remain accurate and protected against improper changes.'],
    ['Confidentiality','Confidentiality concerns unauthorized disclosure, not primarily the changed amounts described here.'],
    ['Availability','Availability concerns timely access; no service outage is described.'],
    ['Authenticity of the server certificate','Certificate authenticity is relevant to identity, but the stated damage is modification of transaction data.']]);
  q(1,'governance','A security team wants a costly tool before understanding business priorities. What should happen FIRST?',[
    ['Align security objectives with business goals and risk appetite','Governance establishes business direction and acceptable risk so investments address organizational needs.'],
    ['Select the vendor with the most features','Features cannot establish whether a control fits business risk and objectives.'],
    ['Delegate risk acceptance entirely to the tool vendor','Accountability for business risk remains within the organization.'],
    ['Require every department to use the same technical control','Uniform implementation before assessing needs can waste resources and miss critical risks.']]);
  q(1,'risk ownership','A critical system cannot meet a security standard before launch. Who should BEST authorize acceptance of the documented residual risk?',[
    ['The accountable business risk owner with appropriate authority','The business risk owner weighs impact and formally accepts risk within delegated authority; security provides advice.'],
    ['The penetration tester who found the weakness','A tester supplies evidence but normally lacks authority to accept business risk.'],
    ['The system administrator implementing the fix','Technical implementation responsibility does not confer risk acceptance authority.'],
    ['The supplier that sold the system','A supplier cannot accept the customer organization’s business risk on its behalf.']]);
  q(1,'risk treatment','A company buys cyber insurance for some incident costs. Which risk response BEST describes that action?',[
    ['Transfer part of the financial risk','Insurance transfers specified financial consequences, while exclusions and organizational accountability remain.'],
    ['Avoid the risky business activity','Avoidance would stop the activity; buying insurance does not stop it.'],
    ['Eliminate every residual risk','Insurance does not prevent incidents or eliminate uncovered losses.'],
    ['Mitigate the technical vulnerability itself','Insurance finances some consequences; it does not patch the vulnerability.']]);
  q(1,'risk assessment','A team discovers an unpatched internet-facing service. What is the BEST way to prioritize remediation?',[
    ['Evaluate likelihood and business impact in context','Risk prioritization combines threats, exposure, vulnerabilities, existing controls, and business consequences.'],
    ['Use only the number of missing patches','Patch count ignores exploitability, exposure, and asset importance.'],
    ['Prioritize solely by the number of users on each system','User count may inform impact, but it misses exploitability, exposure, and critical services with few users.'],
    ['Treat the scanner severity as the complete business risk','Scanner severity is useful input but lacks the full business and control context.']]);
  q(1,'legal transborder','A business plans to move personal data to another country. What should it do FIRST?',[
    ['Assess applicable privacy laws, transfer restrictions, and contracts with counsel','Cross-border transfers require understanding all applicable obligations before selecting compliant safeguards.'],
    ['Assume encryption alone makes every transfer lawful','Encryption is a safeguard, not a substitute for lawful processing and transfer requirements.'],
    ['Rely only on the law where headquarters is located','Other jurisdictions may apply based on subjects, processing, location, or contracts.'],
    ['Transfer first and ask the provider for approval later','A provider’s approval does not establish the customer’s legal basis or satisfy transfer restrictions.']]);
  q(1,'BCP BIA','A continuity team must decide which services to recover first. What is the BEST starting point?',[
    ['Perform a business impact analysis with process owners','A BIA identifies critical processes, impacts over time, and dependencies to drive recovery priorities.'],
    ['Buy identical backup hardware for every server','Hardware choices follow business requirements rather than establish recovery priorities.'],
    ['Recover the easiest system first regardless of impact','Ease of recovery can conflict with mission-critical business needs.'],
    ['Use the newest application as the recovery priority','Application age does not determine the impact of disruption.']]);
  q(1,'BCP RTO RPO','A payroll service must return within four hours and may lose at most fifteen minutes of data. Which interpretation is BEST?',[
    ['RTO is four hours; RPO is fifteen minutes','RTO targets restoration time; RPO expresses the tolerable data-loss window measured backward in time.'],
    ['RPO is four hours; RTO is fifteen minutes','This reverses restoration time and acceptable data-loss period.'],
    ['Both values define maximum tolerable downtime','Maximum tolerable downtime is a business limit, distinct from recovery objectives and data loss.'],
    ['A four-hour backup schedule satisfies both objectives','Four-hour backups may lose far more than fifteen minutes of data and do not guarantee restoration time.']]);
  q(1,'policy standards','An organization requires all managed laptops to use approved disk encryption. Which document BEST specifies the mandatory technical baseline?',[
    ['A security standard','Standards state mandatory, specific requirements that support higher-level policy.'],
    ['A voluntary guideline','Guidelines recommend practices rather than impose a mandatory baseline.'],
    ['A strategic mission statement','A mission statement gives direction, not specific configuration requirements.'],
    ['A step-by-step encryption installation procedure','A procedure explains how to implement a requirement; the standard defines the mandatory technical baseline.']]);
  q(1,'due care diligence','After deploying a protective control, a manager regularly reviews its effectiveness and emerging risks. What does this BEST demonstrate?',[
    ['Due diligence through ongoing evaluation','Due diligence includes sustained investigation and monitoring; reasonable protective action is commonly described as due care.'],
    ['Risk avoidance by ending the activity','The business activity continues, so the risk has not been avoided.'],
    ['A one-time guarantee of due care forever','Controls need reassessment as threats and business conditions change.'],
    ['Transfer of management accountability to auditors','Auditors assess controls but do not take over management’s accountability.']]);
  q(1,'supply chain risk','A critical SaaS provider uses several subcontractors. What is the BEST procurement approach?',[
    ['Assess the provider and material dependencies, and contract for security and monitoring','Supply-chain risk extends to dependencies; assessment, enforceable requirements, and ongoing oversight address that exposure.'],
    ['Accept the provider’s marketing claims as sufficient assurance','Marketing statements are not independent evidence or enforceable security requirements.'],
    ['Review only the provider’s office badge system','Physical access alone does not cover subcontractor, data, resilience, and service risks.'],
    ['Wait until a breach to identify subcontractors','Deferring discovery prevents informed procurement and leaves dependencies unassessed.']]);
  q(1,'personnel separation','A privileged employee is leaving today. What is the BEST coordinated security action?',[
    ['Coordinate timely access revocation and asset return with HR and management','A controlled offboarding process removes access at the appropriate time and recovers assets while preserving business continuity.'],
    ['Keep the account active indefinitely for convenience','Unneeded privileged accounts create avoidable access risk.'],
    ['Delete all employee records immediately','Legal retention and investigation requirements may require preserving records.'],
    ['Ask only the employee to remove their own privileges','Independent execution and verification are needed; self-revocation is not reliable control.']]);
  q(1,'awareness measurement','A phishing-awareness program has high attendance. Which measure BEST assesses whether behavior improved?',[
    ['Track reporting and unsafe-action rates in comparable simulations over time','Behavioral outcomes over time provide stronger evidence than participation alone; simulations must be ethical and contextualized.'],
    ['Measure only participant satisfaction with the training','Satisfaction can improve delivery but does not directly demonstrate safer behavior.'],
    ['Count only attendance certificates','Attendance shows exposure to training, not demonstrated application.'],
    ['Treat zero reported incidents as proof of success','Low reports may reflect underreporting rather than absence of incidents.']]);
  q(1,'threat modeling','A team is designing an API handling payments. Which activity BEST supports early threat modeling?',[
    ['Map data flows and trust boundaries, then analyze abuse paths','Understanding assets, flows, and boundaries allows teams to identify threats and select mitigations before implementation.'],
    ['Wait for production penetration testing as the only assessment','Late testing can find defects but misses the opportunity to reduce design risk early.'],
    ['Choose encryption and declare the architecture secure','Encryption does not address every abuse path or trust boundary.'],
    ['Model only accidental hardware failure','Threat modeling also considers adversarial behavior and other threats relevant to the system.']]);
  q(1,'BCP governance boss','BLACKOUT: A storm threatens a regional emergency network. Executives want every service restored at once, but capacity is limited. What is the BEST basis for the first recovery decision?',[
    ['Use approved BIA priorities and life-safety dependencies','Business impact and life-safety dependencies guide scarce recovery resources; authorized leadership resolves competing priorities.'],
    ['Restore the executive dashboard before dispatch because it is visible','Visibility to executives does not outweigh emergency dispatch’s critical impact.'],
    ['Let the hardware vendor set business recovery priorities','Vendors can advise technically, but organizational leadership owns business priorities.'],
    ['Disable all security controls to maximize recovery speed','A blanket removal can compound the crisis; emergency changes must be risk-based and controlled.']],true);

  q(2,'classification','A new dataset combines public records with confidential customer details. What should happen FIRST?',[
    ['Have the accountable owner assess sensitivity and classify the combined dataset','Aggregation can increase sensitivity; owner-led classification determines appropriate protection and handling.'],
    ['Treat it as public because some source records are public','Public components do not make confidential combined data public.'],
    ['Ask the storage vendor to choose business sensitivity','A vendor does not own the organization’s classification decision.'],
    ['Apply the lowest source classification to reduce costs','Lowering protection ignores confidential content and aggregation risk.']]);
  q(2,'ownership custodians','A database administrator implements backups and access controls chosen by the business. Which role BEST describes that responsibility?',[
    ['Data custodian','Custodians implement and maintain protection in accordance with owner requirements.'],
    ['Data owner','Owners determine classification and authorized use; implementing backups alone describes custodianship.'],
    ['Data subject','A subject is the individual whom personal data describes, not the operational administrator role.'],
    ['Independent regulator','Regulators oversee compliance rather than operate the organization’s routine backups.']]);
  q(2,'privacy controller processor','A payroll service processes employee data solely under an employer’s documented instructions. Which role does the service MOST likely have for that processing?',[
    ['Processor','A processor handles personal data on a controller’s behalf; the actual role depends on who determines purposes and means.'],
    ['Controller solely because it hosts the servers','Hosting alone does not determine the processing purpose and essential means.'],
    ['Data subject','The employees, not the payroll service, are the subjects of these records.'],
    ['Supervisory authority','A commercial processing service is not the privacy regulator.']]);
  q(2,'lifecycle minimization','A mobile app wants dates of birth but only needs to verify adult eligibility. Which design BEST follows data minimization?',[
    ['Collect only the eligibility evidence needed for the defined purpose','Limiting collection to necessary data reduces exposure while meeting the legitimate purpose.'],
    ['Collect full birth dates for possible future uses','Speculative collection exceeds the current need and increases privacy risk.'],
    ['Collect birth dates then keep them forever in encrypted form','Encryption does not cure unnecessary collection or indefinite retention.'],
    ['Copy the full identity document into every application log','Replicating sensitive documents expands exposure and is disproportionate to the stated need.']]);
  q(2,'retention legal hold','A record has reached its scheduled deletion date, but counsel has issued a valid litigation hold. What is the BEST action?',[
    ['Suspend relevant destruction and preserve records under the hold','Legal holds override routine deletion for covered records until the hold is properly released.'],
    ['Delete immediately because the schedule is automated','Automation cannot override a valid preservation duty.'],
    ['Edit the record to remove unfavorable details','Altering evidence compromises integrity and may violate legal obligations.'],
    ['Keep all unrelated company data forever','A scoped hold does not justify indefinite retention of every unrelated record.']]);
  q(2,'destruction SSD','A failed SSD containing highly sensitive data is leaving organizational control and cannot be reliably sanitized. What is the BEST disposal approach?',[
    ['Use approved physical destruction with documented verification','When sanitization cannot meet the required assurance, approved destruction and evidence of execution address remanence risk.'],
    ['Delete the file directory and return the drive','Logical deletion leaves recoverable information and is not reliable sanitization.'],
    ['Degauss the SSD as if it were magnetic tape','Degaussing targets magnetic media and is not an effective SSD sanitization method.'],
    ['Format the drive once without verification','Formatting does not assure sensitive data is unrecoverable, especially on a failed SSD.']]);
  q(2,'destruction crypto erase','A team plans cryptographic erasure of retired encrypted storage. Which condition is MOST important?',[
    ['All sensitive data was properly encrypted and all relevant key copies can be irrecoverably destroyed','Crypto erase depends on sound encryption, key scope and lifecycle, and elimination of usable keys including backups.'],
    ['Only the file names were encrypted','Unencrypted contents remain recoverable even if encrypted names are lost.'],
    ['The live key is deleted but a recoverable backup is retained','A surviving usable key can still decrypt the retired data.'],
    ['The disk has been removed from the inventory','Inventory changes do not make underlying information unreadable.']]);
  q(2,'handling data states','A database uses full-disk encryption. A compromised running process reads decrypted customer records. Which statement BEST explains the gap?',[
    ['At-rest encryption does not by itself protect data in use','Once data is decrypted for processing, runtime access controls and other protections are needed.'],
    ['At-rest encryption also guarantees process isolation','Disk encryption and memory/process isolation are different protections.'],
    ['TLS would automatically stop local process reads','TLS protects data in transit, not access by a local process after decryption.'],
    ['Apply database encryption at rest without changing runtime privileges','Another at-rest encryption layer does not block a compromised process already permitted to read decrypted records.']]);
  q(2,'asset inventory','A merger reveals unknown repositories containing customer data. What is the BEST first step to manage these assets?',[
    ['Discover the repositories, identify owners, and document data flows and locations','An accurate inventory and accountability are prerequisites for consistent classification, handling, and lifecycle control.'],
    ['Apply retention rules only to already-known databases','Ignoring unknown repositories leaves significant data outside governance.'],
    ['Copy every repository into a single unrestricted share','Centralization without controls can amplify exposure rather than establish governance.'],
    ['Delete every unknown repository without review','Unreviewed deletion can violate retention duties and destroy critical information.']]);
  q(2,'handling DLP','A team wants to reduce unauthorized emailing of labeled confidential files. Which control BEST supports this objective?',[
    ['Tune data loss prevention policies for sensitive content and authorized workflows','DLP can inspect or use labels to identify and restrict inappropriate transfers, with tuning and exception handling.'],
    ['Rely solely on endpoint antivirus signatures','Antivirus targets malicious software and does not establish authorized data-sharing policy.'],
    ['Scan outgoing attachments only for known malware','Malware scanning can miss legitimate but confidential documents sent to unauthorized recipients.'],
    ['Encrypt the server disk and allow every email attachment','At-rest protection does not stop authorized software from sending decrypted attachments.']]);
  q(2,'retention lifecycle','A department proposes keeping all customer records indefinitely because storage is cheap. What is the BEST response?',[
    ['Set purpose-based retention periods reflecting legal and business requirements','Retention balances legitimate needs and legal obligations with minimization and defensible disposal.'],
    ['Accept because storage cost is the only retention factor','Privacy, litigation exposure, security, and legal duties also govern retention.'],
    ['Delete all records after a universal thirty-day interval','No universal interval fits all legal obligations and business needs.'],
    ['Retain all copies until a storage budget review','A cost-driven review is not a retention schedule tied to purpose, legal duties, and business requirements.']]);
  q(2,'privacy anonymization','An analyst replaces names with reversible identifiers while retaining the lookup table. How should the data BEST be treated?',[
    ['As pseudonymized data that may still be personal data','Re-identification through the lookup table remains possible, so privacy obligations and protection can still apply.'],
    ['As irreversibly anonymized data in every context','Reversibility and linkage mean anonymity is not assured.'],
    ['As public data because direct names are absent','Removing names alone does not authorize public disclosure.'],
    ['As destroyed data because identifiers changed','The records still exist and can still be linked to individuals.']]);
  q(2,'handling classification labels','An employee must send a confidential design to an authorized supplier. What is the BEST handling approach?',[
    ['Verify authorization, encrypted delivery, and applicable handling terms','Classification should drive recipient verification, approved protection, and restrictions throughout sharing.'],
    ['Encrypt the file and let the supplier determine onward sharing','Encryption protects delivery but does not establish permitted onward sharing; the owner’s handling terms must follow the information.'],
    ['Confirm a nondisclosure agreement and use the supplier’s public upload portal','A nondisclosure agreement supports legal obligations but does not verify the portal’s access controls or transport protection.'],
    ['Rely on supplier onboarding approval instead of checking the named recipient','Supplier approval does not establish that a specific recipient is authorized for this confidential design.']]);
  q(2,'asset end of support','A vital appliance will soon lose vendor security support. What is the BEST lifecycle response?',[
    ['Plan replacement or migration and assess interim compensating controls','End of support creates unpatched exposure; an accountable plan and temporary mitigations manage transition risk.'],
    ['Keep it indefinitely because it still powers on','Functional operation does not mean security support remains adequate.'],
    ['Remove it from vulnerability scans so reports stay clean','Hiding the asset removes visibility without reducing exposure.'],
    ['Dispose of it immediately without reviewing dependencies','Unplanned removal can disrupt critical services; transition must consider dependencies.']]);
  q(2,'privacy location','A cloud contract restricts personal data to an approved region. Which verification is MOST useful?',[
    ['Verify primary data, replicas, backups, and processing locations against the contract','Residency and processing constraints can apply beyond the primary database, including backups and subprocessors.'],
    ['Check only the location of the provider’s headquarters','Corporate headquarters does not establish actual data locations.'],
    ['Check only the region used for service billing','Billing location is not evidence of where production records and replicas are stored or processed.'],
    ['Assume a chosen primary region governs all copies automatically','Replication and backup settings or service terms may permit other locations.']]);
  q(2,'ownership handling boss','BLACKOUT: Emergency responders need a limited patient roster. A vendor requests the entire medical archive for convenience. What is the BEST data decision?',[
    ['Have the accountable authority approve minimum necessary sharing through a protected channel','Emergency access still needs lawful authority, necessary scope, secure handling, and accountability rather than unrestricted disclosure.'],
    ['Send the full archive to any requester claiming an emergency','An emergency claim does not establish authorization or proportionality.'],
    ['Remove every classification label before transfer','Removing labels does not change sensitivity and weakens handling controls.'],
    ['Refuse all sharing even when authorized and necessary for care','A blanket refusal can undermine life safety; controlled lawful sharing supports the mission.']],true);

  q(3,'design least privilege','A backup agent needs read access to selected folders. Which permission design is BEST?',[
    ['Grant only the scoped read permissions needed for backup','Least privilege limits capability and scope to the job, reducing damage if the agent is compromised.'],
    ['Grant domain administrator access to avoid permission issues','Broad administrative rights exceed the task and magnify compromise impact.'],
    ['Use a shared human administrator account','Shared privileged credentials undermine accountability and exceed service needs.'],
    ['Disable authorization checks for the backup window','Removing enforcement creates unnecessary exposure rather than solving scoped access.']]);
  q(3,'design fail securely','A payment authorization service becomes unreachable. For a transaction requiring authorization, what is the BEST default?',[
    ['Deny or safely queue the transaction under approved policy','Fail-secure behavior avoids granting unauthorized access when a control fails; availability tradeoffs need explicit design.'],
    ['Approve every transaction until the service returns','Failing open bypasses required authorization and can enable fraud.'],
    ['Treat network timeout as proof of successful authorization','A timeout indicates uncertainty, not an authorization decision.'],
    ['Reuse any prior customer’s authorization token','An unrelated authorization cannot justify a new transaction.']]);
  q(3,'models Bell-LaPadula','A classified-document system must prevent high-classification information flowing to lower classifications. Which model BEST matches that confidentiality objective?',[
    ['Bell-LaPadula','Bell-LaPadula focuses on confidentiality with no read up and no write down in its classic mandatory model.'],
    ['Biba','Biba primarily protects integrity, not confidentiality classifications.'],
    ['Clark-Wilson','Clark-Wilson emphasizes well-formed transactions and separation of duties for integrity.'],
    ['Brewer-Nash solely for all classification flows','Brewer-Nash addresses conflicts of interest rather than general classified confidentiality flows.']]);
  q(3,'models Biba','A high-integrity process must not consume untrusted lower-integrity inputs under a strict integrity model. Which model BEST fits?',[
    ['Biba','Strict Biba uses no read down and no write up to prevent contamination of higher-integrity objects.'],
    ['Bell-LaPadula','Bell-LaPadula protects confidentiality and uses different directional restrictions.'],
    ['A discretionary model with universal write access','Universal write access does not enforce integrity levels.'],
    ['Clark-Wilson','Clark-Wilson protects integrity through well-formed transactions and separation of duties, rather than strict no-read-down integrity levels.']]);
  q(3,'crypto authenticated encryption','A storage design requires confidentiality plus detection of ciphertext tampering. Which approach is BEST?',[
    ['Use a vetted authenticated-encryption scheme with correct nonce management','Authenticated encryption provides confidentiality and integrity when its algorithm and nonce requirements are followed.'],
    ['Use an unkeyed hash instead of encryption','A hash does not hide plaintext or by itself authenticate an adversarially replaceable message.'],
    ['Use encryption without any integrity protection','Encryption alone can allow undetected ciphertext modification depending on the construction.'],
    ['Reuse the same GCM nonce with a key to simplify operations','GCM nonce reuse under a key can catastrophically undermine confidentiality and authentication.']]);
  q(3,'crypto signatures','A software distributor wants customers to verify a release’s origin and integrity. What is the BEST mechanism?',[
    ['Sign the release with the distributor’s private key and verify with its trusted public key','A digital signature authenticates the signer and detects modification when the verification key is trusted and protected processes are used.'],
    ['Publish only an unsigned hash next to the download','An attacker able to replace the release may replace an unauthenticated hash as well.'],
    ['Encrypt with each customer’s password but omit authentication','Encryption alone does not provide verifiable distributor identity and integrity.'],
    ['Distribute the same symmetric signing secret to every customer','A shared MAC key lets any customer forge a valid tag; public-key signatures allow verification without distributing signing authority.']]);
  q(3,'PKI validation','A browser receives a server certificate signed by a trusted CA but for a different hostname. What is the BEST decision?',[
    ['Reject the identity mismatch instead of treating the chain alone as sufficient','Certificate validation includes the expected identity, chain, validity, and applicable status/policy checks.'],
    ['Accept because any trusted CA signature authenticates any hostname','Trust in a CA does not make a certificate valid for unrelated identities.'],
    ['Ignore the hostname whenever encryption negotiates successfully','An encrypted connection to an impostor does not authenticate the intended server.'],
    ['Accept if the certificate has not expired, without matching the hostname','Time validity alone does not establish that the certificate identifies the intended server.']]);
  q(3,'PKI revocation','A server’s certificate private key has been exposed. What is the BEST response?',[
    ['Revoke the affected certificate and replace the compromised key and certificate','Revocation signals lost trust, and new keys prevent continued use of exposed private material; investigate the compromise too.'],
    ['Renew the certificate using the same exposed private key','A new certificate with the compromised key preserves the underlying exposure.'],
    ['Wait until the certificate naturally expires','Waiting leaves the compromised credential potentially usable longer.'],
    ['Change the server login password but keep the certificate and key','A login password change does not invalidate or replace exposed certificate private key material.']]);
  q(3,'physical life safety','A fire alarm activates in a secure data center. Which design priority is MOST important?',[
    ['Prioritize safe egress and emergency response for occupants','Life safety takes priority; physical access restrictions must not trap occupants during emergencies.'],
    ['Prioritize automatic suppression to contain damage to computing equipment','Suppression helps contain a fire, but equipment protection is subordinate to safe egress and occupant safety.'],
    ['Prioritize redundant power and cooling to maintain critical service availability','Resilience supports availability, but continued service does not take priority over human life during a fire alarm.'],
    ['Prioritize perimeter access monitoring to prevent theft during evacuation','Monitoring can deter theft during an evacuation, but asset security is secondary to life safety and emergency response.']]);
  q(3,'cloud shared responsibility','A company runs virtual machines in IaaS. Which task is MOST typically the customer’s responsibility?',[
    ['Patch and securely configure the guest operating systems','In typical IaaS the customer manages guest OS and applications while the provider secures underlying infrastructure; verify service terms.'],
    ['Maintain physical locks at the provider’s data center','Physical facility security is normally the infrastructure provider’s responsibility.'],
    ['Replace failed host server power supplies','Physical host maintenance is normally handled by the IaaS provider.'],
    ['Assume the provider automatically secures all customer applications','Application security remains a customer concern and is not implied by infrastructure hosting.']]);
  q(3,'vulnerabilities memory','A native application copies user input into a fixed-size buffer without bounds checks. Which improvement BEST addresses the root weakness?',[
    ['Use memory-safe approaches or validated bounds-safe operations','Preventing out-of-bounds writes addresses the cause; runtime mitigations are additional defense, not a replacement.'],
    ['Rely solely on address space layout randomization','ASLR can impede exploitation but does not remove the out-of-bounds write; it supplements a root-cause fix.'],
    ['Encrypt the hard drive and leave the copy unchanged','Disk encryption does not constrain writes inside a running process.'],
    ['Disable audit logs to reduce crash noise','Suppressing evidence leaves the vulnerability intact and impairs detection.']]);
  q(3,'design defense in depth','A service uses segmentation, strong authentication, patching, and monitoring. What is the BEST reason for these overlapping controls?',[
    ['Different layers reduce dependence on any single control succeeding','Defense in depth contains failures and improves prevention, detection, and response across different attack paths.'],
    ['Multiple controls guarantee that compromise is impossible','Layering reduces risk but cannot guarantee perfect security.'],
    ['Monitoring makes patching unnecessary','Detection does not remove exploitable weaknesses.'],
    ['Each added product automatically eliminates the need for risk analysis','Controls must be selected and evaluated against actual risk and system complexity.']]);
  q(3,'crypto side channel','A cryptographic service leaks secret-dependent timing differences. Which mitigation BEST targets the problem?',[
    ['Use vetted constant-time implementations and evaluate side-channel exposure','Side-channel defenses address information leakage from implementation behavior rather than just algorithm strength.'],
    ['Increase key length while preserving secret-dependent timing','A longer key does not necessarily remove exploitable timing leakage.'],
    ['Add a fixed delay while retaining secret-dependent execution paths','A fixed delay can preserve the exploitable timing differences, so the underlying secret-dependent behavior remains.'],
    ['Publish fewer user instructions but keep the code unchanged','Documentation secrecy does not eliminate measurable timing differences.']]);
  q(3,'vulnerabilities ICS','A legacy industrial controller cannot be patched until a safety-tested maintenance window. What is the BEST interim approach?',[
    ['Apply assessed isolation, restricted access, and monitoring without disrupting safety','Compensating controls reduce exposure while engineering teams validate a safe remediation plan for operational technology.'],
    ['Deploy an untested patch immediately during active production','Unvalidated changes can create safety and availability hazards in industrial systems.'],
    ['Connect it directly to the internet for easier support','Direct exposure enlarges the attack surface of an already vulnerable controller.'],
    ['Stop documenting the vulnerability until patching is possible','Ignoring the record removes accountability without mitigating risk.']]);
  q(3,'design zero trust','An internal workload requests a sensitive API. Which design BEST reflects zero trust?',[
    ['Explicitly authenticate and authorize the request using least privilege and context','Network location alone is not trust; access decisions should evaluate identity, device/workload posture, and resource policy.'],
    ['Trust any request because it originated on the internal network','Implicit location-based trust contradicts zero-trust principles.'],
    ['Remove encryption after the perimeter firewall','Internal paths can be compromised; a perimeter does not justify removing protection.'],
    ['Grant permanent global access after one successful login','Broad persistent trust ignores least privilege and changing context.']]);
  q(3,'physical cloud resilience boss','BLACKOUT: Emergency dispatch loses utility power. Its backup generator works, but the cooling system lacks backup power. What is the BEST architectural lesson?',[
    ['Design and test resilience across interdependent power, cooling, and service components','A resilient server still fails if a critical dependency fails; end-to-end dependency analysis and exercises reveal hidden single points.'],
    ['Replicate data to another rack in the same power and cooling zone','A replica sharing the failed environmental dependency may fail at the same time and does not resolve this single point of failure.'],
    ['Count the generator as proof of complete site resilience','A single backup component does not demonstrate whole-site continuity.'],
    ['Disable temperature alarms to keep dispatch running','Suppressing alarms hides a hazard and can increase equipment damage or outage.']],true);

  q(4,'OSI switching','A switch forwards ordinary Ethernet frames within a LAN using destination MAC addresses. Which OSI layer BEST describes this operation?',[
    ['Layer 2: Data Link','Ethernet frame forwarding by MAC address is a data-link function; multilayer switches may also perform routing.'],
    ['Layer 3: Network','Network-layer routing primarily forwards IP packets between networks rather than ordinary MAC-based switching.'],
    ['Layer 4: Transport','Transport manages end-to-end communication such as TCP ports and reliability, not MAC forwarding.'],
    ['Layer 7: Application','Application protocols do not define this basic Ethernet forwarding decision.']]);
  q(4,'TCP reliability','An application needs an ordered byte stream with retransmission of missing data. Which transport is the BEST match?',[
    ['TCP','TCP provides a reliable ordered byte stream using sequence numbers, acknowledgments, and retransmission; it does not itself encrypt data.'],
    ['UDP alone','UDP does not itself supply ordered delivery or retransmission; an application must add those if needed.'],
    ['IP alone','IP provides best-effort packet delivery, not reliable ordered stream semantics.'],
    ['ARP','ARP resolves IPv4 addresses to link-layer addresses on a local network rather than transporting reliable streams.']]);
  q(4,'segmentation VLAN','Finance and guest devices occupy different VLANs but can freely route to each other. What is the BEST additional control?',[
    ['Enforce least-privilege traffic rules at the inter-VLAN boundary','VLANs separate broadcast domains; routed paths need ACLs or firewalls to enforce security policy between them.'],
    ['Use endpoint antivirus instead of restricting inter-VLAN traffic','Endpoint malware defenses can complement segmentation but do not enforce which inter-VLAN connections are permitted.'],
    ['Assume different VLAN IDs alone block all routed communication','Routing can allow communication despite separate VLANs unless access controls restrict it.'],
    ['Disable logging while leaving routing open','Removing logs reduces visibility without enforcing isolation.']]);
  q(4,'wireless enterprise','An organization wants individual wireless identities and strong enterprise authentication. Which option is BEST?',[
    ['Use WPA3-Enterprise with 802.1X and properly validated authentication certificates','Enterprise authentication supports individual credentials and policy; certificate validation helps prevent credential theft by rogue access points.'],
    ['Use one permanent pre-shared password for every employee','A shared secret weakens individual revocation and accountability.'],
    ['Hide the SSID as the primary authentication mechanism','Hidden SSIDs are discoverable and do not authenticate users.'],
    ['Use only MAC address allowlisting','MAC addresses can be observed and spoofed and are not strong identity credentials.']]);
  q(4,'secure protocols TLS','A user sends sensitive web data across an untrusted network. What is the BEST transport protection?',[
    ['Use modern TLS with valid server identity verification','TLS can protect confidentiality and integrity in transit while authenticating the intended endpoint when certificates are properly validated.'],
    ['Use a VPN to a third-party gateway while leaving the web connection as HTTP','The VPN protects only the tunnel to its gateway; the onward HTTP path remains unprotected and lacks web-server authentication.'],
    ['Use obsolete SSL to maximize legacy compatibility','Obsolete SSL versions have known weaknesses and should not replace supported modern TLS.'],
    ['Ignore certificate warnings whenever the page appears normal','Appearance does not prove endpoint identity; ignoring warnings can enable interception.']]);
  q(4,'secure protocols SSH','An administrator must manage a router over an untrusted path. Which protocol is BEST suited?',[
    ['SSH with verified host identity and strong authentication','SSH secures remote administrative sessions and authenticates the host when its key is properly verified.'],
    ['Telnet with a complex password','Telnet exposes session contents and credentials without encryption.'],
    ['Use SNMPv3 as the interactive command shell','SNMPv3 supports secure management operations but is not a general interactive command shell; SSH fits the stated task.'],
    ['SNMPv1 with its default community string','SNMPv1 lacks modern confidentiality and the default community is unsafe; it is not a secure shell.']]);
  q(4,'IPsec tunnel','Two offices need an encrypted gateway-to-gateway VPN that carries private IP packets. Which IPsec design is BEST?',[
    ['ESP tunnel mode with appropriate encryption and authentication','ESP tunnel mode can encapsulate and protect the original IP packet between gateways, fitting site-to-site VPNs.'],
    ['AH alone to encrypt the payload','AH provides integrity/authentication rather than payload confidentiality.'],
    ['Transport mode solely to hide the entire original IP header','Transport mode normally protects the payload, not encapsulates the whole original IP packet.'],
    ['Unauthenticated GRE alone','GRE encapsulates traffic but does not itself provide encryption or cryptographic peer authentication.']]);
  q(4,'remote access','A contractor needs temporary access to one internal application. What is the BEST access design?',[
    ['Provide scoped, time-limited access with MFA and appropriate device checks','Limit remote access to the approved resource and duration, with strong identity and contextual controls.'],
    ['Provide permanent unrestricted network-level access','Broad persistent access exceeds the stated task and increases lateral-movement risk.'],
    ['Share an employee’s password for convenience','Shared credentials undermine accountability and secure revocation.'],
    ['Expose the application without authentication during the contract','Removing authentication does not establish secure contractor access.']]);
  q(4,'network controls IDS IPS','A team wants a device to block matching malicious traffic inline, not just alert. Which control is the BEST fit?',[
    ['An intrusion prevention system with tuned policy','An IPS can block inline; tuning and failure-mode planning help manage false positives and availability impact.'],
    ['A passive IDS connected only to a mirror port','A purely passive IDS observes and alerts but cannot directly drop the original packets inline.'],
    ['A packet capture archive alone','Stored captures support investigation but do not enforce real-time blocking.'],
    ['A SIEM receiving logs asynchronously from network devices','A SIEM correlates events but asynchronous log collection alone is not inline traffic blocking.']]);
  q(4,'network controls firewall','A firewall permits return packets only for established allowed connections. Which capability BEST explains this?',[
    ['Stateful inspection','Stateful firewalls track connection context to distinguish permitted return traffic from unsolicited packets.'],
    ['Stateless filtering based only on each packet independently','Stateless rules do not maintain the described connection state.'],
    ['DNS name resolution','Resolving names to addresses does not track connection authorization state.'],
    ['Application payload decryption alone','Decryption can expose content for inspection but does not itself track allowed connection state.']]);
  q(4,'network controls DNSSEC','A resolver must detect forged DNS records using signed DNS data. Which protocol BEST meets that objective?',[
    ['DNSSEC with validated chains of trust','DNSSEC authenticates DNS data origin and integrity; it does not encrypt DNS queries or guarantee record confidentiality.'],
    ['DNS over HTTPS alone as proof of authoritative record signatures','DoH protects the client-resolver channel but does not itself validate DNSSEC signatures from authorities.'],
    ['ARP inspection','ARP inspection addresses local address-mapping attacks, not signed DNS records.'],
    ['Network address translation','NAT translates addresses and does not authenticate DNS data.']]);
  q(4,'IPv6 filtering','An organization filters IPv4 carefully but ignores IPv6 on dual-stack hosts. What is the BEST response?',[
    ['Apply equivalent authorized traffic policy and monitoring to IPv6','Dual-stack environments expose both protocol paths; ungoverned IPv6 can bypass IPv4-only controls.'],
    ['Assume IPv4 firewall rules automatically cover every IPv6 flow','Coverage depends on configuration and platform, not an automatic equivalence.'],
    ['Enable IPsec support without configuring or enforcing its use','Supporting IPsec does not ensure that IPv6 traffic actually uses protection or follows the authorized traffic policy.'],
    ['Monitor only IPv4 because users recognize those addresses','User familiarity does not determine the network’s actual attack surface.']]);
  q(4,'network performance jitter','Voice calls suffer uneven packet arrival despite adequate bandwidth. Which metric is MOST directly implicated?',[
    ['Jitter','Jitter is variation in packet delay and can impair real-time voice; buffering and QoS may help within design limits.'],
    ['Maximum link bandwidth alone','Capacity matters, but uneven arrival specifically describes delay variation rather than raw bandwidth.'],
    ['Average latency without considering variation','Mean delay may appear acceptable even when large variations disrupt real-time packet playback.'],
    ['Packet loss rate alone','Loss affects voice quality but does not specifically measure variation in the arrival time of delivered packets.']]);
  q(4,'segmentation management plane','A team wants to keep device administration separate from ordinary user traffic. Which design is BEST?',[
    ['Use a restricted management network with authenticated administrative access','Separating and restricting the management plane reduces exposure of device control interfaces; separation still needs access controls.'],
    ['Expose administration on every public interface','Broad exposure increases the attack surface for privileged control.'],
    ['Rely only on changing the administrator web port','An unusual port can be discovered and does not enforce authorization.'],
    ['Use one shared administrative account for every management session','Shared credentials weaken attribution and do not separate administration from ordinary user traffic.']]);
  q(4,'wireless rogue AP','Employees connect to an access point impersonating the corporate SSID. Which action BEST reduces credential theft risk?',[
    ['Enforce authentication server certificate validation and managed wireless profiles','Proper enterprise server validation prevents trusting an impostor merely because it advertises the right SSID.'],
    ['Trust whichever access point has the strongest signal','Signal strength does not establish the identity of the authentication server.'],
    ['Hide the corporate SSID and disable certificate checks','SSID hiding is not authentication and disabling validation enables impersonation.'],
    ['Use the company name as a shared password','A predictable shared password is not a defense against impersonation.']]);
  q(4,'segmentation remote access boss','BLACKOUT: A temporary vendor link is needed for emergency dispatch repair. The vendor asks for unrestricted access to patient and dispatch networks. What is the BEST network decision?',[
    ['Use monitored, authenticated, time-limited access to required repair systems','Scoped emergency access preserves necessary repair capability while limiting lateral movement and enabling timely revocation.'],
    ['Use an MFA-protected VPN with patient and dispatch subnets available for diagnosis','MFA authenticates the vendor but does not justify broad scope; unrelated patient systems remain unnecessarily exposed.'],
    ['Restrict access to repair hosts but retain the vendor account for future incidents','Host restrictions help, but persistent authorization exceeds this temporary repair; revoke access when the approved duration ends.'],
    ['Use a time-limited, logged jump host with a shared emergency vendor credential','A jump host and expiration limit exposure, but shared credentials weaken individual accountability and selective revocation.']],true);
  const api = {DOMAINS, QUESTION_BANK};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CampaignQuestions = api;
})(typeof window === 'undefined' ? globalThis : window);
