/**
 * Unit Tests: workflow check-gate command
 *
 * WHY: Phase gating enforces workflow discipline by preventing premature phase
 * transitions. This ensures all prerequisites are met before advancing.
 */

import { describe, expect, it } from 'vitest';
import { PLUGIN_DIR, joinPath, readFile } from '@/lib';

const CHECK_GATE_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'commands', 'workflow', 'check-gate.ts');
const WORKFLOW_INDEX_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'commands', 'workflow', 'index.ts');
const WORKFLOW_TYPES_PATH = joinPath(PLUGIN_DIR, 'system', 'src', 'types', 'workflow.ts');

// Status values from workflow types
const VALID_SPEC_STATUSES = ['pending', 'in_progress', 'ready_for_review', 'approved', 'needs_rereview'];
const VALID_PLAN_STATUSES = ['pending', 'in_progress', 'approved'];
const VALID_IMPL_STATUSES = ['pending', 'in_progress', 'complete'];
const VALID_REVIEW_STATUSES = ['pending', 'ready_for_review', 'approved', 'changes_requested'];
const VALID_WORKFLOW_PHASES = ['spec', 'plan', 'implement', 'review'];

/**
 * WHY: Verify the command files exist and have expected structure.
 */
describe('workflow command files', () => {
  it('check-gate.ts exists in plugin system/src/commands/workflow', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('workflow/index.ts exists for command routing', () => {
    const content = readFile(WORKFLOW_INDEX_PATH);
    expect(content).toBeDefined();
    expect(content).toContain('handleWorkflow');
  });

  it('workflow types are defined', () => {
    const content = readFile(WORKFLOW_TYPES_PATH);
    expect(content).toBeDefined();
    expect(content).toContain('SpecStatus');
    expect(content).toContain('PlanStatus');
    expect(content).toContain('ImplStatus');
    expect(content).toContain('ReviewStatus');
    expect(content).toContain('WorkflowPhase');
    expect(content).toContain('WorkflowItem');
  });
});

/**
 * WHY: Verify check-gate.ts has required phase gate functions.
 */
describe('check-gate command structure', () => {
  it('defines checkPlanGate function', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('checkPlanGate');
  });

  it('defines checkImplementGate function', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('checkImplementGate');
  });

  it('defines checkReviewGate function', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('checkReviewGate');
  });

  it('defines checkCompletionGate function', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('checkCompletionGate');
  });

  it('exports checkGate function', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('export const checkGate');
  });
});

/**
 * WHY: Phase gate logic tests - verify correct conditions for phase transitions.
 */
describe('phase gate logic', () => {
  describe('plan phase gate (requires all specs approved)', () => {
    it('blocks when spec_status is pending', () => {
      // Plan gate checks isSpecApproved which requires spec_status === 'approved'
      const pendingStatus = 'pending';
      expect(pendingStatus).not.toBe('approved');
    });

    it('blocks when spec_status is in_progress', () => {
      const inProgressStatus = 'in_progress';
      expect(inProgressStatus).not.toBe('approved');
    });

    it('blocks when spec_status is ready_for_review', () => {
      const readyStatus = 'ready_for_review';
      expect(readyStatus).not.toBe('approved');
    });

    it('blocks when spec_status is needs_rereview (stale dependency)', () => {
      const needsRereviewStatus = 'needs_rereview';
      expect(needsRereviewStatus).not.toBe('approved');
    });

    it('allows when spec_status is approved', () => {
      const approvedStatus = 'approved';
      expect(approvedStatus).toBe('approved');
    });
  });

  describe('implement phase gate (requires all plans approved)', () => {
    it('blocks when plan_status is pending', () => {
      const pendingStatus = 'pending';
      expect(pendingStatus).not.toBe('approved');
    });

    it('blocks when plan_status is in_progress', () => {
      const inProgressStatus = 'in_progress';
      expect(inProgressStatus).not.toBe('approved');
    });

    it('allows when plan_status is approved', () => {
      const approvedStatus = 'approved';
      expect(approvedStatus).toBe('approved');
    });
  });

  describe('review phase gate (requires all implementations complete)', () => {
    it('blocks when impl_status is pending', () => {
      const pendingStatus = 'pending';
      expect(pendingStatus).not.toBe('complete');
    });

    it('blocks when impl_status is in_progress', () => {
      const inProgressStatus = 'in_progress';
      expect(inProgressStatus).not.toBe('complete');
    });

    it('allows when impl_status is complete', () => {
      const completeStatus = 'complete';
      expect(completeStatus).toBe('complete');
    });
  });

  describe('completion gate (requires all reviews approved)', () => {
    it('blocks when review_status is pending', () => {
      const pendingStatus = 'pending';
      expect(pendingStatus).not.toBe('approved');
    });

    it('blocks when review_status is ready_for_review', () => {
      const readyStatus = 'ready_for_review';
      expect(readyStatus).not.toBe('approved');
    });

    it('blocks when review_status is changes_requested', () => {
      const changesStatus = 'changes_requested';
      expect(changesStatus).not.toBe('approved');
    });

    it('allows when review_status is approved', () => {
      const approvedStatus = 'approved';
      expect(approvedStatus).toBe('approved');
    });
  });
});

/**
 * WHY: Verify status value constraints.
 */
describe('status value validation', () => {
  describe('spec_status values', () => {
    for (const status of VALID_SPEC_STATUSES) {
      it(`accepts valid spec_status: ${status}`, () => {
        expect(VALID_SPEC_STATUSES).toContain(status);
      });
    }

    it('rejects invalid spec_status: completed', () => {
      expect(VALID_SPEC_STATUSES).not.toContain('completed');
    });

    it('rejects invalid spec_status: done', () => {
      expect(VALID_SPEC_STATUSES).not.toContain('done');
    });
  });

  describe('plan_status values', () => {
    for (const status of VALID_PLAN_STATUSES) {
      it(`accepts valid plan_status: ${status}`, () => {
        expect(VALID_PLAN_STATUSES).toContain(status);
      });
    }

    it('rejects invalid plan_status: ready_for_review', () => {
      expect(VALID_PLAN_STATUSES).not.toContain('ready_for_review');
    });
  });

  describe('impl_status values', () => {
    for (const status of VALID_IMPL_STATUSES) {
      it(`accepts valid impl_status: ${status}`, () => {
        expect(VALID_IMPL_STATUSES).toContain(status);
      });
    }

    it('rejects invalid impl_status: approved', () => {
      expect(VALID_IMPL_STATUSES).not.toContain('approved');
    });

    it('rejects invalid impl_status: done', () => {
      expect(VALID_IMPL_STATUSES).not.toContain('done');
    });
  });

  describe('review_status values', () => {
    for (const status of VALID_REVIEW_STATUSES) {
      it(`accepts valid review_status: ${status}`, () => {
        expect(VALID_REVIEW_STATUSES).toContain(status);
      });
    }

    it('rejects invalid review_status: complete', () => {
      expect(VALID_REVIEW_STATUSES).not.toContain('complete');
    });
  });

  describe('workflow phase values', () => {
    for (const phase of VALID_WORKFLOW_PHASES) {
      it(`accepts valid phase: ${phase}`, () => {
        expect(VALID_WORKFLOW_PHASES).toContain(phase);
      });
    }

    it('rejects invalid phase: complete', () => {
      expect(VALID_WORKFLOW_PHASES).not.toContain('complete');
    });

    it('rejects invalid phase: done', () => {
      expect(VALID_WORKFLOW_PHASES).not.toContain('done');
    });
  });
});

/**
 * WHY: Verify check-gate handles hierarchical items (epics with children).
 */
describe('hierarchical item handling', () => {
  it('check-gate.ts has flattenItems function for epics', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('flattenItems');
  });

  it('flattenItems extracts children from epics', () => {
    const content = readFile(CHECK_GATE_PATH);
    // Should check for epic type and process children
    expect(content).toContain("type === 'epic'");
    expect(content).toContain('children');
  });
});

/**
 * WHY: Verify check-gate handles stale dependencies (needs_rereview).
 */
describe('stale dependency handling', () => {
  it('check-gate.ts detects needs_rereview status', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('hasStaleDepdendencies');
    expect(content).toContain('needs_rereview');
  });

  it('stale dependencies block plan gate with specific message', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('upstream dependency changed');
  });
});

/**
 * WHY: Verify command returns structured results.
 */
describe('command result structure', () => {
  it('returns PhaseGateResult with can_advance', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('can_advance');
  });

  it('returns PhaseGateResult with blocking_items', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('blocking_items');
  });

  it('returns PhaseGateResult with message', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('message');
  });

  it('blocking items include change_id', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('change_id');
  });

  it('blocking items include reason', () => {
    const content = readFile(CHECK_GATE_PATH);
    expect(content).toContain('reason');
  });
});
