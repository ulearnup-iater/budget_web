import React, { useState, useEffect } from 'react';
import Headers from '../Layout/Header';
import { Link } from 'react-router-dom';
import Popup from '../popup/Popup';
import { Button, Form, Input, Upload, notification } from 'antd';
import { LeftCircleTwoTone, UploadOutlined } from '@ant-design/icons';

import logo from '../../assets/images/logo.png';
import { supabase } from '../../services/supabaseClient'; // Ensure you have the correct path
const UpdateProfile = () => {
    const [success, setSuccess] = useState(false);
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState(logo); // Initial image URL
    const [imageName, setImageName] = useState('');
    const [users, setUsers] = useState([]);


    // Handle popup close
    const handlePopupClose = () => {
        setSuccess(false);
    };

    // Trigger popup
    const triggerPopup = () => {
        setSuccess(true);
    };

    // Handle image change
    const handleImageChange = async (info) => {
        console.log({ info: info.file.type })
        const formatImageType = info.file.type.split('/')[1];
        // const reader = new FileReader();


        const { data: uploadSingedUrl, error: uploadError } = await supabase
            .storage
            .from('budget_note_file')
            // .createSignedUploadUrl('folder/cat.jpg');
            .getPublicUrl('folder/cat.jpg');

        // .createSignedUploadUrl(`avatar/${info.file.uid}.${formatImageType}`);
        console.log({ uploadSingedUrl })
        if (uploadSingedUrl) {
            console.log({ uploadSingedUrl })
            // setImageUrl(reader.result);
            // setImageName(info.file.uid);
        }

        // reader.readAsDataURL(file);
    };

    // Load initial user data

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const userId = session.user.id;

                try {
                    // const { data, error } = await supabase.auth.users.listUsers();
                    const { data, error } = await supabase
                        .from('user_profile')
                        .select('*')
                        .eq('user_id', userId)
                        .single();

                    if (error) {
                        console.error(error);
                    } else {
                        setUsers(data);
                        console.log({ data: data })
                        form.setFieldsValue({
                            full_name: data.full_name,
                            phone: data.phone,
                            email: session.user.email, // Email is managed by Supabase Auth
                        });
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }
        };

        fetchUserData();
    }, [form]);

    // Handle form submission
    const handleSubmit = async (values) => {
        const { image, full_name, phone } = values;
        console.log('valua', values)
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            console.log('step1')
            try {
                const { data, error } = await supabase
                    .from('user_profile')
                    .update({ full_name, phone, image })
                    .eq('user_id', user.id)
                    .select();
                console.log(data, 'daata is')
                if (error) {
                    throw error;
                }

                notification.success({ message: 'Profile updated successfully!' });
            } catch (err) {
                console.error('Error updating profile:', err.message || err.error_description);
                notification.error({ message: 'Profile update failed. Please try again later.' });
            }
        } else {
            notification.error({ message: 'User not authenticated.' });
        }
    };


    return (
        <div>
            <Headers />
            <div>
                <div className="w-full mx-auto sm:max-w-[70rem] md:mt-0 xl:p-0">
                    <div className="p-6 w-full bg-white mb-[4rem] space-y-4 sm:p-8 rounded-lg border border-b-0 border-r-0 border-l-0 border-gray-200">
                        <Link to='/home' className='flex gap-2 text-gray-500'>
                            <LeftCircleTwoTone />
                            back
                        </Link>
                        <div className='lg:flex sm-max:flex-col gap-2 justify-center'>
                            {success && (
                                <Popup
                                    type="success"
                                    message="Operation completed successfully!"
                                    duration={2000}
                                    onClose={handlePopupClose}
                                />
                            )}
                            <div className='w-full'>
                                <h1 className="text-xl pt-2 text-start font-bold leading-tight tracking-tight md:text-2xl">
                                    Update Profile
                                </h1>
                                <p className='text-sm text-gray-400 mt-2 mb-5'>Find and update your details</p>
                            </div>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                className="row-col w-full"
                            >
                                <Form.Item
                                    className="text-gray-400"
                                    label={<span className="text-gray-400">Profile Image</span>}
                                    name="image"
                                    valuePropName="filelist"
                                    getValueFromEvent={e => e.file}
                                >
                                    <Upload
                                        name="profileImage"
                                        listType="picture"
                                        showUploadList={true}
                                        beforeUpload={() => false}
                                        onChange={handleImageChange}
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />}>Upload</Button>
                                    </Upload>
                                </Form.Item>
                                <Form.Item
                                    className="text-gray-400"
                                    label={<span className="text-gray-400">Full name</span>}
                                    name="full_name"
                                    rules={[{ required: true, message: "Please enter your full name" }]}
                                >
                                    <Input
                                        id="full_name"
                                        placeholder="Full name"
                                        className="w-full p-2.5 border-t-0 border-l-0 border-r-0 shadow-none focus:ring-0 focus:outline-none outline-none"
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="text-white"
                                    label={<span className="text-gray-400">Phone</span>}
                                    name="phone"
                                    rules={[{ required: true, message: "Please enter your phone number" }]}
                                >
                                    <Input
                                        id="phone"
                                        placeholder="Phone"
                                        className="w-full p-2.5 border-t-0 border-l-0 border-r-0 shadow-none focus:ring-0 focus:outline-none outline-none"
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="text-gray-400"
                                    label={<span className="text-gray-400">Email</span>}
                                    name="email"
                                    rules={[{ required: false, message: "Please enter your email" }]}
                                >
                                    <Input
                                        id="email"
                                        placeholder="example@gmail.com"
                                        className="w-full p-2.5 border-t-0 border-l-0 border-r-0 shadow-none focus:ring-0 focus:outline-none outline-none"
                                        disabled
                                    />
                                </Form.Item>
                                <div className='w-full text-center md:float-end'>
                                    <div className='flex gap-2 items-center justify-center'>
                                        <Form.Item>
                                            <Link to='/home'>
                                                <Button
                                                    // onClick={handleReset}
                                                    htmlType="button"
                                                    className="text-white py-5 p-[14px] rounded-md px-[4rem] font-medium bg-orange-600 hover:bg-orange-500"
                                                >
                                                    Cancel
                                                </Button>
                                            </Link>
                                        </Form.Item>
                                        <Form.Item>
                                            <Button

                                                type="primary"
                                                htmlType="submit"
                                                className="p-5 font-medium px-[4rem]"
                                            >
                                                Update
                                            </Button>
                                        </Form.Item>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfile;
