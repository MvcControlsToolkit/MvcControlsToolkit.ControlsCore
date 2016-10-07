using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Metadata;

namespace ControlsTest.Data.Migrations
{
    public partial class business4 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductsWithMaintenance_Products_Id",
                table: "ProductsWithMaintenance");

            migrationBuilder.DropIndex(
                name: "IX_ProductsWithMaintenance_Id",
                table: "ProductsWithMaintenance");

            migrationBuilder.AddColumn<int>(
                name: "MaintenanceId",
                table: "Products",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "ProductsWithMaintenance",
                nullable: false)
                .Annotation("SqlServer:ValueGenerationStrategy", SqlServerValueGenerationStrategy.IdentityColumn);

            migrationBuilder.CreateIndex(
                name: "IX_Products_MaintenanceId",
                table: "Products",
                column: "MaintenanceId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Products_ProductsWithMaintenance_MaintenanceId",
                table: "Products",
                column: "MaintenanceId",
                principalTable: "ProductsWithMaintenance",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_ProductsWithMaintenance_MaintenanceId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_MaintenanceId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MaintenanceId",
                table: "Products");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "ProductsWithMaintenance",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_ProductsWithMaintenance_Id",
                table: "ProductsWithMaintenance",
                column: "Id",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductsWithMaintenance_Products_Id",
                table: "ProductsWithMaintenance",
                column: "Id",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
