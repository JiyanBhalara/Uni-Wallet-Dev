using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Services
{
    public interface IPlaidService
    {
        Task<string> CreateLinkTokenAsync(int userId);
        Task<LinkedAccountResult> ExchangePublicTokenAsync(string publicToken, int userId);
        Task<List<PlaidTransaction>> SyncTransactionsAsync(int userId, int linkedAccountId);
        Task<List<PlaidAccount>> GetAccountsAsync(string accessToken);
    }

    public class PlaidService : IPlaidService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<PlaidService> _logger;
        private readonly string _clientId;
        private readonly string _secret;
        private readonly string _environment;
        private readonly string _baseUrl;

        public PlaidService(HttpClient httpClient, IConfiguration config, ILogger<PlaidService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
            
            _clientId = _config["Plaid:ClientId"] ?? throw new Exception("Plaid ClientId not configured");
            _secret = _config["Plaid:Secret"] ?? throw new Exception("Plaid Secret not configured");
            _environment = _config["Plaid:Environment"] ?? "sandbox";
            
            _baseUrl = _environment switch
            {
                "sandbox" => "https://sandbox.plaid.com",
                "development" => "https://development.plaid.com",
                "production" => "https://production.plaid.com",
                _ => "https://sandbox.plaid.com"
            };
        }

        public async Task<string> CreateLinkTokenAsync(int userId)
        {
            try
            {
                var requestBody = new
                {
                    client_id = _clientId,
                    secret = _secret,
                    user = new { client_user_id = userId.ToString() },
                    client_name = "UniPay",
                    products = new[] { "transactions" },
                    country_codes = new[] { "US" },
                    language = "en"
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_baseUrl}/link/token/create", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Plaid Link Token Error: {responseContent}");
                    throw new Exception("Failed to create Plaid Link token");
                }

                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                return result.GetProperty("link_token").GetString() ?? throw new Exception("No link token returned");
            }
            catch (Exception ex)
            {
                _logger.LogError($"CreateLinkToken error: {ex.Message}");
                throw;
            }
        }

        public async Task<LinkedAccountResult> ExchangePublicTokenAsync(string publicToken, int userId)
        {
            try
            {
                // Exchange public token for access token
                var exchangeBody = new
                {
                    client_id = _clientId,
                    secret = _secret,
                    public_token = publicToken
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(exchangeBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_baseUrl}/item/public_token/exchange", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Token exchange error: {responseContent}");
                    throw new Exception("Failed to exchange public token");
                }

                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var accessToken = result.GetProperty("access_token").GetString() 
                    ?? throw new Exception("No access token returned");
                var itemId = result.GetProperty("item_id").GetString() 
                    ?? throw new Exception("No item ID returned");

                // Get accounts
                var accounts = await GetAccountsAsync(accessToken);

                // Get institution info
                var itemBody = new
                {
                    client_id = _clientId,
                    secret = _secret,
                    access_token = accessToken
                };

                content = new StringContent(
                    JsonSerializer.Serialize(itemBody),
                    Encoding.UTF8,
                    "application/json"
                );

                response = await _httpClient.PostAsync($"{_baseUrl}/item/get", content);
                responseContent = await response.Content.ReadAsStringAsync();
                
                string? institutionId = null;
                if (response.IsSuccessStatusCode)
                {
                    result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                    if (result.TryGetProperty("item", out var item))
                    {
                        institutionId = item.GetProperty("institution_id").GetString();
                    }
                }

                return new LinkedAccountResult
                {
                    AccessToken = accessToken,
                    ItemId = itemId,
                    InstitutionId = institutionId,
                    Accounts = accounts
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"ExchangePublicToken error: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PlaidAccount>> GetAccountsAsync(string accessToken)
        {
            try
            {
                var requestBody = new
                {
                    client_id = _clientId,
                    secret = _secret,
                    access_token = accessToken
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync($"{_baseUrl}/accounts/get", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Get accounts error: {responseContent}");
                    throw new Exception("Failed to get accounts");
                }

                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var accountsArray = result.GetProperty("accounts");
                
                var accounts = new List<PlaidAccount>();
                foreach (var acc in accountsArray.EnumerateArray())
                {
                    decimal? balance = null;
                    if (acc.TryGetProperty("balances", out var balances))
                    {
                        if (balances.TryGetProperty("current", out var current))
                        {
                            balance = current.GetDecimal();
                        }
                    }

                    accounts.Add(new PlaidAccount
                    {
                        AccountId = acc.GetProperty("account_id").GetString() ?? "",
                        Name = acc.GetProperty("name").GetString(),
                        Type = acc.GetProperty("type").GetString(),
                        Subtype = acc.GetProperty("subtype").GetString(),
                        Mask = acc.TryGetProperty("mask", out var mask) ? mask.GetString() : null,
                        Balance = balance
                    });
                }

                return accounts;
            }
            catch (Exception ex)
            {
                _logger.LogError($"GetAccounts error: {ex.Message}");
                throw;
            }
        }

        public async Task<List<PlaidTransaction>> SyncTransactionsAsync(int userId, int linkedAccountId)
        {
            // Implementation will sync transactions from Plaid
            // This is a placeholder - full implementation would use /transactions/sync endpoint
            return new List<PlaidTransaction>();
        }
    }

    public class LinkedAccountResult
    {
        public string AccessToken { get; set; } = string.Empty;
        public string ItemId { get; set; } = string.Empty;
        public string? InstitutionId { get; set; }
        public List<PlaidAccount> Accounts { get; set; } = new();
    }

    public class PlaidAccount
    {
        public string AccountId { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Type { get; set; }
        public string? Subtype { get; set; }
        public string? Mask { get; set; }
        public decimal? Balance { get; set; }
    }

    public class PlaidTransaction
    {
        public string TransactionId { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string? Name { get; set; }
        public string? MerchantName { get; set; }
        public List<string> Category { get; set; } = new();
    }
}
