using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ControlsTest.Data.Migrations
{
    public partial class business5 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "ProductsWithMaintenance",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ProductsWithMaintenance_ProductId",
                table: "ProductsWithMaintenance",
                column: "ProductId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductsWithMaintenance_Products_ProductId",
                table: "ProductsWithMaintenance",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductsWithMaintenance_Products_ProductId",
                table: "ProductsWithMaintenance");

            migrationBuilder.DropIndex(
                name: "IX_ProductsWithMaintenance_ProductId",
                table: "ProductsWithMaintenance");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "ProductsWithMaintenance");

            migrationBuilder.AddColumn<int>(
                name: "MaintenanceId",
                table: "Products",
                nullable: true);

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
    }
}
