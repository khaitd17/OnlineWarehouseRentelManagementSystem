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
            // Dùng HasRoleAsync để tránh bug priority (user có cả OWNER+OPERATOR → GetCallerMembership trả OWNER)
            bool callerIsOperator = await _membershipRepository.HasRoleAsync(
                request.CallerId, request.WarehouseId, "OPERATOR", cancellationToken);
            bool callerIsManager  = await _membershipRepository.HasRoleAsync(
                request.CallerId, request.WarehouseId, "MANAGER", cancellationToken);

            if (!callerIsOperator && !callerIsManager)
                throw new UnauthorizedAccessException(
                    "Chỉ OPERATOR hoặc MANAGER mới có quyền tạo nhân viên.");

            var callerRole = callerIsOperator ? "OPERATOR" : "MANAGER";

            // Lấy skill của MANAGER (nếu caller là MANAGER) để kiểm tra scope
            var callerMembership = callerIsManager
                ? await _membershipRepository.GetMembershipByRoleAsync(
                    request.CallerId, request.WarehouseId, "MANAGER", cancellationToken)
                : null;

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
                // MANAGER không được phép gán isAllSkill cho nhân viên (chỉ OPERATOR mới có quyền này)
                if (request.IsAllSkill)
                    throw new UnauthorizedAccessException(
                        "Manager không được phép gán toàn bộ skill. Chỉ Operator mới có quyền này.");

                // MANAGER chỉ được gán skill trong phạm vi của mình
                if (callerMembership != null && !callerMembership.IsAllSkill && request.SkillIds.Any())
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

                // Tạo reset-password token (hết hạn sau 7 ngày — đủ để nhân viên mới đăng nhập)
                string rawToken = Convert.ToBase64String(
                        System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
                    .Replace("+", "-").Replace("/", "_").Replace("=", "");

                // Gửi email kèm link reset password
                try
                {
                    await _userRepository.InvalidateOldTokensAsync(staffUserId, cancellationToken);
                    await _userRepository.SaveResetTokenAsync(
                        userId:    staffUserId,
                        rawToken:  rawToken,
                        expiresAt: DateTime.UtcNow.AddDays(7),
                        ct:        cancellationToken);

                    string resetLink = $"http://localhost:3000/reset-password?token={rawToken}";

                    var subject = "[OWRMS] Tài khoản nhân viên đã được tạo";
                    var htmlBody = $@"
<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;border-top:4px solid #4f46e5'>
  <h2 style='color:#1a1a2e'>Chào mừng, {request.FullName}!</h2>
  <p style='color:#374151'>Tài khoản nhân viên của bạn trên hệ thống <strong>OWRMS</strong> đã được tạo thành công.</p>
  <div style='background:#f5f3ff;padding:16px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #4f46e5'>
    <p style='margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.04em'>Thông tin đăng nhập</p>
    <p style='margin:0 0 4px'><strong>Email:</strong> {request.Email}</p>
    <p style='margin:0 0 4px'><strong>Mật khẩu tạm:</strong> <span style='font-family:monospace;font-size:16px;color:#4f46e5'>{rawPassword}</span></p>
  </div>
  <div style='background:#fefce8;padding:16px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #eab308'>
    <p style='margin:0 0 8px;font-weight:700;color:#92400e'>⚠️ Đặt lại mật khẩu ngay</p>
    <p style='margin:0 0 12px;color:#78350f;font-size:14px'>Vui lòng click vào nút bên dưới để đặt mật khẩu mới của bạn. Link có hiệu lực trong <strong>7 ngày</strong>.</p>
    <a href='{resetLink}' style='display:inline-block;padding:10px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px'>🔑 Đặt lại mật khẩu</a>
  </div>
  <p style='color:#6b7280;font-size:13px'>Hoặc copy link: <span style='color:#4f46e5;word-break:break-all'>{resetLink}</span></p>
  <hr style='border:none;border-top:1px solid #f1f5f9;margin:20px 0'>
  <p style='color:#94a3b8;font-size:12px'>© 2024 Online Warehouse Rental Management System (OWRMS)</p>
</div>";
                    await _emailService.SendInfo(request.Email, request.FullName, subject, htmlBody);
                }
                catch
                {
                    // Email / token thất bại: không block tạo nhân viên
                }
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
