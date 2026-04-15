import { BudgetController } from './budget.controller.js';

export function initBudgetModule(state, container) {
    return new BudgetController(state, container);
}