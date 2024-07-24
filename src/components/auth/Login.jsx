import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/images/logo.png'
export default function Signin() {
    const [error, setError] = useState(false);
    const [succes, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);


    const [fullName, setFullName] = useState('ho');
    const [email, setEmail] = useState('s@gmail.com');
    const [password, setPassword] = useState('123');
    const [confirmPassword, setConfirmPassword] = useState('123');
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };
    async function handleRegister(e) {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log('step1')
        try {
            console.log('step1', email, password)
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('log user', data, error)

            if (error) throw error;

            // After successful sign-up, store the fullName



        } catch (err) {
            console.log(err.message || err.error_description);
            if (err.status === 429) {
                alert('Too many requests. Please try again later.');
            } else {
                alert('Registration failed. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="bg-blue-600/100 lg:h-[30vh] h-[12rem]">

            <div className="flex  w-full flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">

                <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    <img className="w-8 h-8 mr-2" src={logo} alt="logo" />
                    BUDGET
                </div>

                <div className="w-full  md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-6 bg-white mb-[3rem] space-y-4 md:space-y-6 sm:p-8 rounded-lg shadow border  border-gray-200">
                        <h1 className="text-xl text-start font-bold leading-tight tracking-tight  md:text-2xl">
                            Sign In
                        </h1>
                        <p className='text-sm text-gray-400'>Enter your detail for Sign in.</p>
                        <Form
                            onFinish={handleRegister}
                            onFinishFailed={onFinishFailed}
                            layout="vertical"
                            className="row-col"
                        >

                            <Form.Item
                                className=" text-white"
                                label={<span className=" text-gray-400">Email</span>}
                                name="email"

                                rules={[
                                    {
                                        required: true,
                                        message: " ",
                                    },
                                ]}
                            >
                                <Input id="email" placeholder="Email"
                                    className="w-full p-2.5"
                                />
                            </Form.Item>



                            <Form.Item
                                className="username"
                                label={<span className=" text-gray-400">Password</span>}
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: " ",

                                    },
                                ]}
                            >
                                <Input.Password placeholder="Password"
                                    className="w-full p-2.5"
                                />
                            </Form.Item>


                            <p className="text-sm font-sm  text-gray-400 mb-4 ">
                                For got password ?{" "}
                                <Link to="#" className="font-medium text-blue-500">
                                    Reset password
                                </Link>
                            </p>


                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"

                                    className="w-full p-5 font-medium"
                                >
                                    Sign In
                                </Button>
                            </Form.Item>
                            <p className="text-sm font-sm  text-gray-400">
                                already have an account?{" "}
                                <Link to="/" className="font-medium text-blue-500">
                                    Sign In
                                </Link>
                            </p>
                        </Form>
                    </div>
                </div>
            </div>
        </section>
    );
}
