using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;
using SmartCampusWallet.Api.Services;

namespace SmartCampusWallet.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlaidController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPlaidService _plaidService;
        private readonly ILogger<PlaidController> _logger;

        public PlaidController(AppDbContext context, IPlaidService plaidService, ILogger<PlaidController> logger)
        {
            _context = context;
            _plaidService = plaidService;
            _logger = logger;
        }

        [HttpPost("create-link-token")]
        public async Task<IActionResult> CreateLinkToken([FromBody] CreateLinkTokenRequest request)
        {
            try
            {
                var linkToken = await _plaidService.CreateLinkTokenAsync(request.UserId);
                return Ok(new { link_token = linkToken });
            }
            catch (Exception ex)
            {
                _logger.LogError($"CreateLinkToken error: {ex.Message}");
                return StatusCode(500, new { error = "Failed to create link token" });
            }
        }

        [HttpPost("exchange-token")]
        public async Task<IActionResult> ExchangePublicToken([FromBody] ExchangeTokenRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }

                var result = await _plaidService.ExchangePublicTokenAsync(request.PublicToken, request.UserId);

                // Get institution name if available
                string institutionName = "Unknown Institution";
                if (!string.IsNullOrEmpty(result.InstitutionId))
                {
                    institutionName = await GetInstitutionNameAsync(result.InstitutionId);
                }

                // Create linked accounts for each account returned
                var linkedAccounts = new List<LinkedAccount>();
                foreach (var account in result.Accounts)
                {
                    // Create a wallet for this bank account
                    var wallet = new Wallet
                    {
                        UserId = request.UserId,
                        Type = WalletType.BankLinked,
                        DisplayName = $"{institutionName} {account.Name ?? account.Type} ••{account.Mask}",
                        Balance = account.Balance ?? 0,
                        Currency = "USD",
                        IsPrimary = false
                    };

                    _context.Wallets.Add(wallet);
                    await _context.SaveChangesAsync(); // Save to get wallet ID

                    var linkedAccount = new LinkedAccount
                    {
                        UserId = request.UserId,
                        AccessToken = result.AccessToken,
                        ItemId = result.ItemId,
                        InstitutionId = result.InstitutionId,
                        InstitutionName = institutionName,
                        AccountId = account.AccountId,
                        AccountName = account.Name,
                        AccountType = account.Type,
                        AccountMask = account.Mask,
                        LinkedAt = DateTime.UtcNow,
                        IsActive = true,
                        WalletId = wallet.Id
                    };

                    _context.LinkedAccounts.Add(linkedAccount);
                    linkedAccounts.Add(linkedAccount);
                }

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    message = "Bank accounts linked successfully",
                    accounts = linkedAccounts.Select(a => new
                    {
                        id = a.Id,
                        name = a.AccountName,
                        type = a.AccountType,
                        mask = a.AccountMask,
                        institution = a.InstitutionName
                    })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"ExchangePublicToken error: {ex.Message}");
                return StatusCode(500, new { error = "Failed to link bank account" });
            }
        }

        [HttpGet("accounts/{userId}")]
        public async Task<IActionResult> GetLinkedAccounts(int userId)
        {
            try
            {
                var accounts = await _context.LinkedAccounts
                    .Where(a => a.UserId == userId && a.IsActive)
                    .OrderByDescending(a => a.LinkedAt)
                    .Select(a => new
                    {
                        id = a.Id,
                        name = a.AccountName,
                        type = a.AccountType,
                        mask = a.AccountMask,
                        institution = a.InstitutionName,
                        linkedAt = a.LinkedAt,
                        lastSynced = a.LastSyncedAt
                    })
                    .ToListAsync();

                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError($"GetLinkedAccounts error: {ex.Message}");
                return StatusCode(500, new { error = "Failed to get linked accounts" });
            }
        }

        [HttpPost("sync/{linkedAccountId}")]
        public async Task<IActionResult> SyncTransactions(int linkedAccountId)
        {
            try
            {
                var linkedAccount = await _context.LinkedAccounts
                    .Include(a => a.User)
                    .Include(a => a.Wallet)
                    .FirstOrDefaultAsync(a => a.Id == linkedAccountId);

                if (linkedAccount == null)
                {
                    return NotFound(new { error = "Linked account not found" });
                }

                if (!linkedAccount.IsActive)
                {
                    return BadRequest(new { error = "Account is not active" });
                }

                // Refresh balance from Plaid
                var accounts = await _plaidService.GetAccountsAsync(linkedAccount.AccessToken);
                var plaidAccount = accounts.FirstOrDefault(a => a.AccountId == linkedAccount.AccountId);
                
                if (plaidAccount?.Balance.HasValue == true && linkedAccount.Wallet != null)
                {
                    linkedAccount.Wallet.Balance = plaidAccount.Balance.Value;
                }

                var transactions = await _plaidService.SyncTransactionsAsync(
                    linkedAccount.UserId, 
                    linkedAccountId
                );

                // Import transactions into database
                var importedCount = 0;
                foreach (var plaidTx in transactions)
                {
                    // Check if transaction already exists
                    var exists = await _context.Transactions
                        .AnyAsync(t => t.PlaidTransactionId == plaidTx.TransactionId);

                    if (!exists)
                    {
                        if (linkedAccount.Wallet == null) continue;

                        var transaction = new Transaction
                        {
                            UserId = linkedAccount.UserId,
                            WalletId = linkedAccount.Wallet.Id,
                            Amount = plaidTx.Amount,
                            Date = plaidTx.Date,
                            Merchant = plaidTx.Name ?? plaidTx.MerchantName ?? "Transaction",
                            Category = plaidTx.Category.FirstOrDefault() ?? "Other",
                            PlaidTransactionId = plaidTx.TransactionId,
                            LinkedAccountId = linkedAccountId
                        };

                        _context.Transactions.Add(transaction);
                        importedCount++;
                    }
                }

                linkedAccount.LastSyncedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    message = $"Synced {importedCount} new transactions",
                    importedCount = importedCount,
                    lastSynced = linkedAccount.LastSyncedAt,
                    balance = linkedAccount.Wallet?.Balance
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"SyncTransactions error: {ex.Message}");
                return StatusCode(500, new { error = "Failed to sync transactions" });
            }
        }

        [HttpDelete("unlink/{linkedAccountId}")]
        public async Task<IActionResult> UnlinkAccount(int linkedAccountId)
        {
            try
            {
                var linkedAccount = await _context.LinkedAccounts
                    .FindAsync(linkedAccountId);

                if (linkedAccount == null)
                {
                    return NotFound(new { error = "Linked account not found" });
                }

                linkedAccount.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Account unlinked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"UnlinkAccount error: {ex.Message}");
                return StatusCode(500, new { error = "Failed to unlink account" });
            }
        }

        private async Task<string> GetInstitutionNameAsync(string institutionId)
        {
            // This would make a call to Plaid's /institutions/get_by_id endpoint
            // For now, return a default name - full implementation can be added later
            return "Bank Institution";
        }
    }

    public class CreateLinkTokenRequest
    {
        public int UserId { get; set; }
    }

    public class ExchangeTokenRequest
    {
        public int UserId { get; set; }
        public string PublicToken { get; set; } = string.Empty;
    }
}
