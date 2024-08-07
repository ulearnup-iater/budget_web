import React, { useState, useEffect } from 'react';
import { List, Avatar, Button, Skeleton, notification as antNotification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LeftCircleTwoTone } from '@ant-design/icons';
import Headers from '../Layout/Header';
import { supabase } from '../../services/supabaseClient';
import avatar from '../../assets/images/stickman.webp';
import moment from 'moment';
import Loading from '../loading/Loading';
const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [budget_Room, setBudget_Room] = useState(null)
    const [joiningBudgetStatus, setJoiningBudgetStatus] = useState({});
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    const fetchNotifications = async (userId) => {
        setLoading(true);
        /// the room that i join
        try {
            const { data: roomJoined, error: roomJoinedErr } = await supabase
                .from('joining_budget')
                .select()
                .eq('member', userId);

            if (roomJoinedErr) {
                throw roomJoinedErr
            }
            // console.log({ roomJoined })

            /// to tech all my notification
            const myNotification = [];
            await Promise.all(roomJoined.map(async (room, index) => {
                console.log({ room });

                // if (!room.allow) {
                //     return null;
                // }

                const { data: noteNoti, error: noteNOtiErr } = await supabase
                    .from('notification')
                    .select(`
                *,
                budget:budget(id, budget_name, owner),
                user_profile(*)
            `)
                    .eq('budget_room', room.budget_id)
                    .eq('noti_type', 'NOTE')
                    .not('sender', 'eq', userId);

                if (noteNOtiErr) {
                    console.error('Error fetching notifications:', noteNOtiErr);
                    return;
                }

                if (noteNoti) {
                    myNotification.push(...noteNoti);
                }

                // Fetch joining budget notification
                const { data: fetchNotification, error: errorNotification } = await supabase
                    .from('notification')
                    .select(`
                *,
                budget:budget(id, budget_name, owner),
                user_profile(*)
            `)
                    .eq('budget.owner', userId)
                    .eq('budget_room', room.budget_id)
                    .eq('noti_type', 'ACCEPT_JOIN_ROOM')
                    .not('sender', 'eq', userId);

                if (errorNotification) {
                    console.error('Error fetching notifications:', errorNotification);
                    return;
                }
                setBudget_Room(room.budget_id)

                if (fetchNotification) {

                    for (const notification of fetchNotification) {
                        try {
                            // Perform the asynchronous database query
                            const { data: allowJoining, error: allowJoiningError } = await supabase
                                .from('joining_budget')
                                .select('*', { headers: { Accept: 'application/json' } })
                                .eq('budget_id', notification.budget_room)
                                .eq('member', notification.sender);

                            // If there's an error or no data is returned, log the error and skip this iteration
                            if (allowJoiningError || !allowJoining) {
                                console.error(allowJoiningError || 'No data returned');
                                continue;
                            }

                            // Log the result of the query
                            console.log({ allowJoining });

                            // Add the allow field to the notification
                            notification.allow = allowJoining[0].allow;
                        } catch (err) {
                            console.error('Error processing notification:', err);
                        }
                    }

                    // Add all notifications to myNotification
                    myNotification.push(...fetchNotification);
                }
            }));

            console.log({ myNotification: myNotification.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) })
            setNotifications(myNotification);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return;
        } finally {
            setLoading(false);

        }
    };
    // console.log({ notifications })

    useEffect(() => {
        const getSessionAndSubscribe = async () => {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error('Error fetching session:', sessionError);
                return;
            }

            const userId = sessionData.session.user.id;
            setSessionId(userId);
            fetchNotifications(userId);
        };

        getSessionAndSubscribe();
    }, []);

    useEffect(() => {
        console.log({ " session id in realtime": sessionId })
        const channel = supabase.channel('public:notifications')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'joining_budget', filter: `member=eq.${sessionId}` },
                async (payload) => {
                    console.log('Change in joining_budget table:', payload);
                    await fetchNotifications(sessionId); // Re-fetch notifications when approved
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notification', filter: `sender=eq.${sessionId}` },
                async (payload) => {
                    console.log('Change in notification table:', payload);
                    await fetchNotifications(sessionId); // Re-fetch data when a change is detected in 'notification' table
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("subscribe: ", status)
                }
            });

        // Handle potential errors or disconnections
        channel.on('error', (error) => {
            console.error('Error in subscription:', error);
        });

        channel.on('close', () => {
            console.log('Subscription closed');
        });
        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };

    }, [sessionId]);
    // console.log({ sessionId })



    const handleApprove = async (budget_room, sender) => {
        try {
            const { data: accept, error: acceptError } = await supabase
                .from('joining_budget')
                .update({ allow: true })
                .eq('budget_id', budget_room)
                .eq('member', sender)
                .select();
            if (acceptError) {
                throw acceptError;
            }
            // console.log({ accept });
            if (accept) {

                await fetchNotifications(sessionId)
            }

            antNotification.success({
                message: 'Success!',
                description: 'Member has been approved.'
            });

            // setJoiningBudgetStatus((prevStatus) => ({
            //     ...prevStatus,
            //     [budget_room]: true,
            // }));

        } catch (error) {
            console.error('Error approving notification:', error);
            antNotification.error({
                message: 'Approval Failed',
                description: 'There was an error approving the member.'
            });
        } finally {
            setLoading(false);
        }
    };
    console.log({ ready: notifications })

    // if (loading) {
    //     return <Loading />
    // }
    console.log({ notifications })
    return (
        <>
            <Headers />
            {loading ? <Loading /> :
                <div className="w-full mx-auto sm:max-w-[70rem] md:mt-0 xl:p-0">
                    <div className="bg-white p-6 rounded-lg border border-b-0 border-r-0 border-l-0 border-gray-200">
                        <div className="max-w-4xl mx-auto p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <Button onClick={handleBack} icon={<LeftCircleTwoTone />} />
                                <h1 className="text-2xl font-bold">Notifications</h1>
                            </div>
                            <List
                                itemLayout="horizontal"
                                dataSource={notifications}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={
                                            item.noti_type === 'ACCEPT_JOIN_ROOM'
                                                ? [
                                                    item.allow === false
                                                        ? <Button
                                                            type="primary"
                                                            onClick={() => handleApprove(item.budget_room, item.sender)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        : <Button
                                                            type="dashed"
                                                            disabled
                                                        >
                                                            Approved
                                                        </Button>
                                                ]
                                                : item.noti_type === 'NOTE'
                                                    ? [
                                                        <Button
                                                            type="dashed"
                                                            disabled
                                                            className='hidden'
                                                        >
                                                            Approved
                                                        </Button>
                                                    ] :
                                                    null

                                        }
                                    >
                                        <Skeleton avatar title={false} loading={item.loading} active>
                                            <List.Item.Meta
                                                avatar={<Avatar src={`${process.env.IMAGE_URL}${item.user_profile.image}`} />}
                                                title={
                                                    <>
                                                        <div style={{ fontSize: '0.8em', color: 'gray' }}>
                                                            {moment(item.created_at).format('MMMM Do YYYY ')}
                                                        </div>
                                                        <div>{item.noti_type === 'ACCEPT_JOIN_ROOM' ? 'Join Request' : item.budget.budget_name}</div>
                                                    </>
                                                }
                                                description={item.description}
                                            />
                                        </Skeleton>
                                    </List.Item>
                                )}
                            />
                        </div>
                    </div>
                </div>
            }
        </>
    );
};

export default NotificationPage;
