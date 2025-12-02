import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  CheckCircle2,
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [forceSubscription, setForceSubscription] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const companyLoginMutation = useMutation({
    mutationFn: async () => {
      await login(email, password);
    },
    onSuccess: () => {
      toast.success("Login successful");
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

      if (userData.subscription_modal_force) {
        setForceSubscription(true);
        setShowSubscriptionModal(true);
        return;
      }

      handleNavigationAfterLogin(userData);
    },
    onError: (err: any) => {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
      toast.error("Login failed");
    },
  });

  const handleNavigationAfterLogin = (userData: any) => {
    if (from) {
      navigate(from);
    } else {
      switch (userData.role) {
        case "master_admin":
          navigate("/master/dashboard");
          break;
        case "company_super_admin":
        case "company_admin":
          navigate("/company/dashboard");
          break;
        default:
          navigate("/");
      }
    }
  };

  const handleSubscriptionComplete = () => {
    setShowSubscriptionModal(false);
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    handleNavigationAfterLogin(userData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      toast.error("Please enter both email and password");
      return;
    }

    companyLoginMutation.mutate();
  };

  const features = [
    { icon: LayoutDashboard, text: "Intuitive Dashboard" },
    { icon: FolderKanban, text: "Project Tracking" },
    { icon: Users, text: "Team Collaboration" },
    { icon: BarChart3, text: "Analytics & Reports" },
  ];

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left Side - Image/Brand Section */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
            <div className="mb-12">
              <h1 className="text-5xl font-bold mb-4">Project Hub</h1>
              <p className="text-xl text-blue-100">
                Streamline your workflow, boost productivity
              </p>
            </div>

            <div className="space-y-6 mb-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-lg font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-blue-100">
                  Manage projects efficiently with real-time collaboration
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-blue-100">
                  Track progress and meet deadlines with ease
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-blue-100">
                  Powerful analytics to drive better decisions
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Project Hub
              </h1>
              <p className="text-gray-600">Project Management System</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h2>
                <p className="text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={companyLoginMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {companyLoginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <Link to="/" className="text-primary hover:underline text-sm ">
                  <Button

                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 mt-5"
                  >
                    ← Back to home
                  </Button>

                </Link>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600 mt-8">
              © 2024 Project Hub. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={
            forceSubscription
              ? undefined
              : () => setShowSubscriptionModal(false)
          }
          mode="new"
          canClose={!forceSubscription}
          refetchSubscription={handleSubscriptionComplete}
          fullScreen={forceSubscription}
        />
      )}
    </>
  );
};

export default Login;
