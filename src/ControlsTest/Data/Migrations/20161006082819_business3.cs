using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ControlsTest.Data.Migrations
{
    public partial class business3 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProductsWithMaintenance",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false),
                    YearlyRate = table.Column<decimal>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductsWithMaintenance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductsWithMaintenance_Products_Id",
                        column: x => x.Id,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductsWithMaintenance_Id",
                table: "ProductsWithMaintenance",
                column: "Id",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductsWithMaintenance");
        }
    }
}
