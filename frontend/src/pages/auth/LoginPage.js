import React,{ useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthLayout } from "../../layouts/AuthLayout";
import { LoginForm } from "./LoginForm";
import { UserRole } from "../../lib/constants";

export default function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated,isLoading,user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === UserRole.ADMIN) {
                navigate("/dashboard");
            } else {
                navigate("/warehouses");
            }
        }
    },[isAuthenticated,user,navigate]);

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500 font-medium">Đang tải...</p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
}
