import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log In | BMAD Meal Planner",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Log in to your account</p>
        </div>
        <LoginForm />
        <div className="text-center text-sm space-y-2">
          <p>
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
          <p>
            <a href="/reset-password" className="text-blue-600 hover:underline">
              Forgot your password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
