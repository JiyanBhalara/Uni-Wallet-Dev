// Services/IEmailService.cs
namespace SmartCampusWallet.Api.Services;

public interface IEmailService
{
    Task SendBudgetAlertAsync(
        string toEmail,
        string userName,
        string category,
        decimal limit,
        decimal spent,
        decimal ratio,
        List<TransactionSummary> recentTransactions);
}
