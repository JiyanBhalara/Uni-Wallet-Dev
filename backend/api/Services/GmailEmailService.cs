// Services/GmailEmailService.cs
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SmartCampusWallet.Api.Services;

public class GmailEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<GmailEmailService> _logger;

    public GmailEmailService(IConfiguration config, ILogger<GmailEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendBudgetAlertAsync(
        string toEmail,
        string userName,
        string category,
        decimal limit,
        decimal spent,
        decimal ratio,
        List<TransactionSummary> recentTransactions)
    {
        try
        {
            var isOverBudget = ratio >= 1.0m;
            var subject = isOverBudget
                ? $"⚠️ Budget Exceeded Alert - {category}"
                : $"⚠️ Budget Warning - {category} at {ratio:P0}";

            var htmlBody = isOverBudget
                ? GenerateOverBudgetEmail(userName, category, limit, spent, ratio, recentTransactions)
                : GenerateWarningEmail(userName, category, limit, spent, ratio, recentTransactions);

            await SendEmailAsync(toEmail, subject, htmlBody);

            _logger.LogInformation(
                "Budget alert email sent to {Email}: Category {Category} is at {Ratio:P0}",
                toEmail, category, ratio);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send budget alert email to {Email}", toEmail);
            throw;
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var smtpHost = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var senderEmail = _config["Email:SenderEmail"];
        var senderPassword = _config["Email:SenderPassword"];
        var senderName = _config["Email:SenderName"] ?? "UniPay";

        if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
        {
            _logger.LogWarning("Email credentials not configured. Email not sent.");
            return;
        }

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(senderEmail, senderPassword)
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage);
    }

    private string GenerateWarningEmail(
        string userName,
        string category,
        decimal limit,
        decimal spent,
        decimal ratio,
        List<TransactionSummary> recentTransactions)
    {
        var percentage = (ratio * 100).ToString("F1");
        var remaining = limit - spent;

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #283618; background-color: #FEFAE0; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #606C38 0%, #283618 100%); color: #FEFAE0; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ padding: 30px 20px; }}
        .alert-box {{ background-color: #FFF3CD; border-left: 4px solid #DDA15E; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .alert-box h2 {{ margin-top: 0; color: #BC6C25; font-size: 20px; }}
        .stats {{ display: table; width: 100%; margin: 20px 0; }}
        .stat-item {{ display: table-cell; text-align: center; padding: 15px; }}
        .stat-value {{ font-size: 28px; font-weight: bold; color: #BC6C25; }}
        .stat-label {{ font-size: 14px; color: #606C38; margin-top: 5px; }}
        .progress-bar {{ width: 100%; height: 30px; background-color: #E9EDC9; border-radius: 15px; overflow: hidden; margin: 20px 0; position: relative; }}
        .progress-fill {{ height: 100%; background: linear-gradient(90deg, #DDA15E 0%, #BC6C25 100%); transition: width 0.3s; }}
        .progress-text {{ position: absolute; width: 100%; text-align: center; line-height: 30px; font-weight: bold; color: #283618; }}
        .transactions {{ margin: 20px 0; }}
        .transaction {{ background-color: #FEFAE0; padding: 12px; margin: 8px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }}
        .transaction-info {{ flex: 1; }}
        .transaction-merchant {{ font-weight: bold; color: #283618; }}
        .transaction-date {{ font-size: 12px; color: #606C38; margin-top: 2px; }}
        .transaction-amount {{ font-size: 18px; font-weight: bold; color: #BC6C25; }}
        .recommendations {{ background-color: #E9EDC9; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .recommendations h3 {{ margin-top: 0; color: #283618; }}
        .recommendations ul {{ margin: 10px 0; padding-left: 20px; }}
        .recommendations li {{ margin: 8px 0; color: #606C38; }}
        .footer {{ background-color: #F8F9FA; padding: 20px; text-align: center; font-size: 12px; color: #606C38; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #606C38; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>⚠️ Budget Warning Alert</h1>
        </div>
        <div class=""content"">
            <p>Hi <strong>{userName}</strong>,</p>
            
            <div class=""alert-box"">
                <h2>You've reached {percentage}% of your {category} budget</h2>
                <p>Your spending in the <strong>{category}</strong> category is approaching your monthly limit. Please review your recent transactions and adjust your spending accordingly.</p>
            </div>

            <div class=""stats"">
                <div class=""stat-item"">
                    <div class=""stat-value"">${spent:F2}</div>
                    <div class=""stat-label"">Spent</div>
                </div>
                <div class=""stat-item"">
                    <div class=""stat-value"">${remaining:F2}</div>
                    <div class=""stat-label"">Remaining</div>
                </div>
                <div class=""stat-item"">
                    <div class=""stat-value"">${limit:F2}</div>
                    <div class=""stat-label"">Budget Limit</div>
                </div>
            </div>

            <div class=""progress-bar"">
                <div class=""progress-fill"" style=""width: {percentage}%""></div>
                <div class=""progress-text"">{percentage}%</div>
            </div>

            <div class=""transactions"">
                <h3 style=""color: #283618;"">Recent {category} Transactions</h3>
                {GenerateTransactionList(recentTransactions)}
            </div>

            <div class=""recommendations"">
                <h3>💡 Tips to Stay on Track</h3>
                <ul>
                    <li>Review your recent transactions and identify areas to cut back</li>
                    <li>Consider setting daily spending limits for this category</li>
                    <li>Track your expenses more frequently to avoid overspending</li>
                    <li>Look for alternative options or discounts in this category</li>
                </ul>
            </div>

            <p style=""text-align: center; margin-top: 30px;"">
                <a href=\""http://localhost:3000/budgeting\"" class=\""button\"">View Full Budget Details</a>
            </p>

            <p style=\""color: #606C38; font-size: 14px; margin-top: 20px;\"">
                Keep track of your spending to avoid exceeding your budget. You can adjust your budget limits anytime from your dashboard.
            </p>
        </div>
        <div class=\""footer\"">
            <p>© 2025 UniPay. Smarter Wallet, Smarter You.</p>
            <p>This is an automated budget alert. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>\";
    }

    private string GenerateOverBudgetEmail(
        string userName,
        string category,
        decimal limit,
        decimal spent,
        decimal ratio,
        List<TransactionSummary> recentTransactions)
    {
        var percentage = (ratio * 100).ToString("F1");
        var overAmount = spent - limit;

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #283618; background-color: #FEFAE0; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ padding: 30px 20px; }}
        .alert-box {{ background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .alert-box h2 {{ margin-top: 0; color: #991B1B; font-size: 20px; }}
        .stats {{ display: table; width: 100%; margin: 20px 0; }}
        .stat-item {{ display: table-cell; text-align: center; padding: 15px; }}
        .stat-value {{ font-size: 28px; font-weight: bold; color: #DC2626; }}
        .stat-label {{ font-size: 14px; color: #606C38; margin-top: 5px; }}
        .progress-bar {{ width: 100%; height: 30px; background-color: #E9EDC9; border-radius: 15px; overflow: hidden; margin: 20px 0; position: relative; }}
        .progress-fill {{ height: 100%; background: linear-gradient(90deg, #DC2626 0%, #991B1B 100%); transition: width 0.3s; }}
        .progress-text {{ position: absolute; width: 100%; text-align: center; line-height: 30px; font-weight: bold; color: white; }}
        .transactions {{ margin: 20px 0; }}
        .transaction {{ background-color: #FEFAE0; padding: 12px; margin: 8px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }}
        .transaction-info {{ flex: 1; }}
        .transaction-merchant {{ font-weight: bold; color: #283618; }}
        .transaction-date {{ font-size: 12px; color: #606C38; margin-top: 2px; }}
        .transaction-amount {{ font-size: 18px; font-weight: bold; color: #DC2626; }}
        .recommendations {{ background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #DC2626; }}
        .recommendations h3 {{ margin-top: 0; color: #991B1B; }}
        .recommendations ul {{ margin: 10px 0; padding-left: 20px; }}
        .recommendations li {{ margin: 8px 0; color: #606C38; }}
        .footer {{ background-color: #F8F9FA; padding: 20px; text-align: center; font-size: 12px; color: #606C38; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🚨 Budget Exceeded Alert</h1>
        </div>
        <div class=""content"">
            <p>Hi <strong>{userName}</strong>,</p>
            
            <div class=""alert-box"">
                <h2>You've exceeded your {category} budget by ${overAmount:F2}</h2>
                <p>Your spending in the <strong>{category}</strong> category has surpassed your monthly limit. Immediate action is recommended to avoid further overspending.</p>
            </div>

            <div class=""stats"">
                <div class=""stat-item"">
                    <div class=""stat-value"">${spent:F2}</div>
                    <div class=""stat-label"">Total Spent</div>
                </div>
                <div class=""stat-item"">
                    <div class=""stat-value"">${overAmount:F2}</div>
                    <div class=""stat-label"">Over Budget</div>
                </div>
                <div class=""stat-item"">
                    <div class=""stat-value"">${limit:F2}</div>
                    <div class=""stat-label"">Budget Limit</div>
                </div>
            </div>

            <div class=""progress-bar"">
                <div class=""progress-fill"" style=""width: 100%""></div>
                <div class=""progress-text"">{percentage}% (Exceeded)</div>
            </div>

            <div class=""transactions"">
                <h3 style=""color: #991B1B;"">Recent {category} Transactions</h3>
                {GenerateTransactionList(recentTransactions)}
            </div>

            <div class=""recommendations"">
                <h3>⚠️ Immediate Actions Required</h3>
                <ul>
                    <li><strong>Review and analyze</strong> your spending patterns in this category</li>
                    <li><strong>Cut back</strong> on non-essential expenses immediately</li>
                    <li><strong>Adjust your budget</strong> for next month to be more realistic</li>
                    <li><strong>Plan your expenses</strong> carefully before making purchases</li>
                    <li><strong>Set up alerts</strong> for daily spending limits to prevent this in future</li>
                </ul>
                <p style=""margin-top: 15px; color: #991B1B; font-weight: bold;"">
                    💡 Pro Tip: Consider increasing your budget limit if this category consistently exceeds expectations, or find ways to reduce spending.
                </p>
            </div>

            <p style=""text-align: center; margin-top: 30px;"">
                <a href=""http://localhost:3000/budgeting"" class=""button"">Adjust Budget Settings</a>
            </p>

            <p style=""color: #991B1B; font-size: 14px; margin-top: 20px; font-weight: bold;"">
                ⚠️ Please plan your expenses more carefully next time to avoid overspending and stay within your budget limits.
            </p>
        </div>
        <div class=""footer"">
            <p>© 2025 Smart Campus Wallet. All rights reserved.</p>
            <p>This is an automated budget alert. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateTransactionList(List<TransactionSummary> transactions)
    {
        if (transactions == null || !transactions.Any())
        {
            return "<p style=\"color: #606C38; text-align: center;\">No recent transactions to display.</p>";
        }

        var html = "";
        foreach (var txn in transactions.Take(10))
        {
            html += $@"
                <div class=""transaction"">
                    <div class=""transaction-info"">
                        <div class=""transaction-merchant"">{txn.Merchant}</div>
                        <div class=""transaction-date"">{txn.Date:MMM dd, yyyy} • {txn.Location}</div>
                    </div>
                    <div class=""transaction-amount"">-${Math.Abs(txn.Amount):F2}</div>
                </div>";
        }

        if (transactions.Count > 10)
        {
            html += $"<p style=\"text-align: center; color: #606C38; font-size: 12px; margin-top: 10px;\">+ {transactions.Count - 10} more transactions</p>";
        }

        return html;
    }
}

public class TransactionSummary
{
    public string Merchant { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Location { get; set; } = string.Empty;
}
