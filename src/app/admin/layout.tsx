
"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAdmin, loading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/dashboard");
        }
    }, [isAdmin, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading admin panel...</p>
            </div>
        );
    }
    
    if (!isAdmin) {
        return null;
    }

    return <>{children}</>;
}
