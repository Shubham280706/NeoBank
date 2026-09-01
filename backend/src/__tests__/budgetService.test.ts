import { jest } from "@jest/globals";
import { makeChain } from "./helpers/supabaseMock.js";

const fromBudgets = jest.fn();

jest.unstable_mockModule("../config/supabase.js", () => ({
  requireSupabase: () => ({
    from: (table: string) => {
      if (table === "budgets") return fromBudgets();
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

const budgetService = await import("../services/budgetService.js");

describe("budgetService ownership checks", () => {
  it("updateBudget throws 404 for a budget the user does not own, without issuing an update", async () => {
    // ensureOwned() query finds nothing for this user.
    fromBudgets.mockReturnValueOnce(makeChain({ data: null, error: { message: "no rows" } }));

    await expect(budgetService.updateBudget("user-1", "budget-not-mine", { amount: 5000 })).rejects.toMatchObject({
      status: 404,
      message: "Budget not found",
    });

    // Only the ownership-check `.from("budgets")` call should have happened —
    // no second call to perform the actual update.
    expect(fromBudgets).toHaveBeenCalledTimes(1);
  });

  it("deleteBudget throws 404 for a budget the user does not own, without issuing a delete", async () => {
    fromBudgets.mockReturnValueOnce(makeChain({ data: null, error: { message: "no rows" } }));

    await expect(budgetService.deleteBudget("user-1", "budget-not-mine")).rejects.toMatchObject({
      status: 404,
      message: "Budget not found",
    });

    expect(fromBudgets).toHaveBeenCalledTimes(1);
  });

  it("updateBudget proceeds to the update call once ownership is confirmed", async () => {
    fromBudgets
      .mockReturnValueOnce(makeChain({ data: { id: "budget-1" }, error: null })) // ensureOwned
      .mockReturnValueOnce(makeChain({ data: { id: "budget-1", amount: 5000 }, error: null })); // update

    const result = await budgetService.updateBudget("user-1", "budget-1", { amount: 5000 });

    expect(result).toEqual({ id: "budget-1", amount: 5000 });
    expect(fromBudgets).toHaveBeenCalledTimes(2);
  });
});
