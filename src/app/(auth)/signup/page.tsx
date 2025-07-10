import SignUpForm from "@/components/auth/SignUpForm";

export const metadata = {
  title: "Sign Up | BMAD Meal Planner",
};

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-gray-600 mt-2">Sign up to start planning your meals</p>
        </div>
        <SignUpForm />
        <div className="text-center text-sm">
          <p>
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
