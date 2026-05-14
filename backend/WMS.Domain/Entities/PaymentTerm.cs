using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WMS.Domain.Entities;

public class PaymentTerm
{
    [Key]
    public int TermId { get; set; }
    
    [Required]
    public int ContractId { get; set; }
    
    [Required]
    public int MonthsPerTerm { get; set; }
    
    [Required]
    public int AllowedOverdueDays { get; set; }
    
    [ForeignKey("ContractId")]
    public RentalContract? Contract { get; set; }
}
