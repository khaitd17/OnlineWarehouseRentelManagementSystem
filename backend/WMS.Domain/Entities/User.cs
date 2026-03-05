using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WMS.Domain.Enums;

namespace WMS.Domain.Entities
{
    public class User
    {
        
            public int UserId { get; private set; }

            public int RoleId { get; private set; }

            public string FullName { get; private set; }

            public string Email { get; private set; }

            public string PasswordHash { get; private set; }

            public string? Phone { get; private set; }

            public string? AvatarUrl { get; private set; }

            public UserStatus Status { get; private set; }

            public DateTime CreatedAt { get; private set; }

            public DateTime? UpdatedAt { get; private set; }

            public DateTime? LastLoginAt { get; private set; }

            private User() { }

            public User(int roleId, string fullName, string email, string passwordHash)
            {
                RoleId = roleId;
                FullName = fullName;
                Email = email;
                PasswordHash = passwordHash;
                Status = UserStatus.Active;
                CreatedAt = DateTime.UtcNow;
            }
        public User(int roleId, string fullName, string email, string passwordHash,string phone)
        {
            RoleId = roleId;
            FullName = fullName;
            Email = email;
            PasswordHash = passwordHash;
            Status = UserStatus.Active;
            CreatedAt = DateTime.UtcNow;
            Phone = phone;
        }

        public void Suspend()
            {
                if (Status == UserStatus.Deleted)
                    throw new InvalidOperationException("Deleted user cannot be suspended.");

                Status = UserStatus.Suspended;
                UpdatedAt = DateTime.UtcNow;
            }

            public void Activate()
            {
                Status = UserStatus.Active;
                UpdatedAt = DateTime.UtcNow;
            }
        }
}
