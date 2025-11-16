using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCampusWallet.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTransactionSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOnCampus",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "Timestamp",
                table: "Transactions",
                newName: "Date");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Transactions",
                newName: "PaymentMethod");

            migrationBuilder.RenameColumn(
                name: "Currency",
                table: "Transactions",
                newName: "Merchant");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Transactions",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Transactions",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Location",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "PaymentMethod",
                table: "Transactions",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Merchant",
                table: "Transactions",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "Transactions",
                newName: "Timestamp");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Transactions",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn)
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsOnCampus",
                table: "Transactions",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }
    }
}
