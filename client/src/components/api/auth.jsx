import axios from 'axios';

export const registerUser = async (data) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 

    return axios.post(`${apiUrl}/api/auth/register`, data, {
        withCredentials: true,
    })
}

export const loginUser = async (data) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 

    return axios.post(`${apiUrl}/api/auth/login`, data, {
        withCredentials: true,
    })
}


