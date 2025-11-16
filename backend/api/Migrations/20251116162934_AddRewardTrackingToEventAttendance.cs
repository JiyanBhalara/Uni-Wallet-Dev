using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartCampusWallet.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardTrackingToEventAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CheckInRewardAwarded",
                table: "EventAttendances",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PaidEventBonusAwarded",
                table: "EventAttendances",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RsvpRewardAwarded",
                table: "EventAttendances",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckInRewardAwarded",
                table: "EventAttendances");

            migrationBuilder.DropColumn(
                name: "PaidEventBonusAwarded",
                table: "EventAttendances");

            migrationBuilder.DropColumn(
                name: "RsvpRewardAwarded",
                table: "EventAttendances");
        }
    }
}
