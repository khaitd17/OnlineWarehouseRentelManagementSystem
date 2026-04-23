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
                bool callerHasAllSkill = callerMembership?.IsAllSkill == true;

                // MANAGER chỉ được gán isAllSkill=true nếu bản thân có isAllSkill=true
                // (phạm vi của mình bao gồm toàn bộ skill thì mới được cấp toàn bộ cho nhân viên)
                if (request.IsAllSkill && !callerHasAllSkill)
                    throw new UnauthorizedAccessException(
                        "Manager không được cấp quyền 'tất cả skill' khi phạm vi của bạn chỉ giới hạn một số skill nhất định.");

                // MANAGER chỉ được gán skill trong phạm vi của mình
                // (nếu bản thân có isAllSkill=true → không giới hạn skillId nào)
                if (!callerHasAllSkill && request.SkillIds.Any())
                {
                    var managerSkillIds = callerMembership?.SkillIds ?? new List<int>();
                    var invalidSkills   = request.SkillIds.Except(managerSkillIds).ToList();
                    if (invalidSkills.Any())
                        throw new UnauthorizedAccessException(
                            $"Bạn đang gán skill nằm ngoài phạm vi quản lý của mình: id {string.Join(", ", invalidSkills)}.");
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

                // Gửi email thông tin đăng nhập + link login
                try
                {
                    string loginLink = "http://localhost:3000/login";

                    var subject  = "[OWRMS] Tài khoản nhân viên của bạn đã được tạo";
                    var htmlBody = $@"Xin chào {request.FullName},

Tài khoản nhân viên của bạn trên hệ thống OWRMS đã được tạo.

Thông tin đăng nhập:
- Email: {request.Email}
- Mật khẩu tạm: {rawPassword}

Truy cập hệ thống tại: {loginLink}

Lưu ý: Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để bảo mật tài khoản.

---
Hệ thống OWRMS";
                    await _emailService.SendInfo(request.Email, request.FullName, subject, htmlBody);
                }
                catch
                {
                    // Email thất bại: không block tạo nhân viên
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
