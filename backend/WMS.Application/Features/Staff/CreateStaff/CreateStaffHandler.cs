using MediatR;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.CreateStaff
{
    public class CreateStaffHandler : IRequestHandler<CreateStaffCommand,int>
    {
        //private readonly IPasswordHasher _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly IUserRepository _userRepository;
        private readonly IStaffAssigmentRepository _staffAssigmentRepository;
        private readonly IPasswordGenerator _passwordGenerator;
        //private readonly IDateTimeProvider _dateTime;

        public CreateStaffHandler(
            
            IEmailService emailService,
            IWarehouseRepository warehouseRepository,
            IUserRepository userRepository,
            IStaffAssigmentRepository staffAssigmentRepository,
            IPasswordGenerator passwordGenerator

            )
        {
            
            _emailService = emailService;
            _warehouseRepository = warehouseRepository;
            _userRepository = userRepository;
            _staffAssigmentRepository = staffAssigmentRepository;
            _passwordGenerator = passwordGenerator;
        }

        public async Task<int> Handle(
            CreateStaffCommand request,
            CancellationToken cancellationToken)
        {
            // Check warehouse exists
            var warehouseOwnerId = await _warehouseRepository.FindWarehouseOwnerById(request.WarehouseId, cancellationToken);

            if (warehouseOwnerId == null)
                throw new Exception($"Warehouse with id {request.WarehouseId} not found");

            // Check current user has permission
            var currentUser = await _userRepository.GetByIdAsync(request.OwnerId, cancellationToken);

            if (currentUser == null)
                throw new Exception($"User with id {request.OwnerId} not found");

            if (currentUser.UserId != warehouseOwnerId)
                throw new Exception($"User {request.OwnerId} is not the owner of warehouse {request.WarehouseId}. Warehouse owner id: {warehouseOwnerId}");

            // Check if email already exists
            var existingUserId = await _userRepository.IsExistEmail(request.Email, cancellationToken);

            int staffUserId;

            if (existingUserId == null)
            {
                // Email doesn't exist - create new user
                var rawPassword = _passwordGenerator.Generate();
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);

                var dto = new CreateUserDto(
                    FullName: request.FullName,
                    Email: request.Email,
                    PasswordHash: passwordHash,
                    Phone: request.Phone,
                    RoleId: 4  
                );

                staffUserId = await _userRepository.CreateAsync(dto, cancellationToken);

                // Send email with login credentials
                await _emailService.SendInfo(
                    request.Email,
                    request.FullName,
                    "Thong tin tai khoan dang nhap",
                    $"email: {request.Email}, matkhau: {rawPassword}"
                );
            }
            else
            {
                // Email already exists - use existing user
                staffUserId = existingUserId.Value;
            }

            // Create assignment
            var assignment = new StaffAssignment(
                staffId: staffUserId,
                warehouseId: request.WarehouseId,
                status: "ACTIVE",
                assignedAt: request.StartDate != null
                    ? request.StartDate.Value.ToDateTime(TimeOnly.MinValue)
                    : DateTime.Now,
                endDate: request.EndDate,
                notes: request.Notes
            );

            await _staffAssigmentRepository.AddAsync(assignment, cancellationToken);

            return staffUserId;
        }
    }
}
