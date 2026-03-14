using MediatR;
using WMS.Application.Interfaces;
using WMS.Domain.Entities;

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
            // ─── 1. Lấy membership của caller (người đang thao tác) ────────────────
            var callerMembership = await _membershipRepository.GetCallerMembershipAsync(
                request.CallerId, request.WarehouseId, cancellationToken);

            if (callerMembership == null)
                throw new UnauthorizedAccessException(
                    "Bạn không có quyền truy cập vào kho này hoặc membership không hợp lệ.");

            var callerRole = callerMembership.RoleCode; // OPERATOR | MANAGER | STAFF | OWNER

            // ─── 2. Kiểm tra quyền tạo nhân viên ──────────────────────────────────
            // Chỉ OPERATOR và MANAGER mới được tạo
            if (callerRole != "OPERATOR" && callerRole != "MANAGER")
                throw new UnauthorizedAccessException(
                    $"Role '{callerRole}' không có quyền tạo nhân viên.");

            // MANAGER chỉ được tạo STAFF
            var targetRole = request.TargetRoleCode.ToUpper();
            if (callerRole == "MANAGER" && targetRole != "STAFF")
                throw new UnauthorizedAccessException(
                    "Manager chỉ được phép tạo nhân viên có role STAFF.");

            // ─── 3. Kiểm tra vượt quyền về skill và zone (chỉ với MANAGER) ─────────
            if (callerRole == "MANAGER")
            {
                // Nếu MANAGER không có IsAllSkill → kiểm tra skill subset
                if (!callerMembership.IsAllSkill && request.SkillIds.Any())
                {
                    var invalidSkills = request.SkillIds.Except(callerMembership.SkillIds).ToList();
                    if (invalidSkills.Any())
                        throw new UnauthorizedAccessException(
                            $"Manager không có quyền gán skill có id: {string.Join(", ", invalidSkills)}.");
                }

                // Nếu MANAGER không có IsAllZone → kiểm tra zone subset
                if (!callerMembership.IsAllZone && request.ZoneIds.Any())
                {
                    var invalidZones = request.ZoneIds.Except(callerMembership.ZoneIds).ToList();
                    if (invalidZones.Any())
                        throw new UnauthorizedAccessException(
                            $"Manager không có quyền gán zone có id: {string.Join(", ", invalidZones)}.");
                }

                // MANAGER không được set IsAllSkill/IsAllZone
                if (request.IsAllSkill || request.IsAllZone)
                    throw new UnauthorizedAccessException(
                        "Manager không được phép gán toàn bộ skill/zone. Chỉ Operator mới có quyền này.");
            }

            // ─── 4. Tạo / lấy user theo email ─────────────────────────────────────
            var existingUserId = await _userRepository.IsExistEmail(request.Email, cancellationToken);
            int staffUserId;

            if (existingUserId == null)
            {
                // Email chưa tồn tại → tạo user mới
                var rawPassword = _passwordGenerator.Generate();
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword);

                var dto = new CreateUserDto(
                    FullName: request.FullName,
                    Email: request.Email,
                    PasswordHash: passwordHash,
                    Phone: request.Phone,
                    RoleName: "USER"   // role hệ thống luôn là USER
                );

                staffUserId = await _userRepository.CreateAsync(dto, cancellationToken);

                // Gửi email thông tin đăng nhập
                await _emailService.SendInfo(
                    request.Email,
                    request.FullName,
                    "Thông tin tài khoản đăng nhập",
                    $"Email: {request.Email}, Mật khẩu: {rawPassword}"
                );
            }
            else
            {
                staffUserId = existingUserId.Value;
            }

            // ─── 5. Tạo WarehouseMembership ──────────────────────────────────────
            var membershipDto = new CreateMembershipDto
            {
                UserId      = staffUserId,
                WarehouseId = request.WarehouseId,
                RoleCode    = targetRole,
                IsAllSkill  = request.IsAllSkill,
                IsAllZone   = request.IsAllZone,
                SkillIds    = request.SkillIds,
                ZoneIds     = request.ZoneIds,
            };

            await _membershipRepository.CreateMembershipAsync(membershipDto, cancellationToken);

            return staffUserId;
        }
    }
}
