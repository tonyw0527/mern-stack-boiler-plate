import React, { useEffect } from 'react';
import { useDispatch } from  'react-redux';
import { auth } from '../_actions/user_action';

// option
//null-- 아무나 출입 가능한 페이지(landing page, about page)
//true -- 로그인한 유저만 출입가능한 페이지(detail page)
//false -- 로그인 유저는 출입 불가능한 페이지(register, login)
// + 관리자만 진입가능한 페이지(어드민 페이지)

export default function(SpecificComponent, option, adminRoute = null) {

    function AuthenticationCheck(props) {

        const dispatch = useDispatch();

        useEffect(() => {

            dispatch(auth())
            .then(response => {
                console.log(response);

                //로그인하지 않은 상태
                if(!response.payload.isAuth) {
                    if(option) {
                        props.history.push('/login')
                    }
                } else {
                    // 로그인한 상태
                    // 만약 어드민만 접근가능한 어드민 페이지를 띄우려하는데 어드민이 아닌 경우
                    if(adminRoute && !response.payload.isAdmin) {
                        props.history.push('/');
                    } else {
                        if(option === false) {
                            props.history.push('/');
                        }
                    }
                }
            });

        }, []);

        return (
            <SpecificComponent />
        );
    }
    return AuthenticationCheck;
}