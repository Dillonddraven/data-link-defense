'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {QUESTION_BANK}=require('../app.js');
test('content: boss answers occupy four distinct slots while every domain stays balanced',()=>{
  const bosses=QUESTION_BANK.filter(q=>q.boss);
  assert.equal(bosses.length,4);
  assert.equal(new Set(bosses.map(q=>q.options.indexOf(q.answer))).size,4);
  for(const domain of [1,2,3,4]) {
    const counts=[0,0,0,0];
    for(const q of QUESTION_BANK.filter(q=>q.domain===domain)) counts[q.options.indexOf(q.answer)]++;
    assert.deepEqual(counts,[4,4,4,4]);
  }
});

const reviewedItems={
  'd2-13': {
    answer:'Verify authorization, encrypted delivery, and applicable handling terms',
    distractors:[
      ['Encrypt the file and let the supplier determine onward sharing',/onward|terms/i],
      ['Confirm a nondisclosure agreement and use the supplier’s public upload portal',/portal|access/i],
      ['Rely on supplier onboarding approval instead of checking the named recipient',/recipient|specific/i]
    ]
  },
  'd3-9': {
    answer:'Prioritize safe egress and emergency response for occupants',
    distractors:[
      ['Prioritize automatic suppression to contain damage to computing equipment',/equipment|egress/i],
      ['Prioritize redundant power and cooling to maintain critical service availability',/availability|life/i],
      ['Prioritize perimeter access monitoring to prevent theft during evacuation',/theft|life/i]
    ]
  },
  'd4-16': {
    answer:'Use monitored, authenticated, time-limited access to required repair systems',
    distractors:[
      ['Use an MFA-protected VPN with patient and dispatch subnets available for diagnosis',/scope|unrelated/i],
      ['Restrict access to repair hosts but retain the vendor account for future incidents',/duration|revoke|persistent/i],
      ['Use a time-limited, logged jump host with a shared emergency vendor credential',/shared|accountability/i]
    ]
  }
};
for(const [id,{answer,distractors}] of Object.entries(reviewedItems)) {
  test(`content: ${id} retains credible competing controls and option-specific teaching`,()=>{
    const q=QUESTION_BANK.find(q=>q.id===id);
    for(const [option,rationale] of distractors) {
      assert.ok(q.options.includes(option),`${id}: realistic alternative missing: ${option}`);
      assert.match(q.rationales[option],rationale);
      assert.notEqual(option,q.answer);
    }
    assert.equal(q.answer,answer);
    assert.ok(q.rationales[answer].length>20);
    assert.ok(answer.length<=Math.max(...distractors.map(([option])=>option.length)),`${id}: correct answer must not be uniquely longest`);
    assert.equal(new Set(Object.values(q.rationales)).size,4);
  });
}

test('content: distractors use relevant competing security decisions rather than unrelated trivia',()=>{
  const replacements={
    'd1-6':'Prioritize solely by the number of users on each system',
    'd1-10':'A step-by-step encryption installation procedure',
    'd1-14':'Measure only participant satisfaction with the training',
    'd2-8':'Apply database encryption at rest without changing runtime privileges',
    'd2-10':'Scan outgoing attachments only for known malware',
    'd2-11':'Retain all copies until a storage budget review',
    'd2-15':'Check only the region used for service billing',
    'd3-4':'Clark-Wilson',
    'd3-6':'Distribute the same symmetric signing secret to every customer',
    'd3-7':'Accept if the certificate has not expired, without matching the hostname',
    'd3-8':'Change the server login password but keep the certificate and key',
    'd3-11':'Rely solely on address space layout randomization',
    'd3-13':'Add a fixed delay while retaining secret-dependent execution paths',
    'd3-16':'Replicate data to another rack in the same power and cooling zone',
    'd4-3':'Use endpoint antivirus instead of restricting inter-VLAN traffic',
    'd4-5':'Use a VPN to a third-party gateway while leaving the web connection as HTTP',
    'd4-6':'Use SNMPv3 as the interactive command shell',
    'd4-9':'A SIEM receiving logs asynchronously from network devices',
    'd4-10':'Application payload decryption alone',
    'd4-12':'Enable IPsec support without configuring or enforcing its use',
    'd4-13':'Average latency without considering variation',
    'd4-14':'Use one shared administrative account for every management session'
  };
  for(const [id,option] of Object.entries(replacements)) assert.ok(QUESTION_BANK.find(q=>q.id===id).options.includes(option),`${id}: realistic alternative missing`);
});
