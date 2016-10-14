using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ControlsTest.Models;

namespace ControlsTest.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }

        public DbSet<ProductWithMaintenance> ProductsWithMaintenance { get; set; }
        
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            // Customize the ASP.NET Identity model and override the defaults if needed.
            // For example, you can rename the ASP.NET Identity table names and more.
            // Add your customizations after calling base.OnModelCreating(builder);
            builder.Entity<ProductWithMaintenance>()
                .Property(m => m.Id)
                .ValueGeneratedOnAdd();
            builder.Entity<Product>()
                .HasOne(m => m.Type)
                .WithMany(m => m.Products)
                .HasForeignKey(m => m.TypeId)
                .OnDelete(Microsoft.EntityFrameworkCore.Metadata.DeleteBehavior.SetNull);
            builder.Entity<Product>()
                .HasOne(m => m.Maintenance)
                .WithOne(m => m.Base)
                .HasForeignKey<ProductWithMaintenance>(m => m.ProductId)
                .OnDelete(Microsoft.EntityFrameworkCore.Metadata.DeleteBehavior.Cascade);
                
        }
    }
}
