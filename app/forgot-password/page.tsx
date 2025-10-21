"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Key } from "lucide-react";
import { forgetPassword } from "@/lib/auth-client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);


    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setLoading(true);
        
        const { data, error } = await forgetPassword({
            email: email,
            redirectTo: "/reset-password",
        });

        if (error) {
            toast.error("Something went wrong");
        }
        if (data) {
            console.log(data?.status);
            router.push("/login");

            toast.success("Please check your email for reset link");
        }
        
        setLoading(false);
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">

            <Card className="max-w-lg w-full mx-4">
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">
                        <Key className="inline mr-2 mb-1" /> Forgot Password
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                        Enter your email to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                value={email}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            onClick={handleSubmit}
                        
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <p> Reset Password </p>
                            )}
                        </Button>



                    </div>
                </CardContent>

            </Card>
        </div>
    );
}