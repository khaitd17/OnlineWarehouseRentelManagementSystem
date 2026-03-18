using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.Application.Features.Staff.CreateStaff
{
    public class CreateStaffHandler : IRequestHandler<CreateStaffCommand, int>
    {
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IStaffMembershipRepository _membershipRepository;
        private readonly IPasswordGenerator _passwordGenerator;

        public CreateStaffHandler(
            IEmailService emailService,
            IUserRepository userRepository,
            IStaffMembershipRepository membershipRepository,
            IPasswordGenerator passwordGenerator)
        {
            _emailService = emailService;
            _userRepository = userRepository;
            _membershipRepository = membershipRepository;
            _passwordGenerator = passwordGenerator;
        }

        public async Task<int> Handle(CreateStaffCommand request, CancellationToken cancellationToken)
        {
            var callerMembership = await _membershipRepository.GetCallerMembershipAsync(
                request.CallerId, request.WarehouseId, cancellationToken);

            if (callerMembership == null)
                throw new UnauthorizedAccessException(
                    "Bạn không có quyền truy cập vào kho này hoặc membership không hợp lệ.");

            var callerRole = callerMembership.RoleCode;

            if (callerRole != "OPERATOR" && callerRole != "MANAGER")
                throw new UnauthorizedAccessException(
                    $"Role '{callerRole}' không có quyền tạo nhân viên.");

            var targetRole = request.TargetRoleCode.ToUpper();
            if (callerRole == "MANAGER" && targetRole != "STAFF")
                throw new UnauthorizedAccessException(
                    "Manager chỉ được phép tạo nhân viên có role STAFF.");

            if (targetRole == "MANAGER")
            {
                var existingManagers = await _membershipRepository.GetActiveManagersInWarehouseAsync(
                    request.WarehouseId, cancellationToken);

                foreach (var mgr in existingManagers)
                {
                    bool skillsOverlap = request.IsAllSkill
                        || mgr.IsAllSkill
                        || request.SkillIds.Intersect(mgr.SkillIds).Any();

                    bool zonesOverlap = request.IsAllZone
                        || mgr.IsAllZone
                        || request.ZoneIds.Intersect(mgr.ZoneIds).Any();

                    if (skillsOverlap && zonesOverlap)
                        throw new InvalidOperationException(
                            $"Phạm vi quản lý bị trùng với manager '{mgr.FullName}'. " +
                            "Vui lòng chọn skill hoặc zone không trùng với manager hiện tại.");
                }
            }

            if (callerRole == "MANAGER")
            {
                if (!callerMembership.IsAllSkill && request.SkillIds.Any())
                {
                    var invalidSkills = request.SkillIds.Except(callerMembership.SkillIds).ToList();
                    if (invalidSkills.Any())
                        throw new UnauthorizedAccessException(
                            $"Manager không có quyền gán skill có id: {string.Join(", ", invalidSkills)}.");
                }

                if (!callerMembership.IsAllZone && request.ZoneIds.Any())
                {
                    var invalidZones = request.ZoneIds.Except(callerMembership.ZoneIds).ToList();
                    if (invalidZones.Any())
                        throw new UnauthorizedAccessException(
                            $"Manager không có quyền gán zone có id: {string.Join(", ", invalidZones)}.");
                }

                if (request.IsAllSkill || request.IsAllZone)
                    throw new UnauthorizedAccessException(
                        "Manager không được phép gán toàn bộ skill/zone. Chỉ Operator mới có quyền này.");
            }

            var existingUserId = await _userRepository.IsExistEmail(request.Email, cancellationToken);
            int staffUserId;

            if (existingUserId == null)
            {
                var rawPassword = _passwordGenerator.Generate();
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);

                var dto = new CreateUserDto(
                    FullName: request.FullName,
                    Email: request.Email,
                    PasswordHash: passwordHash,
                    Phone: request.Phone,
                    RoleName: "USER"
                );

                staffUserId = await _userRepository.CreateAsync(dto, cancellationToken);
            }
            else
            {
                staffUserId = existingUserId.Value;
            }

            var membershipDto = new CreateMembershipDto
            {
                UserId           = staffUserId,
                WarehouseId      = request.WarehouseId,
                RoleCode         = targetRole,
                IsAllSkill       = request.IsAllSkill,
                IsAllZone        = request.IsAllZone,
                SkillIds         = request.SkillIds,
                ZoneIds          = request.ZoneIds,
                WarehouseShiftId = request.WarehouseShiftId,  // null = ca xoay
            };

            await _membershipRepository.CreateMembershipAsync(membershipDto, cancellationToken);

            return staffUserId;
        }
    }
}

