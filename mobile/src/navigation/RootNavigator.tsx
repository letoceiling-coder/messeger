import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '@contexts/AuthContext';

// Auth Screens
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';

// Main Screens
import MainNavigator from './MainNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const {isAuthenticated} = useAuth();

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
