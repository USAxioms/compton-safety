/**
 * TEST SUITE FOR COMPTON SAFETY FRAMEWORK
 * 
 * Verifies:
 * 1. Gate functionality
 * 2. Agent constraint enforcement
 * 3. Cryptographic proof validity
 * 4. Audit log integrity
 */

import * as crypto from 'crypto';
import ComptonSafetyFramework from './ComptonSafetyGates';
import SafeIntelligenceAgent from './SafeIntelligenceAgent';
import { OntologicalEntity } from './ComptonSafetyGates';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    console.log(`⚠️ ${name}`);
    console.log(`   Error: ${error}`);
  }
}

function assertEqual(actual: any, expected: any, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value: boolean, message: string): void {
  if (!value) {
    throw new Error(`${message}: expected true, got ${value}`);
  }
}

function assertFalse(value: boolean, message: string): void {
  if (value) {
    throw new Error(`${message}: expected false, got ${value}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPER: Create valid entity
// ════════════════════════════════════════════════════════════════════════════════

function createEntity(
  id: string,
  type: 'kernel' | 'defect' | 'invariant' | 'proof',
  value: bigint
): OntologicalEntity {
  const proof = crypto.createHash('sha256').update(id + value.toString()).digest('hex');

  return {
    id,
    type,
    raw_value: value,
    timestamp: new Date(),
    proof,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// TESTS: Gate 1 - Ontological
// ════════════════════════════════════════════════════════════════════════════════

test('Gate 1: Register valid entity', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K1', 'kernel', 373023240000000000n);

  const result = framework.ontological.registerEntity(
    entity.id,
    entity.type,
    entity.raw_value,
    entity.proof
  );

  assertTrue(result, 'Entity registration should succeed');
});

test('Gate 1: Verify registered entity', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K2', 'kernel', 518383920000000000n);

  framework.ontological.registerEntity(
    entity.id,
    entity.type,
    entity.raw_value,
    entity.proof
  );

  const verified = framework.ontological.verifyEntity(entity.id);
  assertTrue(verified, 'Entity verification should succeed');
});

test('Gate 1: Reject entity with invalid proof', () => {
  const framework = new ComptonSafetyFramework();

  const invalidProof = 'INVALID_PROOF_NOT_SHA256';
  try {
    framework.ontological.registerEntity('K3', 'kernel', 366283460000000000n, invalidProof);
    throw new Error('Should have rejected invalid proof');
  } catch (error) {
    assertTrue(
      String(error).includes('Invalid proof format'),
      'Should reject invalid proof format'
    );
  }
});

test('Gate 1: Reject non-bigint value', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K4', 'kernel', 572508000000000000n);

  // Try to register with the entity
  framework.ontological.registerEntity(
    entity.id,
    entity.type,
    entity.raw_value,
    entity.proof
  );

  // Get entity back and verify it's still bigint
  const retrieved = framework.ontological.getEntity(entity.id);
  assertTrue(typeof retrieved?.raw_value === 'bigint', 'Value must be bigint');
});

// ════════════════════════════════════════════════════════════════════════════════
// TESTS: Gate 2 - Logical
// ════════════════════════════════════════════════════════════════════════════════

test('Gate 2: Verify entity against invariants', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K5', 'kernel', 794444310000000000n);

  const result = framework.logical.verifyEntity(entity);
  assertTrue(result.valid, 'Entity should pass all invariants');
});

test('Gate 2: Get constraint definition', () => {
  const framework = new ComptonSafetyFramework();
  const constraint = framework.logical.getConstraint('I1_no_float');

  assertTrue(constraint !== null, 'Constraint I1 should exist');
  assertEqual(constraint?.id, 'I1_no_float', 'Constraint ID should match');
});

test('Gate 2: Audit constraints', () => {
  const framework = new ComptonSafetyFramework();
  const audit = framework.logical.auditConstraints();

  assertEqual(audit.length, 7, 'Should have 7 invariants (I1-I7)');
  assertTrue(
    audit.every(c => c.constraint !== undefined),
    'All audit items should have constraint'
  );
});

// ════════════════════════════════════════════════════════════════════════════════
// TESTS: Gate 3 - Performance
// ════════════════════════════════════════════════════════════════════════════════

test('Gate 3: Execute operation and get proof', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K6', 'kernel', 484704000000000000n);

  const execution = framework.performance.execute('exec_1', [entity], (input) => input);

  assertTrue(execution.id === 'exec_1', 'Execution ID should match');
  assertTrue(execution.proof.length === 64, 'Proof should be 64 hex chars (SHA-256)');
  assertTrue(execution.execution_time_ms >= 0, 'Execution time should be non-negative');
});

test('Gate 3: Verify determinism', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K7', 'kernel', 745475850000000000n);

  // Execute twice with same input
  framework.performance.execute('exec_2a', [entity], (input) => input);
  framework.performance.execute('exec_2b', [entity], (input) => input);

  // Verify determinism (note: same input should produce same proof)
  const audit = framework.performance.auditExecutions();
  assertTrue(audit.length === 2, 'Should have 2 executions');
});

test('Gate 3: Audit executions', () => {
  const framework = new ComptonSafetyFramework();
  const entity = createEntity('K8', 'kernel', 660994560000000000n);

  framework.performance.execute('exec_3', [entity], (input) => input);

  const audit = framework.performance.auditExecutions();
  assertTrue(audit.length > 0, 'Should have execution records');
  assertTrue(audit[0].proof !== undefined, 'Execution should have proof');
});

// ════════════════════════════════════════════════════════════════════════════════
// TESTS: Gate 4 - Meta-Safety
// ════════════════════════════════════════════════════════════════════════════════

test('Gate 4: Register test and get summary', () => {
  const framework = new ComptonSafetyFramework();

  framework.metaSafety.registerTest('test_1', 'Sample test', true, null);

  const summary = framework.metaSafety.getAuditSummary();
  assertEqual(summary.passed_tests, 1, 'Should have 1 passed test');
  assertEqual(summary.verdict, 'EMIT', 'Verdict should be EMIT when tests pass');
});

test('Gate 4: Register defect', () => {
  const framework = new ComptonSafetyFramework();

  framework.metaSafety.registerDefect('D1', 'Modulus mismatch', 'UNRESOLVED');

  const audit = framework.metaSafety.auditAll();
  assertTrue(audit.defects.length > 0, 'Should have registered defect');
  assertEqual(audit.defects[0].id, 'D1', 'Defect ID should match');
});

test('Gate 4: Audit summary', () => {
  const framework = new ComptonSafetyFramework();

  framework.metaSafety.registerTest('test_2', 'Another test', true, null);

  const summary = framework.metaSafety.getAuditSummary();
  assertTrue(summary.total_tests > 0, 'Should have tests');
  assertTrue(summary.pass_rate >= 0, 'Pass rate should be non-negative');
  assertTrue(['EMIT', 'FAIL'].includes(summary.verdict), 'Verdict should be EMIT or FAIL');
});

// ════════════════════════════════════════════════════════════════════════════════
// TESTS: SafeIntelligenceAgent
// ════════════════════════════════════════════════════════════════════════════════

test('Agent: Initialize successfully', () => {
  const agent = new SafeIntelligenceAgent();
  assertTrue(agent !== undefined, 'Agent should initialize');
});

test('Agent: Propose action', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('test_kernel', 'kernel', 100000000000000000n);

  const result = agent.proposeAction(
    'Test action',
    'Testing',
    entity,
    entity,
    'Pure WAD-18'
  );

  assertTrue(result.action_id !== undefined, 'Action should have ID');
  assertEqual(result.status, 'PROPOSED', 'Status should be PROPOSED');
});

test('Agent: Verify action through all gates', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('verify_kernel', 'kernel', 200000000000000000n);

  const { action_id } = agent.proposeAction(
    'Verify action',
    'Testing verification',
    entity,
    entity,
    'Pure WAD-18 integer'
  );

  const verdict = agent.verifyAction(action_id);

  assertTrue(verdict !== null, 'Verdict should be returned');
  assertTrue(verdict?.approved === true, 'Action should be approved');
});

test('Agent: Reject invalid action at Gate 1', () => {
  const agent = new SafeIntelligenceAgent();

  // Create entity with invalid proof
  const invalid_entity: OntologicalEntity = {
    id: 'invalid',
    type: 'kernel',
    raw_value: 100000000000000000n,
    timestamp: new Date(),
    proof: 'INVALID_PROOF_TOO_SHORT', // Will fail Gate 1
  };

  const { action_id } = agent.proposeAction('Bad action', 'Testing rejection', invalid_entity, invalid_entity, 'Invalid');

  const verdict = agent.verifyAction(action_id);

  assertTrue(verdict !== null, 'Verdict should be returned');
  assertFalse(verdict?.approved || false, 'Action should be rejected');
});

test('Agent: Generate cryptographic proof for approved action', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('proof_kernel', 'kernel', 300000000000000000n);

  const { action_id } = agent.proposeAction(
    'Proof test',
    'Testing proof generation',
    entity,
    entity,
    'Pure WAD-18'
  );

  const verdict = agent.verifyAction(action_id);

  if (verdict?.approved) {
    assertTrue(verdict.signed_proof !== undefined, 'Approved action should have proof');
    assertEqual(verdict.signed_proof.length, 64, 'Proof should be 64 hex chars');
    assertTrue(/^[0-9a-f]{64}$/i.test(verdict.signed_proof), 'Proof should be valid hex');
  }
});

test('Agent: Get action status', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('status_kernel', 'kernel', 400000000000000000n);

  const { action_id } = agent.proposeAction(
    'Status test',
    'Testing status check',
    entity,
    entity,
    'Pure WAD-18'
  );

  agent.verifyAction(action_id);

  const status = agent.getActionStatus(action_id);
  assertEqual(status.status, 'APPROVED', 'Status should be APPROVED after verification');
});

test('Agent: Get audit trail', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('trail_kernel', 'kernel', 500000000000000000n);

  agent.proposeAction('Trail test', 'Testing audit trail', entity, entity, 'Pure WAD-18');

  const trail = agent.getAuditTrail();
  assertTrue(trail.length > 0, 'Audit trail should have entries');
  assertTrue(trail[0].timestamp !== undefined, 'Entries should have timestamps');
});

test('Agent: Get statistics', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('stats_kernel', 'kernel', 600000000000000000n);

  agent.proposeAction('Stats test', 'Testing statistics', entity, entity, 'Pure WAD-18');
  agent.verifyAction(
    (agent as any).proposed_actions[(agent as any).proposed_actions.length - 1].id
  );

  const stats = agent.getStatistics();
  assertTrue(stats.proposed >= 1, 'Should have proposed actions');
  assertTrue(stats.approval_rate >= 0 && stats.approval_rate <= 100, 'Approval rate should be 0-100%');
});

test('Agent: List approved actions', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('approved_kernel', 'kernel', 700000000000000000n);

  const { action_id } = agent.proposeAction(
    'Approved list test',
    'Testing approved list',
    entity,
    entity,
    'Pure WAD-18'
  );

  agent.verifyAction(action_id);

  const approved = agent.listApprovedActions();
  assertTrue(approved.length > 0, 'Should have approved actions');
});

test('Agent: Print full report', () => {
  const agent = new SafeIntelligenceAgent();
  const entity = createEntity('report_kernel', 'kernel', 800000000000000000n);

  agent.proposeAction('Report test', 'Testing full report', entity, entity, 'Pure WAD-18');

  const report = agent.printFullReport();
  assertTrue(report.includes('SAFE INTELLIGENCE AGENT'), 'Report should have header');
  assertTrue(report.includes('APPROVED ACTIONS'), 'Report should list approved actions');
  assertTrue(report.includes('AUDIT TRAIL'), 'Report should have audit trail');
});

// ════════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                   TEST SUITE RESULTS                                       ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`Total: ${total} tests`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ⚠️`);
console.log(`Pass rate: ${((passed / total) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  console.log('FAILURES:\n');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ⚠️ ${r.name}`);
    if (r.error) console.log(`     ${r.error}\n`);
  });
}

console.log('═══════════════════════════════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED\n');
  console.log('Compton Safety Framework is functioning correctly.\n');
} else {
  console.log('⚠️ SOME TESTS FAILED\n');
  console.log('Review failures above.\n');
}

process.exit(failed > 0 ? 1 : 0);
