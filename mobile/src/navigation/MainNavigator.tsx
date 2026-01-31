import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import ChatsScreen from '@screens/main/ChatsScreen';
import ChatScreen from '@screens/main/ChatScreen';
import SettingsScreen from '@screens/main/SettingsScreen';
import CallScreen from '@screens/main/CallScreen';

// Types
import {Chat} from '@types/index';

export type MainStackParamList = {
  Tabs: undefined;
  Chat: {chatId: string; chat?: Chat};
  Call: {chatId: string; userId: string; isVideo: boolean; isIncoming?: boolean};
};

export type TabParamList = {
  Chats: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
        },
        tabBarActiveTintColor: '#0a84ff',
        tabBarInactiveTintColor: '#86868a',
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';

          if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{tabBarLabel: 'Чаты'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{tabBarLabel: 'Настройки'}}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{presentation: 'fullScreenModal'}}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
