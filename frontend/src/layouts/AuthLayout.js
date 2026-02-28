import React from 'react';
import { Box } from 'lucide-react';

export const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-white/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-light/20 rounded-full blur-[120px] animate-pulse" />

            <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
                <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white/20">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 mb-4 scale-110">
                            <Box className="text-white h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">OWRMS</h1>
                        <p className="text-gray-500 font-medium mt-1">Warehouse Rental System</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};
