import { LoginForm } from "@/components/login-form";
import AboutModal from "@/features/dialog/AboutDialog";
import AboutLoginButton from "@/features/magic/AboutLoginButton";

const Login = () => {
  return (
    <div className="relative grid place-items-center h-full w-full">
      <LoginForm />
      <AboutLoginButton />
      <AboutModal />
    </div>
  )
}
export default Login;