// Models/Budget.cs
namespace SmartCampusWallet.Api.Models;

public enum BudgetPeriodType
{
    Monthly = 0,
    Weekly = 1
}

public class Budget
{
    public int Id { get; set; }

    public int UserId { get; set; }

    // e.g. "Dining", "Transport", "Books", "Events", "Groceries"
    public string Category { get; set; } = null!;

    public BudgetPeriodType PeriodType { get; set; } = BudgetPeriodType.Monthly;

    public decimal LimitAmount { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // for 80% notifications – we only want to send once per period
    public DateTime? LastAlertSentAt { get; set; }
    
    // Track if 100% alert has been sent this period
    public bool OverBudgetAlertSent { get; set; } = false;
}
