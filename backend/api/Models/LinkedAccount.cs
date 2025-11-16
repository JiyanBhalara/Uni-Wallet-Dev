using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartCampusWallet.Api.Models
{
    public class LinkedAccount
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [MaxLength(500)]
        public string AccessToken { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string ItemId { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? InstitutionId { get; set; }

        [MaxLength(255)]
        public string? InstitutionName { get; set; }

        [Required]
        [MaxLength(255)]
        public string AccountId { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? AccountName { get; set; }

        [MaxLength(50)]
        public string? AccountType { get; set; } // checking, savings, credit

        [MaxLength(10)]
        public string? AccountMask { get; set; } // Last 4 digits

        public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastSyncedAt { get; set; }

        public bool IsActive { get; set; } = true;

        // Wallet reference
        public int? WalletId { get; set; }

        [ForeignKey("WalletId")]
        public Wallet? Wallet { get; set; }
    }
}
