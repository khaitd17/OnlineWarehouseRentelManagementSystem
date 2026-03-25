using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;
using WMS.Domain.Enums;
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
            // ── 1. Kiểm tra quyền của caller ──────────────────────────────────
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

            // MANAGER chỉ được tạo STAFF
            if (callerRole == "MANAGER" && targetRole != "STAFF")
                throw new UnauthorizedAccessException(
                    "Manager chỉ được phép tạo nhân viên có role STAFF.");

            // ── 2. Khi tạo MANAGER mới: kiểm tra overlap skill với các manager hiện tại ──
            if (targetRole == "MANAGER" && callerRole == "OPERATOR")
            {
                var existingManagers = await _membershipRepository.GetActiveManagersInWarehouseAsync(
                    request.WarehouseId, cancellationToken);

                foreach (var mgr in existingManagers)
                {
                    bool skillsOverlap = request.IsAllSkill
                        || mgr.IsAllSkill
                        || request.SkillIds.Intersect(mgr.SkillIds).Any();

                    if (skillsOverlap)
                        throw new InvalidOperationException(
                            $"Phạm vi skill bị trùng với manager '{mgr.FullName}'. " +
                            "Vui lòng chọn skill không trùng với manager hiện tại.");
                }
            }

            // ── 3. Kiểm tra scope của MANAGER khi gán skill cho STAFF ─────────
            if (callerRole == "MANAGER")
            {
                // MANAGER không được set isAllSkill vượt phạm vi của mình
                if (request.IsAllSkill && !callerMembership.IsAllSkill)
                    throw new UnauthorizedAccessException(
                        "Manager không được phép gán 'tất cả skill' khi bản thân không có isAllSkill.");

                // MANAGER không được set isAllSkill = true (chỉ OPERATOR)
                if (request.IsAllSkill)
                    throw new UnauthorizedAccessException(
                        "Manager không được phép gán toàn bộ skill. Chỉ Operator mới có quyền này.");

                // MANAGER chỉ được gán skill trong phạm vi của mình
                if (!callerMembership.IsAllSkill && request.SkillIds.Any())
                {
                    var invalidSkills = request.SkillIds.Except(callerMembership.SkillIds).ToList();
                    if (invalidSkills.Any())
                        throw new UnauthorizedAccessException(
                            $"Manager không có quyền gán skill có id: {string.Join(", ", invalidSkills)}.");
                }
            }

            // ── 4. Mặc định khi tạo MANAGER qua OPERATOR: isAllSkill = true nếu không chỉ định ──
            bool effectiveIsAllSkill = request.IsAllSkill;
            if (targetRole == "MANAGER" && callerRole == "OPERATOR"
                && !request.IsAllSkill && !request.SkillIds.Any())
            {
                effectiveIsAllSkill = true;
            }

            // ── 5. Tạo user nếu chưa có ──────────────────────────────────────
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

            // ── 6. Tạo membership ─────────────────────────────────────────────
            var membershipDto = new CreateMembershipDto
            {
                UserId           = staffUserId,
                WarehouseId      = request.WarehouseId,
                RoleCode         = targetRole,
                IsAllSkill       = effectiveIsAllSkill,
                SkillIds         = effectiveIsAllSkill ? new() : request.SkillIds,
                WarehouseShiftId = request.WarehouseShiftId,
            };

            await _membershipRepository.CreateMembershipAsync(membershipDto, cancellationToken);

            return staffUserId;
        }
    }
}
