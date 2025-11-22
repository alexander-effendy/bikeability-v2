import { LoginForm } from "@/components/login-form";
import AboutLoginButton from "@/features/magic/AboutLoginButton";

const Login = () => {
  return (
    <div className="relative grid place-items-center h-full w-full">
      <LoginForm />
      <AboutLoginButton />
    </div>
  )
}
export default Login;