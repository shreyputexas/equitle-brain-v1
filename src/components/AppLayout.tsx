import React from 'react';
import PrivateRoute from './PrivateRoute';
import Layout from './Layout';

export default function AppLayout() {
  return (
    <PrivateRoute>
      <Layout />
    </PrivateRoute>
  );
}

