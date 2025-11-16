using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCampusWallet.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletToLinkedAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WalletId",
                table: "LinkedAccounts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LinkedAccounts_WalletId",
                table: "LinkedAccounts",
                column: "WalletId");

            migrationBuilder.AddForeignKey(
                name: "FK_LinkedAccounts_Wallets_WalletId",
                table: "LinkedAccounts",
                column: "WalletId",
                principalTable: "Wallets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LinkedAccounts_Wallets_WalletId",
                table: "LinkedAccounts");

            migrationBuilder.DropIndex(
                name: "IX_LinkedAccounts_WalletId",
                table: "LinkedAccounts");

            migrationBuilder.DropColumn(
                name: "WalletId",
                table: "LinkedAccounts");
        }
    }
}
