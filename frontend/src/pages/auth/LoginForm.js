import React,{ useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import AuthService from "../../services/AuthService";
import { AlertCircle,Lock,Mail } from "lucide-react";
import { toast } from "sonner";

export const LoginForm = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await AuthService.login(email,password);

            if (response.success && response.data) {
                const loginData = response.data;
                const userData = {
                    fullName: loginData.fullName,
                    email: loginData.email,
                    role: loginData.role,
                };

                setUser(userData,loginData.token);
                toast.success("Đăng nhập thành công!");

                if (userData.role === "ADMIN") {
                    navigate("/dashboard");
                } else {
                    navigate("/warehouses");
                }
            } else {
                setError(response.message || "Đăng nhập thất bại.");
            }
        } catch (err) {
            setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="admin@owrms.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10"
                    />
                </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold" isLoading={isLoading}>
                Đăng nhập
            </Button>

            <div className="text-center pt-2">
                <p className="text-sm text-gray-400">
                    Quên mật khẩu? <button type="button" className="text-primary font-bold hover:underline">Liên hệ Admin</button>
                </p>
            </div>
        </form>
    );
};
