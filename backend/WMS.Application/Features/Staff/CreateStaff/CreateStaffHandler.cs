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

                // Gửi email mật khẩu tạm — bọc try/catch để lỗi email không block luồng chính
                try
                {
                    var subject = "[OWRMS] Tài khoản nhân viên đã được tạo";
                    var htmlBody = $@"
<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;border-top:4px solid #4f46e5'>
  <h2 style='color:#1a1a2e'>Chào mừng, {request.FullName}!</h2>
  <p style='color:#374151'>Tài khoản nhân viên của bạn trên hệ thống <strong>OWRMS</strong> đã được tạo thành công.</p>
  <div style='background:#f5f3ff;padding:16px 20px;border-radius:8px;margin:20px 0;border-left:4px solid #4f46e5'>
    <p style='margin:0 0 8px;color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.04em'>Thông tin đăng nhập</p>
    <p style='margin:0 0 4px'><strong>Email:</strong> {request.Email}</p>
    <p style='margin:0'><strong>Mật khẩu tạm:</strong> <span style='font-family:monospace;font-size:16px;color:#4f46e5'>{rawPassword}</span></p>
  </div>
  <p style='color:#ef4444;font-size:13px'>⚠️ Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
  <hr style='border:none;border-top:1px solid #f1f5f9;margin:20px 0'>
  <p style='color:#94a3b8;font-size:12px'>© 2024 Online Warehouse Rental Management System (OWRMS)</p>
</div>";
                    await _emailService.SendInfo(request.Email, request.FullName, subject, htmlBody);
                }
                catch
                {
                    // Email gửi thất bại: không block tạo nhân viên, ghi log nếu cần
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
