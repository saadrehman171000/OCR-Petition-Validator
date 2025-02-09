import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/login', { username, password });

      if (response.status === 200) {
        const { user } = response.data;

        // Redirect based on usertype
        if (user.usertype === 'admin') {
          navigate('/admin'); // Redirect to admin page
        } else {
          navigate('/chat'); // Redirect to chat page
        }
      }
    } catch (error) {
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div>
      <h2 color='black'>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;
